import { Badge } from "./ui/badge";
import { Calendar, Hash, Shield } from "lucide-react";

export function MetadataCard() {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-slate-600" />
        <h2 className="text-slate-900">Metadata</h2>
      </div>

      <div className="space-y-4">
        {/* Jurisdiction */}
        <div>
          <p className="text-slate-500 mb-2">Jurisdiction</p>
          <Badge variant="secondary" className="gap-2">
            <Shield className="w-3 h-3" />
            Jurisdiction-aware context
          </Badge>
        </div>

        {/* Batch ID */}
        <div className="space-y-2">
          <p className="text-slate-500">Batch ID</p>
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
            <Hash className="w-4 h-4 text-slate-400" />
            <code className="text-slate-700 break-all">
              40593d44-4750-4e2d-be49-720076fabdh30
            </code>
          </div>
        </div>

        {/* Start Date */}
        <div>
          <p className="text-slate-500 mb-2">Start date</p>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <p className="text-slate-900">2025-11-18</p>
          </div>
        </div>

        {/* Expected Harvest */}
        <div>
          <p className="text-slate-500 mb-2">Expected harvest</p>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <p className="text-slate-900">n/a</p>
          </div>
        </div>
      </div>
    </div>
  );
}
