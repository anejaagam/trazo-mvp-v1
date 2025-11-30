import { Badge } from "./ui/badge";
import { Thermometer, Droplet, Wind, CheckCircle2, AlertCircle } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  target: string;
  status: "in-range" | "out-of-range" | "no-target";
  icon: "thermometer" | "droplet" | "wind";
  color: "orange" | "blue" | "teal";
}

export function MetricCard({ label, value, target, status, icon, color }: MetricCardProps) {
  const iconMap = {
    thermometer: Thermometer,
    droplet: Droplet,
    wind: Wind,
  };

  const colorMap = {
    orange: {
      gradient: "from-orange-500 to-red-500",
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-600",
      shadow: "shadow-orange-500/20",
    },
    blue: {
      gradient: "from-blue-500 to-cyan-500",
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-600",
      shadow: "shadow-blue-500/20",
    },
    teal: {
      gradient: "from-teal-500 to-emerald-500",
      bg: "bg-teal-50",
      border: "border-teal-200",
      text: "text-teal-600",
      shadow: "shadow-teal-500/20",
    },
  };

  const Icon = iconMap[icon];
  const colors = colorMap[color];

  const statusConfig = {
    "in-range": {
      badge: (
        <Badge className="gap-1.5 bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle2 className="w-3 h-3" />
          In Range
        </Badge>
      ),
    },
    "out-of-range": {
      badge: (
        <Badge variant="destructive" className="gap-1.5">
          <AlertCircle className="w-3 h-3" />
          Out of Range
        </Badge>
      ),
    },
    "no-target": {
      badge: (
        <Badge variant="secondary" className="gap-1.5">
          <AlertCircle className="w-3 h-3" />
          No Target
        </Badge>
      ),
    },
  };

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} p-6 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg ${colors.shadow}`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <p className="text-slate-600">{label}</p>
        </div>
        {statusConfig[status].badge}
      </div>

      {/* Value */}
      <div>
        <p className={`text-slate-900`}>{value}</p>
        <p className="text-slate-500 mt-1">{target}</p>
      </div>
    </div>
  );
}
