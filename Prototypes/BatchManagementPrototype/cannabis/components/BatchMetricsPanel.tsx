import { Card } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BatchMetricsPanelProps {
  batchId: string;
}

// Mock metrics data
const mockMetricsData = [
  { date: '2025-03-01', temp: 24.5, humidity: 65, vpd: 1.2 },
  { date: '2025-03-02', temp: 25.1, humidity: 63, vpd: 1.3 },
  { date: '2025-03-03', temp: 24.8, humidity: 64, vpd: 1.25 },
  { date: '2025-03-04', temp: 25.5, humidity: 62, vpd: 1.35 },
  { date: '2025-03-05', temp: 24.2, humidity: 66, vpd: 1.18 },
  { date: '2025-03-06', temp: 24.9, humidity: 64, vpd: 1.28 },
  { date: '2025-03-07', temp: 25.3, humidity: 63, vpd: 1.32 },
];

export function BatchMetricsPanel({ batchId }: BatchMetricsPanelProps) {
  // Calculate min/avg/max
  const calculateStats = (key: 'temp' | 'humidity' | 'vpd') => {
    const values = mockMetricsData.map(d => d[key]);
    return {
      min: Math.min(...values).toFixed(2),
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
      max: Math.max(...values).toFixed(2),
    };
  };

  const tempStats = calculateStats('temp');
  const humidityStats = calculateStats('humidity');
  const vpdStats = calculateStats('vpd');

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h4 className="text-gray-900 mb-3">Temperature (°C)</h4>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-gray-500">Min</p>
              <p className="text-gray-900">{tempStats.min}</p>
            </div>
            <div>
              <p className="text-gray-500">Avg</p>
              <p className="text-gray-900">{tempStats.avg}</p>
            </div>
            <div>
              <p className="text-gray-500">Max</p>
              <p className="text-gray-900">{tempStats.max}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="text-gray-900 mb-3">Humidity (%)</h4>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-gray-500">Min</p>
              <p className="text-gray-900">{humidityStats.min}</p>
            </div>
            <div>
              <p className="text-gray-500">Avg</p>
              <p className="text-gray-900">{humidityStats.avg}</p>
            </div>
            <div>
              <p className="text-gray-500">Max</p>
              <p className="text-gray-900">{humidityStats.max}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="text-gray-900 mb-3">VPD (kPa)</h4>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-gray-500">Min</p>
              <p className="text-gray-900">{vpdStats.min}</p>
            </div>
            <div>
              <p className="text-gray-500">Avg</p>
              <p className="text-gray-900">{vpdStats.avg}</p>
            </div>
            <div>
              <p className="text-gray-500">Max</p>
              <p className="text-gray-900">{vpdStats.max}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <Card className="p-6">
        <h4 className="text-gray-900 mb-4">Temperature Trend</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockMetricsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="temp" stroke="#8884d8" name="Temperature (°C)" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h4 className="text-gray-900 mb-4">Humidity & VPD Trend</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockMetricsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="humidity" stroke="#82ca9d" name="Humidity (%)" />
            <Line yAxisId="right" type="monotone" dataKey="vpd" stroke="#ffc658" name="VPD (kPa)" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
