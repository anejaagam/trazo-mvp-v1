/**
 * EnvironmentChart Component
 * 
 * Time-series chart for environmental metrics (temp, humidity, CO2, VPD)
 * Uses Recharts for visualization with real historical data
 * 
 * Features:
 * - Time range selector: Past Hour, Past Day, Past Week, Custom Range
 * - Custom range fetches directly from TagoIO without storing in Supabase
 * - 7-day data retention in Supabase with automatic cleanup
 * 
 * Migrated from: /Prototypes/MonitoringAndTelemeteryPrototype/components/dashboard/EnvironmentChart.tsx
 * Created: October 29, 2025
 * Phase: 4 - Component Migration (Tier 1)
 * Updated: October 30, 2025 - Added time range selector and custom date range support
 */

'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { useHistoricalTelemetry } from '@/hooks/use-telemetry';
import { usePermissions } from '@/hooks/use-permissions';
import { getCustomRangeReadings } from '@/app/actions/monitoring';
import type { TelemetryReading } from '@/types/telemetry';
import { cn } from '@/lib/utils';

interface EnvironmentChartProps {
  podId: string;
  deviceToken?: string; // TagoIO device token for custom range fetching
  hours?: number;
  limit?: number;
}

type MetricType = 'temp' | 'humidity' | 'co2' | 'vpd' | 'all';
type TimeRange = '1h' | '24h' | '7d' | 'custom';

type ChartDatum = {
  timestamp: string;
  time: string;
  temperature_c: number | null;
  humidity_pct: number | null;
  co2_ppm: number | null;
  vpd_kpa: number | null;
};

const metrics: Record<MetricType, {
  label: string;
  dataKey: string;
  unit: string;
  color: string;
}> = {
  temp: {
    label: 'Temperature',
    dataKey: 'temperature_c',
    unit: '°C',
    color: '#ef4444',
  },
  humidity: {
    label: 'Humidity',
    dataKey: 'humidity_pct',
    unit: '%',
    color: '#3b82f6',
  },
  co2: {
    label: 'CO₂',
    dataKey: 'co2_ppm',
    unit: 'ppm',
    color: '#10b981',
  },
  vpd: {
    label: 'VPD',
    dataKey: 'vpd_kpa',
    unit: 'kPa',
    color: '#8b5cf6',
  },
  all: {
    label: 'All Metrics',
    dataKey: 'all',
    unit: '',
    color: '',
  },
};

/**
 * Calculate VPD if not provided
 */
function calculateVPD(tempC: number | null, rhPct: number | null): number | null {
  if (tempC === null || rhPct === null) return null;
  const svp = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  return svp * (1 - rhPct / 100);
}

export function EnvironmentChart({ 
  podId, 
  deviceToken,
  hours = 24,
  limit = 1000
}: EnvironmentChartProps) {
  console.log('🟢 EnvironmentChart rendered with deviceToken:', deviceToken);
  
  const { can } = usePermissions('org_admin');
  
  // State management
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('temp');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [customReadings, setCustomReadings] = useState<TelemetryReading[] | null>(null);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  
  // Calculate hours based on time range selection
  const selectedHours = useMemo(() => {
    switch (timeRange) {
      case '1h': return 1;
      case '24h': return 24;
      case '7d': return 24 * 7;
      case 'custom': return hours; // Fallback, won't be used for custom
      default: return 24;
    }
  }, [timeRange, hours]);
  
  // Fetch from Supabase for standard ranges (1h, 24h, 7d)
  const { readings: supabaseReadings, loading: supabaseLoading, error: supabaseError } = useHistoricalTelemetry({
    podId,
    hours: selectedHours,
    limit,
  });
  
  // Determine which data source to use
  const readings = useMemo(() => {
    return timeRange === 'custom' ? (customReadings || []) : supabaseReadings;
  }, [timeRange, customReadings, supabaseReadings]);
  
  const loading = timeRange === 'custom' ? isLoadingCustom : supabaseLoading;
  const error = timeRange === 'custom' ? customError : supabaseError ? String(supabaseError) : null;
  
  // Handle custom date range fetch
  const handleCustomRangeFetch = async () => {
    console.log('🔵 handleCustomRangeFetch called');
    console.log('  deviceToken:', deviceToken);
    console.log('  customDateRange:', customDateRange);
    console.log('  from:', customDateRange?.from);
    console.log('  to:', customDateRange?.to);
    
    if (!customDateRange?.from || !customDateRange?.to) {
      setCustomError('Please select both start and end dates');
      console.log('❌ Missing date range');
      return;
    }
    
    if (!deviceToken) {
      setCustomError('Device token not available for custom range fetching');
      console.log('❌ Missing device token');
      return;
    }
    
    console.log('✅ Validation passed, fetching data...');
    setIsLoadingCustom(true);
    setCustomError(null);
    
    try {
      const result = await getCustomRangeReadings(
        podId,
        deviceToken,
        customDateRange.from.toISOString(),
        customDateRange.to.toISOString()
      );
      
      console.log('📊 Result:', result);
      
      if (result.error) {
        setCustomError(result.error);
        setCustomReadings(null);
        console.log('❌ Error from server:', result.error);
      } else {
        setCustomReadings(result.data);
        setCustomError(null);
        console.log('✅ Custom readings loaded:', result.data?.length || 0, 'records');
      }
    } catch (err) {
      console.error('Error fetching custom range:', err);
      setCustomError(err instanceof Error ? err.message : 'Failed to fetch custom range data');
      setCustomReadings(null);
    } finally {
      setIsLoadingCustom(false);
    }
  };

  // Format data for Recharts with adaptive time formatting
  const chartData = useMemo(() => {
    // Filter out readings where ALL metrics are null (invalid data points)
    const validReadings = readings.filter(reading => 
      reading.temperature_c !== null || 
      reading.humidity_pct !== null || 
      reading.co2_ppm !== null
    );

    return validReadings.map(reading => {
      const timestamp = new Date(reading.timestamp);
      
      // Adaptive time formatting based on time range
      let timeLabel: string;
      if (timeRange === '1h') {
        // For 1 hour: show HH:MM
        timeLabel = timestamp.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      } else if (timeRange === '24h') {
        // For 24 hours: show HH:MM
        timeLabel = timestamp.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      } else if (timeRange === '7d') {
        // For 7 days: show MMM DD HH:MM
        timeLabel = `${timestamp.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })} ${timestamp.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}`;
      } else {
        // For custom range: show full date and time
        timeLabel = timestamp.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: customDateRange?.from && customDateRange?.to && 
                Math.abs(customDateRange.to.getFullYear() - customDateRange.from.getFullYear()) > 0 
                ? 'numeric' 
                : undefined,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      }
      
      return {
        timestamp: reading.timestamp,
        time: timeLabel,
        temperature_c: reading.temperature_c,
        humidity_pct: reading.humidity_pct,
        co2_ppm: reading.co2_ppm,
        vpd_kpa: reading.vpd_kpa ?? calculateVPD(reading.temperature_c, reading.humidity_pct),
      };
    });
  }, [readings, timeRange, customDateRange]);

  // Permission check
  if (!can('monitoring:view')) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">No permission to view monitoring data</p>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loading && chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Environmental Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Environmental Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-sm text-destructive">
              Failed to load chart data: {error}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (chartData.length === 0) {
    // Special message for custom range mode - BUT STILL SHOW THE DATE PICKER
    if (timeRange === 'custom') {
      return (
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div>
                <CardTitle>Environmental Trends</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Custom Date Range</p>
              </div>
              
              {/* Time Range Selector */}
              <div className="flex items-center gap-2 flex-wrap">
                <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                  <TabsList>
                    <TabsTrigger value="1h">Past Hour</TabsTrigger>
                    <TabsTrigger value="24h">Past Day</TabsTrigger>
                    <TabsTrigger value="7d">Past Week</TabsTrigger>
                    <TabsTrigger value="custom">Custom</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {/* Custom Date Range Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !customDateRange && "text-muted-foreground"
                      )}
                      onClick={() => console.log('📅 Calendar button clicked')}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange?.from ? (
                        customDateRange.to ? (
                          <>
                            {format(customDateRange.from, "LLL dd, y")} -{" "}
                            {format(customDateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(customDateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      defaultMonth={customDateRange?.from}
                      selected={customDateRange}
                      onSelect={(range: DateRange | undefined) => {
                        console.log('📅 Date range selected:', range);
                        setCustomDateRange(range);
                      }}
                      numberOfMonths={2}
                      disabled={(date) => date > new Date() || date < new Date('2020-01-01')}
                    />
                  </PopoverContent>
                </Popover>
                
                <Button 
                  onClick={() => {
                    console.log('🔴 Button clicked!');
                    console.log('  Button disabled?', !customDateRange?.from || !customDateRange?.to || isLoadingCustom || !deviceToken);
                    handleCustomRangeFetch();
                  }}
                  disabled={!customDateRange?.from || !customDateRange?.to || isLoadingCustom || !deviceToken}
                >
                  {isLoadingCustom ? 'Fetching...' : 'Fetch Data'}
                </Button>
              </div>
              
              {/* Warning for custom range without device token */}
              {!deviceToken && (
                <p className="text-sm text-amber-600">
                  Device token not available. Custom range fetching requires TagoIO integration.
                </p>
              )}
              
              {customError && (
                <p className="text-sm text-destructive">
                  {customError}
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Select a date range and click &quot;Fetch Data&quot; to view historical data
                </p>
                <p className="text-xs text-muted-foreground">
                  Custom range data is fetched from TagoIO and not stored in the database
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Environmental Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No data available for the selected time period
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentMetric = metrics[selectedMetric];

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          {/* Title and Metric Selector */}
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Environmental Trends</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {timeRange === 'custom' 
                  ? customDateRange?.from && customDateRange?.to
                    ? `${format(customDateRange.from, 'MMM d')} - ${format(customDateRange.to, 'MMM d, yyyy')}`
                    : 'Select custom date range'
                  : `Last ${selectedHours} ${selectedHours === 1 ? 'hour' : 'hours'}`
                } • {chartData.length} readings
              </p>
            </div>
            <Tabs value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as MetricType)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="temp">Temp</TabsTrigger>
                <TabsTrigger value="humidity">RH</TabsTrigger>
                <TabsTrigger value="co2">CO₂</TabsTrigger>
                <TabsTrigger value="vpd">VPD</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <TabsList>
                <TabsTrigger value="1h">Past Hour</TabsTrigger>
                <TabsTrigger value="24h">Past Day</TabsTrigger>
                <TabsTrigger value="7d">Past Week</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Custom Date Range Picker */}
            {timeRange === 'custom' && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !customDateRange && "text-muted-foreground"
                      )}
                      onClick={() => console.log('📅 Calendar button clicked')}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange?.from ? (
                        customDateRange.to ? (
                          <>
                            {format(customDateRange.from, "LLL dd, y")} -{" "}
                            {format(customDateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(customDateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      defaultMonth={customDateRange?.from}
                      selected={customDateRange}
                      onSelect={(range: DateRange | undefined) => {
                        console.log('📅 Date range selected:', range);
                        setCustomDateRange(range);
                      }}
                      numberOfMonths={2}
                      disabled={(date) => date > new Date() || date < new Date('2020-01-01')}
                    />
                  </PopoverContent>
                </Popover>
                
                <Button 
                  onClick={() => {
                    console.log('🔴 Button clicked!');
                    console.log('  Button disabled?', !customDateRange?.from || !customDateRange?.to || isLoadingCustom || !deviceToken);
                    handleCustomRangeFetch();
                  }}
                  disabled={!customDateRange?.from || !customDateRange?.to || isLoadingCustom || !deviceToken}
                >
                  {isLoadingCustom ? 'Fetching...' : 'Fetch Data'}
                </Button>
              </div>
            )}
          </div>
          
          {/* Warning for custom range without device token */}
          {timeRange === 'custom' && !deviceToken && (
            <p className="text-sm text-amber-600">
              Device token not available. Custom range fetching requires TagoIO integration.
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {selectedMetric === 'all' ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                interval={chartData.length > 100 ? Math.floor(chartData.length / 10) : 'preserveStartEnd'}
                angle={timeRange === '7d' || timeRange === 'custom' ? -45 : 0}
                textAnchor={timeRange === '7d' || timeRange === 'custom' ? 'end' : 'middle'}
                height={timeRange === '7d' || timeRange === 'custom' ? 80 : 60}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12 }}
                label={{
                  value: '°C / % / kPa',
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                label={{
                  value: 'CO₂ (ppm)',
                  angle: 90,
                  position: 'insideRight',
                }}
              />
              <Tooltip
                content={(tooltipProps: TooltipContentProps<number, string>) => {
                  const { active, payload } = tooltipProps;
                  const entries = payload as ReadonlyArray<{ payload: ChartDatum }> | undefined;
                  if (!active || !entries || !entries.length) return null;

                  const data = entries[0]?.payload;
                  if (!data) return null;

                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(data.timestamp).toLocaleString()}
                      </p>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-semibold" style={{ color: metrics.temp.color }}>Temp:</span>{' '}
                          {data.temperature_c !== null ? Number(data.temperature_c).toFixed(1) : '--'} °C
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold" style={{ color: metrics.humidity.color }}>RH:</span>{' '}
                          {data.humidity_pct !== null ? Number(data.humidity_pct).toFixed(1) : '--'} %
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold" style={{ color: metrics.co2.color }}>CO₂:</span>{' '}
                          {data.co2_ppm !== null ? Number(data.co2_ppm).toFixed(0) : '--'} ppm
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold" style={{ color: metrics.vpd.color }}>VPD:</span>{' '}
                          {data.vpd_kpa !== null ? Number(data.vpd_kpa).toFixed(2) : '--'} kPa
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="temperature_c"
                stroke={metrics.temp.color}
                strokeWidth={2}
                dot={false}
                connectNulls={true}
                name="Temperature (°C)"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="humidity_pct"
                stroke={metrics.humidity.color}
                strokeWidth={2}
                dot={false}
                connectNulls={true}
                name="Humidity (%)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="co2_ppm"
                stroke={metrics.co2.color}
                strokeWidth={2}
                dot={false}
                connectNulls={true}
                name="CO₂ (ppm)"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="vpd_kpa"
                stroke={metrics.vpd.color}
                strokeWidth={2}
                dot={false}
                connectNulls={true}
                name="VPD (kPa)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                interval={chartData.length > 100 ? Math.floor(chartData.length / 10) : 'preserveStartEnd'}
                angle={timeRange === '7d' || timeRange === 'custom' ? -45 : 0}
                textAnchor={timeRange === '7d' || timeRange === 'custom' ? 'end' : 'middle'}
                height={timeRange === '7d' || timeRange === 'custom' ? 80 : 60}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{
                  value: currentMetric.unit,
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <Tooltip
                content={(tooltipProps: TooltipContentProps<number, string>) => {
                  const { active, payload } = tooltipProps;
                  const entries = payload as ReadonlyArray<{ payload: ChartDatum & Record<string, unknown> }> | undefined;
                  if (!active || !entries || !entries.length) return null;

                  const data = entries[0]?.payload;
                  if (!data) return null;
                  const value = data[currentMetric.dataKey as keyof ChartDatum] as number | null | undefined;

                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="text-xs text-muted-foreground mb-1">
                        {new Date(data.timestamp).toLocaleString()}
                      </p>
                      <p className="font-semibold">
                        {currentMetric.label}: {value != null ? Number(value).toFixed(2) : '--'} {currentMetric.unit}
                      </p>
                    </div>
                  );
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={currentMetric.dataKey}
                stroke={currentMetric.color}
                strokeWidth={2}
                dot={false}
                connectNulls={true}
                name={currentMetric.label}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
