import { BatchDetailsHeader } from "./components/BatchDetailsHeader";
import { StatusCard } from "./components/StatusCard";
import { MetadataCard } from "./components/MetadataCard";
import { RecipeCard } from "./components/RecipeCard";
import { MetrcTagsCard } from "./components/MetrcTagsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { ArrowLeft } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Back Navigation */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Batches</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Header Section */}
        <BatchDetailsHeader />

        {/* Metrc Tags Alert */}
        <MetrcTagsCard />

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start bg-white border rounded-lg p-1 h-auto">
            <TabsTrigger value="overview" className="rounded-md">
              Overview
            </TabsTrigger>
            <TabsTrigger value="pods" className="rounded-md">
              Pods & Telemetry
            </TabsTrigger>
            <TabsTrigger value="quality" className="rounded-md">
              Quality
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-md">
              History
            </TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-md">
              Inventory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Status Card */}
              <div className="lg:col-span-2">
                <StatusCard />
              </div>

              {/* Metadata Card */}
              <div>
                <MetadataCard />
              </div>
            </div>

            {/* Recipe Card */}
            <RecipeCard />
          </TabsContent>

          <TabsContent value="pods" className="mt-6">
            <div className="bg-white rounded-xl border p-12 text-center">
              <p className="text-slate-500">Pods & Telemetry content goes here</p>
            </div>
          </TabsContent>

          <TabsContent value="quality" className="mt-6">
            <div className="bg-white rounded-xl border p-12 text-center">
              <p className="text-slate-500">Quality content goes here</p>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="bg-white rounded-xl border p-12 text-center">
              <p className="text-slate-500">History content goes here</p>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <div className="bg-white rounded-xl border p-12 text-center">
              <p className="text-slate-500">Inventory content goes here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
