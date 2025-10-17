import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import type { ChartDataPoint, OverlayEvent } from '../../types/telemetry';
import { AlertCircle, Droplet, TrendingUp } from 'lucide-react';

interface EnvironmentChartProps {
  data: ChartDataPoint[];
  events: OverlayEvent[];
  timezone: string;
}

type MetricType = 'temp' | 'rh' | 'co2' | 'light' | 'vpd';

export function EnvironmentChart({ data, events, timezone }: EnvironmentChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('temp');
  
  // Format data for display
  const formattedData = data.map(point => ({
    ...point,
    time: point.timestamp.toLocaleTimeString('en-US', { 
      timeZone: timezone, 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
    }),
    timestamp_full: point.timestamp.toLocaleString('en-US', {
      timeZone: timezone,
    }),
  }));
  
  // Metric configuration
  const metrics: Record<MetricType, {
    label: string;
    dataKey: string;
    setpointKey: string;
    unit: string;
    color: string;
    setpointColor: string;
  }> = {
    temp: {
      label: 'Temperature',
      dataKey: 'temp',
      setpointKey: 'setpoint_temp',
      unit: '°C',
      color: '#ef4444',
      setpointColor: '#f87171',
    },
    rh: {
      label: 'Relative Humidity',
      dataKey: 'rh',
      setpointKey: 'setpoint_rh',
      unit: '%',
      color: '#3b82f6',
      setpointColor: '#60a5fa',
    },
    co2: {
      label: 'CO₂',
      dataKey: 'co2',
      setpointKey: 'setpoint_co2',
      unit: 'ppm',
      color: '#10b981',
      setpointColor: '#34d399',
    },
    light: {
      label: 'Lighting',
      dataKey: 'light',
      setpointKey: 'setpoint_light',
      unit: '%',
      color: '#f59e0b',
      setpointColor: '#fbbf24',
    },
    vpd: {
      label: 'VPD',
      dataKey: 'vpd',
      setpointKey: '',
      unit: 'kPa',
      color: '#8b5cf6',
      setpointColor: '',
    },
  };
  
  const currentMetric = metrics[selectedMetric];
  
  // Filter events visible in chart
  const alarmEvents = events.filter(e => e.type === 'alarm_event');
  const setpointEvents = events.filter(e => e.type === 'setpoint_change');
  const irrigationEvents = events.filter(e => e.type === 'irrigation_cycle');
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Environmental Trends</CardTitle>
          <Tabs value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as MetricType)}>
            <TabsList>
              <TabsTrigger value="temp">Temp</TabsTrigger>
              <TabsTrigger value="rh">RH</TabsTrigger>
              <TabsTrigger value="co2">CO₂</TabsTrigger>
              <TabsTrigger value="light">Light</TabsTrigger>
              <TabsTrigger value="vpd">VPD</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Event Legend */}
        <div className="flex flex-wrap gap-2 mt-3">
          {alarmEvents.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              {alarmEvents.length} Alarm{alarmEvents.length > 1 ? 's' : ''}
            </Badge>
          )}
          {setpointEvents.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              {setpointEvents.length} Setpoint Change{setpointEvents.length > 1 ? 's' : ''}
            </Badge>
          )}
          {irrigationEvents.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <Droplet className="w-3 h-3 mr-1" />
              {irrigationEvents.length} Irrigation Cycle{irrigationEvents.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: currentMetric.unit, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                
                const data = payload[0].payload;
                
                return (
                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="text-sm mb-2">{data.timestamp_full}</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: currentMetric.color }}
                        />
                        <span className="text-sm">
                          Actual: {payload[0].value} {currentMetric.unit}
                        </span>
                      </div>
                      {currentMetric.setpointKey && payload[1] && (
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: currentMetric.setpointColor }}
                          />
                          <span className="text-sm">
                            Setpoint: {payload[1].value} {currentMetric.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            <Legend />
            
            {/* Main data line */}
            <Line 
              type="monotone" 
              dataKey={currentMetric.dataKey}
              stroke={currentMetric.color}
              strokeWidth={2}
              dot={false}
              name={`${currentMetric.label} (Actual)`}
            />
            
            {/* Setpoint line */}
            {currentMetric.setpointKey && (
              <Line 
                type="monotone" 
                dataKey={currentMetric.setpointKey}
                stroke={currentMetric.setpointColor}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name={`${currentMetric.label} (Setpoint)`}
              />
            )}
            
            {/* Event markers */}
            {alarmEvents.map((event, idx) => {
              const eventTime = event.ts_utc.toLocaleTimeString('en-US', { 
                timeZone: timezone, 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false,
              });
              return (
                <ReferenceLine
                  key={`alarm-${idx}`}
                  x={eventTime}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  label={{
                    value: '⚠',
                    position: 'top',
                    fill: '#ef4444',
                  }}
                />
              );
            })}
            
            {irrigationEvents.map((event, idx) => {
              const eventTime = event.ts_utc.toLocaleTimeString('en-US', { 
                timeZone: timezone, 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false,
              });
              return (
                <ReferenceLine
                  key={`irr-${idx}`}
                  x={eventTime}
                  stroke="#3b82f6"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  label={{
                    value: '💧',
                    position: 'bottom',
                  }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
        
        {/* Event details */}
        {events.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm">Recent Events:</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {events.slice().reverse().slice(0, 5).map(event => (
                <div key={event.id} className="text-xs p-2 bg-muted rounded flex items-start gap-2">
                  <span className="text-muted-foreground">
                    {event.ts_utc.toLocaleString('en-US', { timeZone: timezone })}
                  </span>
                  <span>•</span>
                  <span>
                    {event.type === 'alarm_event' && `⚠️ Alarm: ${event.attrs.message}`}
                    {event.type === 'setpoint_change' && `📊 Setpoint changed: ${event.attrs.parameter}`}
                    {event.type === 'irrigation_cycle' && `💧 Irrigation: Zone ${event.attrs.zone}, ${event.attrs.duration_min}min, ${event.attrs.volume_L}L`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
