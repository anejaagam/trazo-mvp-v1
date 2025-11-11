import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DataEntryDialogProps {
  podName: string;
}

export function DataEntryDialog({ podName }: DataEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    temp: '',
    rh: '',
    co2: '',
    light: '',
  });
  
  const handleSubmit = () => {
    // Validate inputs
    const temp = parseFloat(values.temp);
    const rh = parseFloat(values.rh);
    const co2 = parseFloat(values.co2);
    const light = parseFloat(values.light);
    
    if (isNaN(temp) || isNaN(rh) || isNaN(co2) || isNaN(light)) {
      toast.error('Please enter valid numbers for all fields');
      return;
    }
    
    // Validate ranges
    if (temp < -10 || temp > 50) {
      toast.error('Temperature must be between -10°C and 50°C');
      return;
    }
    if (rh < 0 || rh > 100) {
      toast.error('Humidity must be between 0% and 100%');
      return;
    }
    if (co2 < 0 || co2 > 10000) {
      toast.error('CO₂ must be between 0 and 10,000 ppm');
      return;
    }
    if (light < 0 || light > 100) {
      toast.error('Light must be between 0% and 100%');
      return;
    }
    
    // In real system, would send to Edge Gateway
    console.log('Manual telemetry entry:', {
      pod: podName,
      timestamp: new Date().toISOString(),
      temp,
      rh,
      co2,
      light,
    });
    
    toast.success('Telemetry data recorded (simulated)');
    setOpen(false);
    setValues({ temp: '', rh: '', co2: '', light: '' });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle className="w-4 h-4 mr-2" />
          Manual Entry
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manual Telemetry Entry</DialogTitle>
          <DialogDescription>
            MVP Mode: Enter telemetry readings manually. In production, this data comes automatically from the Edge Gateway.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="temp">Temperature (°C)</Label>
            <Input
              id="temp"
              type="number"
              step="0.1"
              placeholder="e.g., 24.5"
              value={values.temp}
              onChange={(e) => setValues(prev => ({ ...prev, temp: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rh">Relative Humidity (%)</Label>
            <Input
              id="rh"
              type="number"
              step="0.1"
              placeholder="e.g., 65.0"
              value={values.rh}
              onChange={(e) => setValues(prev => ({ ...prev, rh: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="co2">CO₂ (ppm)</Label>
            <Input
              id="co2"
              type="number"
              step="1"
              placeholder="e.g., 1200"
              value={values.co2}
              onChange={(e) => setValues(prev => ({ ...prev, co2: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="light">Lighting (%)</Label>
            <Input
              id="light"
              type="number"
              step="1"
              placeholder="e.g., 80"
              value={values.light}
              onChange={(e) => setValues(prev => ({ ...prev, light: e.target.value }))}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Submit Reading
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
