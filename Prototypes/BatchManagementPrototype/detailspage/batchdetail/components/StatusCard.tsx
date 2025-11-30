import { Badge } from "./ui/badge";
import { Sprout, Leaf } from "lucide-react";

export function StatusCard() {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-slate-900">Status</h2>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Current Stage */}
        <div className="space-y-3">
          <p className="text-slate-500">Current stage</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center border border-green-200">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                Harvest
              </Badge>
            </div>
          </div>
        </div>

        {/* Plant Count */}
        <div className="space-y-3">
          <p className="text-slate-500">Plant count</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border border-blue-200">
              <Sprout className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-slate-900">6 plants</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Recipe */}
      <div className="pt-6 border-t">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mt-1">
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-slate-500 mb-1">Active recipe</p>
            <p className="text-slate-900">golden apple [test] (Copy)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
