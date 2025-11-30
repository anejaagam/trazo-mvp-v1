import { render, screen, fireEvent } from '@testing-library/react'
import { EquipmentControlCard } from '../equipment-control-card'
import { EquipmentType, EquipmentState, ControlMode } from '@/types/equipment'
import type { EquipmentControlRecord } from '@/types/equipment'

// Mock usePermissions hook
jest.mock('@/hooks/use-permissions', () => ({
  usePermissions: () => ({
    // Grant all permissions for testing scenarios by default
    can: jest.fn(() => true),
  }),
}))

// Helper factory to create a minimal EquipmentControlRecord for tests
function createEquipmentRecord(partial: Partial<EquipmentControlRecord> = {}): EquipmentControlRecord {
  return {
    id: partial.id || 'eq-1',
    pod_id: partial.pod_id || 'pod-1',
    equipment_type: partial.equipment_type || EquipmentType.COOLING,
    state: partial.state ?? EquipmentState.OFF,
    mode: partial.mode ?? ControlMode.MANUAL,
    override: partial.override ?? false,
    schedule_enabled: partial.schedule_enabled ?? false,
    level: partial.level ?? 0,
    auto_config: partial.auto_config, // optional
    created_at: partial.created_at || new Date().toISOString(),
    updated_at: partial.updated_at || new Date().toISOString(),
  }
}

describe('EquipmentControlCard', () => {
  const mockOnStateChange = jest.fn()

  const baseEquipment = createEquipmentRecord({})

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering (compact vs full)', () => {
    it('renders equipment name and state badge in compact/default (no overrideMode)', () => {
      render(<EquipmentControlCard equipment={baseEquipment} onStateChange={mockOnStateChange} />)
      expect(screen.getByText('Cooling')).toBeInTheDocument()
      // OFF state label
      expect(screen.getByText('OFF')).toBeInTheDocument()
      // No control buttons in compact/default view
      expect(screen.queryByText('ON')).not.toBeInTheDocument()
    })

    it('renders full control view when overrideMode is true', () => {
      render(<EquipmentControlCard equipment={baseEquipment} overrideMode onStateChange={mockOnStateChange} />)
      expect(screen.getByText('OFF')).toBeInTheDocument()
      expect(screen.getByText('ON')).toBeInTheDocument()
      expect(screen.getByText('AUTO')).toBeInTheDocument()
    })

    it('shows current power level when ON in full view', () => {
      const eq = createEquipmentRecord({ state: EquipmentState.ON, level: 75 })
      render(<EquipmentControlCard equipment={eq} overrideMode onStateChange={mockOnStateChange} />)
      // Badge should include MANUAL label (state label for ON) and level
      expect(screen.getByText('MANUAL')).toBeInTheDocument()
      expect(screen.getByText(/75%/)).toBeInTheDocument()
    })
  })

  describe('3-State Control interactions', () => {
    it('renders OFF, ON, AUTO buttons in full view', () => {
      render(<EquipmentControlCard equipment={baseEquipment} overrideMode onStateChange={mockOnStateChange} />)
      expect(screen.getByText('OFF')).toBeInTheDocument()
      expect(screen.getByText('ON')).toBeInTheDocument()
      expect(screen.getByText('AUTO')).toBeInTheDocument()
    })

    it('calls onStateChange with equipment id, new state and level (if ON)', () => {
      const eq = createEquipmentRecord({})
      render(<EquipmentControlCard equipment={eq} overrideMode onStateChange={mockOnStateChange} />)
      const onBtn = screen.getByText('ON').closest('button')
      if (onBtn) fireEvent.click(onBtn)
      expect(mockOnStateChange).toHaveBeenCalledWith(eq.id, EquipmentState.ON, 0)
    })
  })

  describe('Power Level Slider', () => {
    it('shows slider when state is ON in full view', () => {
      const eq = createEquipmentRecord({ state: EquipmentState.ON, level: 50 })
      render(<EquipmentControlCard equipment={eq} overrideMode onStateChange={mockOnStateChange} />)
      const slider = screen.getByRole('slider')
      expect(slider).toBeInTheDocument()
      expect(slider).toHaveAttribute('aria-valuenow', '50')
    })

    it('hides slider when OFF', () => {
      render(<EquipmentControlCard equipment={baseEquipment} overrideMode onStateChange={mockOnStateChange} />)
      expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    })

    it('hides slider in AUTO state', () => {
      const eq = createEquipmentRecord({ state: EquipmentState.AUTO, mode: ControlMode.AUTOMATIC })
      render(<EquipmentControlCard equipment={eq} overrideMode onStateChange={mockOnStateChange} />)
      expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    })
  })

  // Component no longer renders AUTO configuration details; tests removed

  // Override toggle tests removed - component simplified

  describe('Equipment Type Name Formatting', () => {
    it('formats equipment type with underscores into spaced words', () => {
      const eq = createEquipmentRecord({ equipment_type: EquipmentType.CO2_INJECTION })
      render(<EquipmentControlCard equipment={eq} onStateChange={mockOnStateChange} />)
      // Name rendered in compact view
      expect(screen.getByText('Co2 Injection')).toBeInTheDocument()
    })
  })

})
