import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { GitBranch, Search, ArrowRight, ArrowLeft, Package, Sprout, Truck, Building2, User } from 'lucide-react';

interface TraceabilityNode {
  id: string;
  type: 'genetics' | 'plant' | 'batch' | 'package' | 'sale' | 'destruction';
  name: string;
  date: string;
  location?: string;
  user?: string;
  quantity?: string;
  status: 'active' | 'completed' | 'destroyed';
}

export function TraceabilityTool() {
  const [searchId, setSearchId] = useState('');
  const [traceResult, setTraceResult] = useState<TraceabilityNode[] | null>(null);
  const [direction, setDirection] = useState<'backward' | 'forward'>('backward');

  const handleSearch = () => {
    // Mock trace data - in production this would query the actual database
    const mockTrace: TraceabilityNode[] = [
      {
        id: 'GEN-2024-001',
        type: 'genetics',
        name: 'Blue Dream - Mother Plant',
        date: '2024-01-15',
        location: 'Genetics Vault A',
        user: 'Sarah Chen',
        status: 'active',
      },
      {
        id: 'PLT-2024-0452',
        type: 'plant',
        name: 'Clone #452',
        date: '2024-02-20',
        location: 'Veg Room 3',
        user: 'Mike Johnson',
        quantity: '1 plant',
        status: 'completed',
      },
      {
        id: 'PLT-2024-0453',
        type: 'plant',
        name: 'Flowering Plant #453',
        date: '2024-04-10',
        location: 'Flower Room 2',
        user: 'Alex Kumar',
        quantity: '1 plant',
        status: 'completed',
      },
      {
        id: 'BTH-2045',
        type: 'batch',
        name: 'Production Batch #2045',
        date: '2024-06-15',
        location: 'Processing Lab',
        user: 'Emma Rodriguez',
        quantity: '2.4 kg',
        status: 'completed',
      },
      {
        id: 'PKG-2045-001',
        type: 'package',
        name: 'Package #2045-001',
        date: '2024-06-18',
        location: 'Vault B',
        user: 'James Wilson',
        quantity: '3.5g x 100 units',
        status: 'active',
      },
      {
        id: 'SALE-2024-8934',
        type: 'sale',
        name: 'Retail Sale #8934',
        date: '2024-08-22',
        location: 'Retail Location #2',
        user: 'System',
        quantity: '25 units',
        status: 'completed',
      },
    ];

    setTraceResult(direction === 'forward' ? mockTrace : [...mockTrace].reverse());
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'genetics':
        return <Sprout className="w-5 h-5 text-green-600" />;
      case 'plant':
        return <Sprout className="w-5 h-5 text-emerald-600" />;
      case 'batch':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'package':
        return <Package className="w-5 h-5 text-purple-600" />;
      case 'sale':
        return <Building2 className="w-5 h-5 text-orange-600" />;
      case 'destruction':
        return <AlertDescription className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-slate-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      genetics: 'bg-green-50 text-green-700 border-green-200',
      plant: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      batch: 'bg-blue-50 text-blue-700 border-blue-200',
      package: 'bg-purple-50 text-purple-700 border-purple-200',
      sale: 'bg-orange-50 text-orange-700 border-orange-200',
      destruction: 'bg-red-50 text-red-700 border-red-200',
    };

    return (
      <Badge variant="outline" className={colors[type]}>
        {type}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-blue-50 text-blue-700 border-blue-200',
      completed: 'bg-green-50 text-green-700 border-green-200',
      destroyed: 'bg-slate-50 text-slate-700 border-slate-200',
    };

    return (
      <Badge variant="outline" className={colors[status]}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Seed-to-Sale Traceability
          </CardTitle>
          <CardDescription>
            Real-time query to trace any package, plant, or batch to its genetic source and final disposition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Enter Package ID, Plant Tag, Batch Number, or Genetic ID..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={direction === 'backward' ? 'default' : 'outline'}
                onClick={() => setDirection('backward')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Backward
              </Button>
              <Button
                variant={direction === 'forward' ? 'default' : 'outline'}
                onClick={() => setDirection('forward')}
                className="gap-2"
              >
                Forward
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <Button onClick={handleSearch}>Trace</Button>
          </div>

          <Alert>
            <GitBranch className="h-4 w-4" />
            <AlertDescription>
              <strong>Backward Trace:</strong> Follow the supply chain from product back to genetic source. 
              <strong className="ml-3">Forward Trace:</strong> Track from genetics through all derivatives to final disposition.
            </AlertDescription>
          </Alert>

          {traceResult && (
            <div className="space-y-4">
              <Separator />
              
              <div>
                <p>Traceability Chain</p>
                <p className="text-slate-600">
                  {direction === 'backward' ? 'Tracing backward to source genetics' : 'Tracing forward to final disposition'}
                </p>
              </div>

              <div className="relative">
                {/* Connecting line */}
                <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-slate-200" />

                <div className="space-y-6">
                  {traceResult.map((node, index) => (
                    <div key={node.id} className="relative pl-16">
                      {/* Node icon */}
                      <div className="absolute left-0 top-0 w-14 h-14 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm">
                        {getTypeIcon(node.type)}
                      </div>

                      <Card>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <CardTitle className="flex items-center gap-2">
                                {node.name}
                              </CardTitle>
                              <p className="text-slate-600">ID: {node.id}</p>
                            </div>
                            <div className="flex gap-2">
                              {getTypeBadge(node.type)}
                              {getStatusBadge(node.status)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-slate-600">Date</p>
                            <p>{node.date}</p>
                          </div>
                          {node.location && (
                            <div>
                              <p className="text-slate-600">Location</p>
                              <p>{node.location}</p>
                            </div>
                          )}
                          {node.user && (
                            <div>
                              <p className="text-slate-600">User</p>
                              <p className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {node.user}
                              </p>
                            </div>
                          )}
                          {node.quantity && (
                            <div>
                              <p className="text-slate-600">Quantity</p>
                              <p>{node.quantity}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Arrow indicator */}
                      {index < traceResult.length - 1 && (
                        <div className="absolute left-[27px] -bottom-3 text-slate-400">
                          {direction === 'backward' ? (
                            <ArrowLeft className="w-4 h-4 rotate-90" />
                          ) : (
                            <ArrowRight className="w-4 h-4 rotate-90" />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p>Total Chain Length</p>
                      <p className="text-blue-600">{traceResult.length} nodes</p>
                    </div>
                    <div>
                      <p>Source</p>
                      <p className="text-blue-600">{traceResult[0].name}</p>
                    </div>
                    <div>
                      <p>Current Status</p>
                      <p className="text-blue-600">{traceResult[traceResult.length - 1].status}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!traceResult && (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
              <GitBranch className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>Enter an ID and click Trace to view the traceability chain</p>
              <p className="text-slate-600">Supports Package IDs, Plant Tags, Batch Numbers, and Genetic IDs</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
