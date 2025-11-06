import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./components/ui/tabs";
import { Dashboard } from "./components/Dashboard";
import { ItemCatalog } from "./components/ItemCatalog";
import { ReceiveInventory } from "./components/ReceiveInventory";
import { IssueInventory } from "./components/IssueInventory";
import { AdjustDispose } from "./components/AdjustDispose";
import { MovementsLog } from "./components/MovementsLog";
import { BatchConsumption } from "./components/BatchConsumption";
import { ExportView } from "./components/ExportView";
import { MetrcPackages } from "./components/MetrcPackages";
import { TransferManifests } from "./components/TransferManifests";
import { WasteDisposal } from "./components/WasteDisposal";
import { ComplianceLabels } from "./components/ComplianceLabels";
import {
  Package,
  ClipboardList,
  Download,
  TrendingUp,
  FileText,
  Activity,
  Truck,
  Trash2,
  Tag,
  QrCode,
} from "lucide-react";
import { mockItems, mockBatches } from "./lib/mockData";
import {
  mockPackages,
  mockManifests,
  mockWasteLogs,
  mockLabels,
} from "./lib/mockPostHarvestData";
import type {
  Item,
  Movement,
  Batch,
  StockBalance,
  MetrcPackage,
  TransferManifest,
  WasteLog,
  ComplianceLabel,
} from "./lib/types";

export default function App() {
  const [items, setItems] = useState<Item[]>(mockItems);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [batches] = useState<Batch[]>(mockBatches);
  const [stockBalances, setStockBalances] = useState<
    StockBalance[]
  >(
    mockItems.map((item) => ({
      itemId: item.id,
      siteId: "site-1",
      onHand: 0,
      parLevel: item.parLevel,
      lastCountAt: new Date().toISOString(),
    })),
  );
  const [packages, setPackages] =
    useState<MetrcPackage[]>(mockPackages);
  const [manifests, setManifests] =
    useState<TransferManifest[]>(mockManifests);
  const [wasteLogs, setWasteLogs] =
    useState<WasteLog[]>(mockWasteLogs);
  const [labels, setLabels] =
    useState<ComplianceLabel[]>(mockLabels);
  const [currentUser] = useState({
    id: "user-1",
    name: "Site Manager",
    role: "site_manager" as const,
  });

  const handleReceive = (
    movement: Omit<Movement, "id" | "timestamp">,
  ) => {
    const newMovement: Movement = {
      ...movement,
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
    };

    setMovements((prev) => [newMovement, ...prev]);

    // Update stock balance
    setStockBalances((prev) =>
      prev.map((sb) =>
        sb.itemId === movement.itemId
          ? { ...sb, onHand: sb.onHand + movement.quantity }
          : sb,
      ),
    );
  };

  const handleIssue = (
    movement: Omit<Movement, "id" | "timestamp">,
  ) => {
    const newMovement: Movement = {
      ...movement,
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
    };

    setMovements((prev) => [newMovement, ...prev]);

    // Update stock balance
    setStockBalances((prev) =>
      prev.map((sb) =>
        sb.itemId === movement.itemId
          ? { ...sb, onHand: sb.onHand - movement.quantity }
          : sb,
      ),
    );
  };

  const handleAdjustOrDispose = (
    movement: Omit<Movement, "id" | "timestamp">,
  ) => {
    const newMovement: Movement = {
      ...movement,
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
    };

    setMovements((prev) => [newMovement, ...prev]);

    // Update stock balance
    const qtyChange =
      movement.type === "dispose"
        ? -movement.quantity
        : movement.quantity; // adjust can be + or -

    setStockBalances((prev) =>
      prev.map((sb) =>
        sb.itemId === movement.itemId
          ? {
              ...sb,
              onHand: Math.max(0, sb.onHand + qtyChange),
            }
          : sb,
      ),
    );
  };

  const handleCreatePackage = (
    pkg: Omit<MetrcPackage, "id" | "uid" | "createdAt">,
  ) => {
    const newPackage: MetrcPackage = {
      ...pkg,
      id: `pkg-${Date.now()}`,
      uid: `1A40603000023310000${String(packages.length + 1).padStart(5, "0")}`,
      createdAt: new Date().toISOString(),
    };
    setPackages((prev) => [newPackage, ...prev]);
  };

  const handleCreateManifest = (
    manifest: Omit<
      TransferManifest,
      "id" | "manifestNumber" | "createdAt"
    >,
  ) => {
    const newManifest: TransferManifest = {
      ...manifest,
      id: `man-${Date.now()}`,
      manifestNumber: `MAN-2025-${String(manifests.length + 1).padStart(3, "0")}`,
      createdAt: new Date().toISOString(),
    };
    setManifests((prev) => [newManifest, ...prev]);
  };

  const handleCreateWasteLog = (
    log: Omit<WasteLog, "id" | "createdAt">,
  ) => {
    const newLog: WasteLog = {
      ...log,
      id: `waste-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setWasteLogs((prev) => [newLog, ...prev]);
  };

  const handleCreateLabel = (
    label: Omit<ComplianceLabel, "id" | "createdAt">,
  ) => {
    const newLabel: ComplianceLabel = {
      ...label,
      id: `label-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setLabels((prev) => [newLabel, ...prev]);
  };

  const handlePrintLabel = (labelId: string) => {
    setLabels((prev) =>
      prev.map((label) =>
        label.id === labelId
          ? {
              ...label,
              printedAt: new Date().toISOString(),
              printedBy: currentUser.name,
            }
          : label,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900">
                Inventory & Post-Harvest Tracking
              </h1>
              <p className="text-gray-600 mt-1">
                Consumables, Metrc packages, transfers &
                compliance
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-900">
                {currentUser.name}
              </p>
              <p className="text-gray-500 text-sm capitalize">
                {currentUser.role.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-12 w-full">
            <TabsTrigger
              value="dashboard"
              className="flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">
                Dashboard
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="items"
              className="flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Items</span>
            </TabsTrigger>
            <TabsTrigger
              value="receive"
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Receive</span>
            </TabsTrigger>
            <TabsTrigger
              value="issue"
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Issue</span>
            </TabsTrigger>
            <TabsTrigger
              value="adjust"
              className="flex items-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Adjust</span>
            </TabsTrigger>
            <TabsTrigger
              value="movements"
              className="flex items-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">
                Movements
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="batches"
              className="flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Batches</span>
            </TabsTrigger>
            <TabsTrigger
              value="packages"
              className="flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Packages</span>
            </TabsTrigger>
            <TabsTrigger
              value="manifests"
              className="flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span className="hidden sm:inline">
                Manifests
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="waste"
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Waste</span>
            </TabsTrigger>
            <TabsTrigger
              value="labels"
              className="flex items-center gap-2"
            >
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">Labels</span>
            </TabsTrigger>
            <TabsTrigger
              value="export"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard
              items={items}
              stockBalances={stockBalances}
              movements={movements}
            />
          </TabsContent>

          <TabsContent value="items">
            <ItemCatalog items={items} setItems={setItems} />
          </TabsContent>

          <TabsContent value="receive">
            <ReceiveInventory
              items={items}
              onReceive={handleReceive}
            />
          </TabsContent>

          <TabsContent value="issue">
            <IssueInventory
              items={items}
              batches={batches}
              stockBalances={stockBalances}
              onIssue={handleIssue}
            />
          </TabsContent>

          <TabsContent value="adjust">
            <AdjustDispose
              items={items}
              stockBalances={stockBalances}
              onSubmit={handleAdjustOrDispose}
              userRole={currentUser.role}
            />
          </TabsContent>

          <TabsContent value="movements">
            <MovementsLog
              movements={movements}
              items={items}
              batches={batches}
            />
          </TabsContent>

          <TabsContent value="batches">
            <BatchConsumption
              batches={batches}
              movements={movements}
              items={items}
            />
          </TabsContent>

          <TabsContent value="packages">
            <MetrcPackages
              packages={packages}
              batches={batches}
              onCreatePackage={handleCreatePackage}
            />
          </TabsContent>

          <TabsContent value="manifests">
            <TransferManifests
              manifests={manifests}
              packages={packages}
              onCreateManifest={handleCreateManifest}
            />
          </TabsContent>

          <TabsContent value="waste">
            <WasteDisposal
              wasteLogs={wasteLogs}
              batches={batches}
              onCreateWasteLog={handleCreateWasteLog}
            />
          </TabsContent>

          <TabsContent value="labels">
            <ComplianceLabels
              labels={labels}
              packages={packages}
              batches={batches}
              onCreateLabel={handleCreateLabel}
              onPrintLabel={handlePrintLabel}
            />
          </TabsContent>

          <TabsContent value="export">
            <ExportView
              movements={movements}
              items={items}
              batches={batches}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}