## **Implementation Plan: AUTO Mode Support for Equipment Controls**

### **Phase 1: Discovery & Verification** 🔍

#### **1.1 TagoIO MCP - Device Analysis**
```bash
# Tasks to execute:
1. Query all device types to identify AUTO mode patterns
2. Document all equipment that supports 3-state control (OFF/ON/AUTO)
3. Map metadata fields (mode, schedule, ov, level) for each equipment type
4. Identify any device-specific variations in AUTO mode implementation
```

#### **1.2 Supabase US/Canada MCP - Database Schema Check**
```bash
# Tasks to execute:
1. Check telemetry tables for equipment_state columns
2. Verify if we store mode/schedule/override fields
3. Check equipment_controls table structure
4. Review any stored procedures or triggers for AUTO mode logic
5. Verify RLS policies support AUTO mode updates
```

#### **1.3 Current Codebase Analysis**
```bash
# Files to review:
- /types/telemetry.ts - Update interfaces for 3-state control
- /lib/tagoio/config.ts - Variable mappings
- /components/features/monitoring/* - UI components
- /app/dashboard/monitoring/* - Pages using equipment data
- /lib/supabase/queries/telemetry.ts - Database queries
```

---

### **Phase 2: Type System Updates** 📝

#### **2.1 Core Type Definitions**
```typescript
export enum EquipmentState {
	OFF = 0,
	ON = 1,
	AUTO = 2
}

export enum ControlMode {
	MANUAL = 0,
	AUTOMATIC = 1
}

export interface EquipmentControl {
	state: EquipmentState
	mode: ControlMode
	override: boolean
	schedule_enabled: boolean
	level: number // 0-100%
	last_updated: Date
  
	// Equipment-specific thresholds for AUTO mode
	auto_config?: {
		temp_threshold?: { min: number; max: number }
		humidity_threshold?: { min: number; max: number }
		co2_threshold?: { min: number; max: number }
		schedule?: {
			on_time: string  // "06:00"
			off_time: string // "18:00"
		}
	}
}
```

#### **2.2 Update Telemetry Types**
```typescript
import { EquipmentControl } from './equipment'

export interface TelemetryData {
	// Environmental readings (unchanged)
	temperature_c: number
	humidity_pct: number
	co2_ppm: number
	vpd_kpa: number
  
	// Equipment controls (UPDATED to EquipmentControl)
	cooling: EquipmentControl
	heating: EquipmentControl
	dehumidifier: EquipmentControl
	humidifier: EquipmentControl
	co2_injection: EquipmentControl
	exhaust_fan: EquipmentControl
	circulation_fan: EquipmentControl
	lighting: EquipmentControl
  
	// Sensor health (unchanged)
	sensor_health: SensorHealth
}
```

---

### **Phase 3: Database Schema Updates** 🗄️

#### **3.1 Supabase Migration**
```sql
-- Add equipment_controls table if not exists
CREATE TABLE IF NOT EXISTS equipment_controls (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
	equipment_type VARCHAR(50) NOT NULL,
	state INTEGER NOT NULL CHECK (state IN (0, 1, 2)), -- OFF/ON/AUTO
	mode INTEGER NOT NULL CHECK (mode IN (0, 1)), -- MANUAL/AUTOMATIC
	override BOOLEAN DEFAULT FALSE,
	schedule_enabled BOOLEAN DEFAULT FALSE,
	level INTEGER CHECK (level >= 0 AND level <= 100),
	auto_config JSONB,
	created_at TIMESTAMPTZ DEFAULT NOW(),
	updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_equipment_controls_device ON equipment_controls(device_id);
CREATE INDEX idx_equipment_controls_type ON equipment_controls(equipment_type);
CREATE INDEX idx_equipment_controls_state ON equipment_controls(state);

-- Update telemetry_realtime table
ALTER TABLE telemetry_realtime 
ADD COLUMN IF NOT EXISTS equipment_states JSONB;

-- RLS Policies
ALTER TABLE equipment_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view equipment controls for their sites"
ON equipment_controls FOR SELECT
USING (
	device_id IN (
		SELECT id FROM devices 
		WHERE site_id IN (
			SELECT site_id FROM users WHERE id = auth.uid()
		)
	)
);

CREATE POLICY "Operators and above can update equipment controls"
ON equipment_controls FOR UPDATE
USING (
	device_id IN (
		SELECT id FROM devices 
		WHERE site_id IN (
			SELECT site_id FROM users 
			WHERE id = auth.uid() 
			AND role IN ('site_admin', 'facility_manager', 'head_grower', 'grower', 'operator')
		)
	)
);
```

---

### **Phase 4: TagoIO Integration Updates** 🔌

#### **4.1 Update Variable Mappings**
```typescript
import { EquipmentState, ControlMode, EquipmentControl } from '@/types/equipment'

export function mapTagoIOToEquipmentControl(
	tagoData: any
): EquipmentControl {
	return {
		state: tagoData.value as EquipmentState, // 0/1/2
		mode: tagoData.metadata?.mode ?? ControlMode.MANUAL,
		override: tagoData.metadata?.ov === 1,
		schedule_enabled: tagoData.metadata?.schedule === 1,
		level: tagoData.metadata?.level ?? 0,
		last_updated: new Date(tagoData.time),
		auto_config: extractAutoConfig(tagoData.metadata)
	}
}

function extractAutoConfig(metadata: any) {
	if (!metadata) return undefined
  
	return {
		temp_threshold: metadata.temp_min && metadata.temp_max 
			? { min: metadata.temp_min, max: metadata.temp_max }
			: undefined,
		humidity_threshold: metadata.hum_min && metadata.hum_max
			? { min: metadata.hum_min, max: metadata.hum_max }
			: undefined,
		co2_threshold: metadata.co2_min && metadata.co2_max
			? { min: metadata.co2_min, max: metadata.co2_max }
			: undefined,
		schedule: metadata.on_time && metadata.off_time
			? { on_time: metadata.on_time, off_time: metadata.off_time }
			: undefined
	}
}
```

#### **4.2 Update Data Fetching**
```typescript
import { mapTagoIOToEquipmentControl } from './equipment-mapper'

export async function fetchDeviceTelemetry(deviceId: string) {
	// Fetch environmental data
	const envData = await tagoio.devices.data.find(deviceId, {
		variables: ['temp', 'hum', 'co2'],
		qty: 1
	})
  
	// Fetch equipment states with metadata
	const equipmentData = await tagoio.devices.data.find(deviceId, {
		variables: [
			'cooling_valve', 'heating_valve', 'dehum', 'humidifier',
			'co2_valve', 'ex_fan', 'circ_fan', 'light_state'
		],
		qty: 1,
		details: true // Include metadata
	})
  
	return {
		environmental: processEnvironmentalData(envData),
		equipment: {
			cooling: mapTagoIOToEquipmentControl(equipmentData.cooling_valve),
			heating: mapTagoIOToEquipmentControl(equipmentData.heating_valve),
			dehumidifier: mapTagoIOToEquipmentControl(equipmentData.dehum),
			// ... map all equipment
		}
	}
}
```

---

### **Phase 5: UI Components** 🎨

#### **5.1 Equipment Control Component**
```tsx
'use client'

import { EquipmentState, EquipmentControl } from '@/types/equipment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { 
	Thermometer, Droplets, Wind, Lightbulb, 
	Settings, Calendar, Power 
} from 'lucide-react'

interface EquipmentControlCardProps {
	title: string
	icon: React.ReactNode
	control: EquipmentControl
	onStateChange: (state: EquipmentState) => Promise<void>
	onLevelChange?: (level: number) => Promise<void>
	canEdit: boolean
}

export function EquipmentControlCard({
	title,
	icon,
	control,
	onStateChange,
	onLevelChange,
	canEdit
}: EquipmentControlCardProps) {
	const stateColors = {
		[EquipmentState.OFF]: 'bg-gray-500',
		[EquipmentState.ON]: 'bg-green-500',
		[EquipmentState.AUTO]: 'bg-blue-500'
	}
  
	const stateLabels = {
		[EquipmentState.OFF]: 'OFF',
		[EquipmentState.ON]: 'MANUAL',
		[EquipmentState.AUTO]: 'AUTO'
	}
  
	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						{icon}
						<span>{title}</span>
					</CardTitle>
					<Badge className={stateColors[control.state]}>
						{stateLabels[control.state]}
					</Badge>
				</div>
			</CardHeader>
      
			<CardContent className="space-y-4">
				{/* State Control Buttons */}
				<div className="flex gap-2">
					{Object.entries(stateLabels).map(([state, label]) => (
						<Button
							key={state}
							variant={control.state === Number(state) ? 'default' : 'outline'}
							size="sm"
							disabled={!canEdit}
							onClick={() => onStateChange(Number(state) as EquipmentState)}
							className="flex-1"
						>
							{label}
						</Button>
					))}
				</div>
        
				{/* Power Level (if not OFF) */}
				{control.state !== EquipmentState.OFF && (
					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span>Power Level</span>
							<span className="font-mono">{control.level}%</span>
						</div>
						<Slider
							value={[control.level]}
							onValueChange={([value]) => onLevelChange?.(value)}
							disabled={!canEdit || control.state === EquipmentState.AUTO}
							max={100}
							step={10}
							className="w-full"
						/>
					</div>
				)}
        
				{/* AUTO Mode Settings */}
				{control.state === EquipmentState.AUTO && control.auto_config && (
					<div className="pt-2 border-t space-y-2">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Settings className="h-4 w-4" />
							<span>Auto Configuration</span>
						</div>
            
						{control.auto_config.temp_threshold && (
							<div className="text-sm">
								<Thermometer className="inline h-3 w-3 mr-1" />
								Temp: {control.auto_config.temp_threshold.min}°C - {control.auto_config.temp_threshold.max}°C
							</div>
						)}
            
						{control.auto_config.schedule && (
							<div className="text-sm">
								<Calendar className="inline h-3 w-3 mr-1" />
								Schedule: {control.auto_config.schedule.on_time} - {control.auto_config.schedule.off_time}
							</div>
						)}
					</div>
				)}
        
				{/* Status Indicators */}
				<div className="flex gap-4 text-xs">
					<div className="flex items-center gap-1">
						<div className={`h-2 w-2 rounded-full ${control.override ? 'bg-orange-500' : 'bg-gray-300'}`} />
						<span>Override</span>
					</div>
					<div className="flex items-center gap-1">
						<div className={`h-2 w-2 rounded-full ${control.schedule_enabled ? 'bg-blue-500' : 'bg-gray-300'}`} />
						<span>Schedule</span>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
```

---

### **Phase 6: Testing & Validation** ✅

#### **6.1 Test Plan**
1. **Unit Tests**: Equipment mapper functions
2. **Integration Tests**: TagoIO data fetching with AUTO states
3. **Component Tests**: UI state transitions
4. **E2E Tests**: Full AUTO mode workflow

#### **6.2 Validation Checklist**
- [ ] Verify all 3 states (OFF/ON/AUTO) work for each equipment type
- [ ] Confirm mode metadata correctly indicates manual vs automatic
- [ ] Test schedule enable/disable functionality
- [ ] Verify override behavior when switching from AUTO to MANUAL
- [ ] Validate power level control in different states
- [ ] Test permission checks for equipment control updates
- [ ] Verify database persistence of AUTO configurations
- [ ] Test real-time updates from TagoIO to UI

---

### **Execution Order** 📋

- [x] **Week 1**: Discovery & Type System
	 - Use MCPs to audit current state
	 - Update TypeScript interfaces
	 - Document findings

- [ ] **Week 2**: Backend Integration
	 - Database migrations
	 - TagoIO mapper implementation
	 - Supabase query updates

- [ ] **Week 3**: Frontend Implementation
	 - Build equipment control components
	 - Update monitoring dashboard
	 - Add AUTO mode configuration UI

= [ ] **Week 4**: Testing & Deployment
	 - Write comprehensive tests
	 - Fix edge cases
	 - Deploy to staging
	 - Production rollout

This plan ensures we properly implement AUTO mode support while maintaining the existing system's integrity and following TRAZO's established patterns.
