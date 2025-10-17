import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { HelpCircle } from 'lucide-react';
import { Badge } from '../ui/badge';

export function InfoPanel() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="w-4 h-4 mr-2" />
          Help
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Monitoring & Telemetry System Guide</DialogTitle>
          <DialogDescription>
            Real-time environmental monitoring with compliance-grade data export
          </DialogDescription>
        </DialogHeader>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="overview">
            <AccordionTrigger>System Overview</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm">
                This monitoring system provides real-time visibility into environmental conditions
                and equipment states across all rooms and pods. It enables fast drift detection,
                confident decision-making, and compliance-grade data exports.
              </p>
              <div className="bg-muted p-3 rounded-lg text-sm">
                <strong>Important:</strong> This is a read-only monitoring interface.
                No control commands are issued from this system.
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="health-badges">
            <AccordionTrigger>Health Status Badges</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">OK</Badge>
                  <span className="text-sm">Sensor healthy, reading within bounds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Stale</Badge>
                  <span className="text-sm">No update received for &gt;30 seconds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Fault</Badge>
                  <span className="text-sm">Sensor error or reading out of physical bounds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Cal Due</Badge>
                  <span className="text-sm">Sensor calibration due date reached</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="spec-status">
            <AccordionTrigger>Spec Status Indicators</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500 hover:bg-green-500">In Spec</Badge>
                  <span className="text-sm">Reading within tolerance of setpoint</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-500">Approaching</Badge>
                  <span className="text-sm">Reading approaching tolerance boundary (80%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Out of Spec</Badge>
                  <span className="text-sm">Reading exceeds tolerance threshold</span>
                </div>
              </div>
              <div className="bg-muted p-3 rounded-lg text-sm mt-3">
                <strong>Tolerances:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Temperature: ±2.0°C</li>
                  <li>Humidity: ±5.0%</li>
                  <li>CO₂: ±150 ppm</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="vpd">
            <AccordionTrigger>VPD (Vapor Pressure Deficit)</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm">
                VPD is automatically calculated from temperature and humidity measurements.
                It indicates the difference between the moisture currently in the air and
                how much moisture the air can hold when saturated.
              </p>
              <div className="bg-muted p-3 rounded-lg text-sm">
                <strong>VPD Ranges:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Propagation: 0.4-0.8 kPa</li>
                  <li>Vegetative: 0.8-1.2 kPa</li>
                  <li>Flowering: 1.0-1.5 kPa</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                Higher VPD = more transpiration. Lower VPD = less transpiration.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="charts">
            <AccordionTrigger>Time-Series Charts</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm">
                Charts display historical data with overlays showing important events:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><strong>Solid line:</strong> Actual sensor readings</li>
                <li><strong>Dashed line:</strong> Recipe setpoints</li>
                <li><strong>⚠ Red markers:</strong> Alarm events</li>
                <li><strong>💧 Blue markers:</strong> Irrigation cycles</li>
              </ul>
              <p className="text-sm mt-3">
                Toggle between metrics using the tabs: Temp, RH, CO₂, Light, VPD
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="fleet">
            <AccordionTrigger>Fleet View</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm">
                Fleet View provides a tabular overview of all pods with sortable columns:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Click column headers to sort by drift, alarms, or status</li>
                <li>Use the search box to filter by pod or room name</li>
                <li>Filter by growth stage to focus on specific rooms</li>
                <li>Click any row to view detailed pod information</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="export">
            <AccordionTrigger>Data Export & Compliance</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm">
                Export compliance-grade data for regulatory requirements:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Select custom date ranges</li>
                <li>Choose specific signals to include</li>
                <li>CSV format with timezone-corrected timestamps</li>
                <li>Validity flags for each data point</li>
                <li>All exports are logged immutably for audit trails</li>
              </ul>
              <div className="bg-muted p-3 rounded-lg text-sm mt-3">
                <strong>Role Requirements:</strong> Export functionality requires
                Compliance/QA role or higher. Executive Viewers have read-only access.
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="safety">
            <AccordionTrigger>Safety & Precedence</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm">
                The system operates under strict safety precedence:
              </p>
              <div className="bg-muted p-3 rounded-lg text-sm">
                <strong>Safety</strong> &gt; <strong>E-stop</strong> &gt; <strong>Manual Override</strong> &gt;{' '}
                <strong>Recipe/Schedule</strong> &gt; <strong>Suggestions/DR</strong>
              </div>
              <p className="text-sm mt-3">
                This monitoring interface is read-only and never issues control commands.
                All control actions must be performed through the control system interface.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="mvp">
            <AccordionTrigger>MVP Mode Notes</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm">
                This is an MVP demonstration with simulated data. In production:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Data flows from Trazo Edge Gateway via DemeGrow Raptor GCU</li>
                <li>WebSocket streams provide real-time updates</li>
                <li>Store-and-forward ensures no data loss during outages</li>
                <li>Time-series database handles 30+ day retention</li>
              </ul>
              <p className="text-sm mt-3">
                Use the "Manual Entry" button in pod detail views to simulate sensor readings.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm">
            <strong>Need help?</strong> Contact your system administrator or refer to the
            full system documentation for detailed operational procedures.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
