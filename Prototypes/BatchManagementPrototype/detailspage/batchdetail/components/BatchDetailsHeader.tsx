import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import {
  Edit3,
  ArrowRightLeft,
  Package,
  FileText,
  Upload,
  Trash2,
  MoreVertical,
  Sprout,
  AlertTriangle,
} from "lucide-react";

export function BatchDetailsHeader() {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-slate-900">Batch BTH-TEST-4</h1>
                <Badge variant="destructive" className="gap-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  Quarantine
                </Badge>
              </div>
              <p className="text-slate-500 mt-1">TRAZAAA</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Edit3 className="w-4 h-4" />
            Edit batch
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            Transition stage
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Package className="w-4 h-4" />
            Record harvest
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2">
                <FileText className="w-4 h-4" />
                Apply recipe
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Upload className="w-4 h-4" />
                Push to Metrc
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600">
                <Trash2 className="w-4 h-4" />
                Destroy Plants
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
