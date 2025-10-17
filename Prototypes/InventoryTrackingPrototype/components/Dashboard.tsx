import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Progress } from "./ui/progress";
import { AlertTriangle, Package, TrendingDown, Calendar } from "lucide-react";
import type { Item, Movement, StockBalance } from "../lib/types";

interface DashboardProps {
  items: Item[];
  stockBalances: StockBalance[];
  movements: Movement[];
}

export function Dashboard({ items, stockBalances, movements }: DashboardProps) {
  // Calculate alerts
  const lowStockItems = stockBalances.filter(sb => {
    const item = items.find(i => i.id === sb.itemId);
    return item?.parLevel && sb.onHand < item.parLevel;
  });

  const nearExpiryMovements = movements.filter(m => {
    if (!m.expiryDate) return false;
    const expiryDate = new Date(m.expiryDate);
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
  });

  // Recent movements
  const recentMovements = movements.slice(0, 10);

  // Stats
  const totalItems = items.filter(i => i.active).length;
  const totalMovements = movements.length;
  const totalIssued = movements
    .filter(m => m.type === "issue")
    .reduce((sum, m) => sum + m.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      {(lowStockItems.length > 0 || nearExpiryMovements.length > 0) && (
        <div className="space-y-4">
          {lowStockItems.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Low Stock Alert</AlertTitle>
              <AlertDescription>
                {lowStockItems.length} item{lowStockItems.length !== 1 ? "s" : ""} below par level
              </AlertDescription>
            </Alert>
          )}
          
          {nearExpiryMovements.length > 0 && (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertTitle>Near Expiry Warning</AlertTitle>
              <AlertDescription>
                {nearExpiryMovements.length} lot{nearExpiryMovements.length !== 1 ? "s" : ""} expiring within 30 days
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In catalog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Movements</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalMovements}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Issued</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalIssued.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Units consumed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Levels */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
          <CardDescription>Current inventory status by item</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stockBalances.map(sb => {
              const item = items.find(i => i.id === sb.itemId);
              if (!item) return null;
              
              const parLevel = item.parLevel || 0;
              const percentage = parLevel > 0 ? (sb.onHand / parLevel) * 100 : 100;
              const isLow = parLevel > 0 && sb.onHand < parLevel;
              
              return (
                <div key={sb.itemId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{item.name}</span>
                      {isLow && <Badge variant="destructive">Low Stock</Badge>}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {sb.onHand} {item.uom} {parLevel > 0 && `/ ${parLevel} par`}
                    </span>
                  </div>
                  {parLevel > 0 && (
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className={isLow ? "bg-red-100" : ""}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Movements */}
      {recentMovements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Movements</CardTitle>
            <CardDescription>Latest inventory transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMovements.map(movement => {
                const item = items.find(i => i.id === movement.itemId);
                if (!item) return null;
                
                return (
                  <div key={movement.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          movement.type === "receive" ? "default" :
                          movement.type === "issue" ? "secondary" :
                          movement.type === "adjust" ? "outline" :
                          "destructive"
                        }>
                          {movement.type}
                        </Badge>
                        <span>{item.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {movement.actorName} • {new Date(movement.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={movement.type === "receive" ? "text-green-600" : movement.type === "dispose" ? "text-red-600" : ""}>
                        {movement.type === "receive" ? "+" : movement.type === "dispose" ? "-" : ""}
                        {movement.quantity} {movement.uom}
                      </div>
                      {movement.batchName && (
                        <p className="text-xs text-muted-foreground">→ {movement.batchName}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
