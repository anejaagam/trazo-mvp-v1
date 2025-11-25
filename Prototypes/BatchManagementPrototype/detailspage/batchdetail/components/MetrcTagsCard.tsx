import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tag, ExternalLink } from "lucide-react";
import { Progress } from "./ui/progress";

export function MetrcTagsCard() {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Tag className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-slate-900">Metrc Plant Tags</h3>
              <Badge variant="secondary" className="bg-white">
                0 of 6 plants tagged (0%)
              </Badge>
            </div>
            <Progress value={0} className="h-2 bg-amber-100" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 bg-white">
            Manage Tags
          </Button>
          <Button size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700">
            <ExternalLink className="w-4 h-4" />
            Assign Metrc Tags
          </Button>
        </div>
      </div>
    </div>
  );
}
