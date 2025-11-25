import { MetricCard } from "./MetricCard";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ExternalLink, ChefHat } from "lucide-react";

export function RecipeCard() {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-slate-900">Recipe: golden apple [test] (Copy)</h2>
                <Badge variant="secondary" className="bg-white">
                  Stage 4 · Day 1
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 bg-white">
            <ExternalLink className="w-4 h-4" />
            Deactivate Recipe
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            label="Temperature"
            value="22.2°C"
            target="20.0 - 27.0°C"
            status="in-range"
            icon="thermometer"
            color="orange"
          />
          <MetricCard
            label="Humidity"
            value="52.0%"
            target="50.0 - 70.0%"
            status="in-range"
            icon="droplet"
            color="blue"
          />
          <MetricCard
            label="CO₂"
            value="655.0 ppm"
            target="No target defined"
            status="no-target"
            icon="wind"
            color="teal"
          />
        </div>
      </div>
    </div>
  );
}