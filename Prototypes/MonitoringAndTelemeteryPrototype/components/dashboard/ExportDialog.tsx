import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { generateCSV, generateExportFilename } from '../../lib/telemetry';
import type { ChartDataPoint, UserRole } from '../../types/telemetry';
import { Download, Calendar as CalendarIcon, FileText, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ExportDialogProps {
  podName: string;
  roomName: string;
  data: ChartDataPoint[];
  timezone: string;
  userRole: UserRole;
}

export function ExportDialog({ podName, roomName, data, timezone, userRole }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [format_type, setFormatType] = useState<'csv' | 'pdf'>('csv');
  const [selectedSignals, setSelectedSignals] = useState({
    temp: true,
    rh: true,
    co2: true,
    light: true,
    vpd: true,
  });
  const [exporting, setExporting] = useState(false);
  
  // Check if user has export permissions
  const canExport = userRole !== 'ExecutiveViewer';
  
  const handleExport = async () => {
    setExporting(true);
    
    try {
      // Simulate export generation delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Filter data by date range
      const filteredData = data.filter(point => 
        point.timestamp >= startDate && point.timestamp <= endDate
      );
      
      if (filteredData.length === 0) {
        toast.error('No data available for selected date range');
        setExporting(false);
        return;
      }
      
      // Prepare export data with validity flags
      const exportData = filteredData.map(point => ({
        timestamp: point.timestamp,
        temp: selectedSignals.temp ? point.temp : undefined,
        rh: selectedSignals.rh ? point.rh : undefined,
        co2: selectedSignals.co2 ? point.co2 : undefined,
        light: selectedSignals.light ? point.light : undefined,
        vpd: selectedSignals.vpd ? point.vpd : undefined,
        validity: 'OK', // In real system would come from point health
      }));
      
      if (format_type === 'csv') {
        const csv = generateCSV(exportData, timezone);
        const filename = generateExportFilename(roomName, startDate, endDate, 'csv');
        
        // Create download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        // Log export event (immutable)
        console.log('Export Event Logged:', {
          id: `exp-${Date.now()}`,
          actor_id: 'current-user',
          room_id: roomName,
          ts_utc: new Date(),
          range_start_utc: startDate,
          range_end_utc: endDate,
          file_uri: filename,
          checksum: 'sha256-placeholder',
        });
        
        toast.success(`Exported ${filteredData.length} data points to ${filename}`);
      } else {
        toast.info('PDF export would be generated here (demo)');
      }
      
      setOpen(false);
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };
  
  const toggleSignal = (signal: keyof typeof selectedSignals) => {
    setSelectedSignals(prev => ({ ...prev, [signal]: !prev[signal] }));
  };
  
  if (!canExport) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" disabled>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </PopoverTrigger>
        <PopoverContent className="text-sm">
          Export functionality requires Compliance/QA role or higher.
        </PopoverContent>
      </Popover>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Telemetry Data</DialogTitle>
          <DialogDescription>
            Export compliance-grade data with timezone-corrected timestamps and validity flags.
            All exports are logged immutably for audit trails.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Date Range Selection */}
          <div className="space-y-3">
            <Label>Date Range</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Timezone: {timezone}
            </p>
          </div>
          
          {/* Signal Selection */}
          <div className="space-y-3">
            <Label>Select Signals</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="temp"
                  checked={selectedSignals.temp}
                  onCheckedChange={() => toggleSignal('temp')}
                />
                <label htmlFor="temp" className="text-sm cursor-pointer">
                  Temperature (°C)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rh"
                  checked={selectedSignals.rh}
                  onCheckedChange={() => toggleSignal('rh')}
                />
                <label htmlFor="rh" className="text-sm cursor-pointer">
                  Relative Humidity (%)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="co2"
                  checked={selectedSignals.co2}
                  onCheckedChange={() => toggleSignal('co2')}
                />
                <label htmlFor="co2" className="text-sm cursor-pointer">
                  CO₂ (ppm)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="light"
                  checked={selectedSignals.light}
                  onCheckedChange={() => toggleSignal('light')}
                />
                <label htmlFor="light" className="text-sm cursor-pointer">
                  Lighting (%)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vpd"
                  checked={selectedSignals.vpd}
                  onCheckedChange={() => toggleSignal('vpd')}
                />
                <label htmlFor="vpd" className="text-sm cursor-pointer">
                  VPD (kPa) - Derived
                </label>
              </div>
            </div>
          </div>
          
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format_type} onValueChange={(v) => setFormatType(v as 'csv' | 'pdf')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    CSV (Comma-Separated Values)
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    PDF (Portable Document Format)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? 'Generating...' : 'Generate Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
