'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient as createBrowserSupabase } from '@/lib/supabase/client';
import {
  MAX_TASK_HIERARCHY_LEVEL,
  TaskHierarchyNode,
  TaskHierarchyTree,
  TaskStatus,
} from '@/types/workflow';
import { buildHierarchyTree } from '@/lib/workflows/hierarchy';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Link2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

type DependencyMeta = {
  blocked: boolean;
  blockers: Array<{ id: string; title: string; status: string }>;
};

interface TaskHierarchyViewProps {
  rootTaskId: string;
  selectedTaskId?: string | null;
  onSelectTask?: (taskId: string) => void;
  dependencyMap?: Record<string, DependencyMeta>;
  refreshIntervalMs?: number;
  canEditHierarchy?: boolean;
}

const statusVariant: Record<TaskStatus, string> = {
  to_do: 'outline',
  in_progress: 'default',
  blocked: 'destructive',
  done: 'secondary',
  cancelled: 'outline',
  approved: 'secondary',
  awaiting_approval: 'secondary',
  rejected: 'destructive',
};

function findNode(node: TaskHierarchyNode, targetId: string): TaskHierarchyNode | null {
  if (node.task_id === targetId) return node;
  for (const child of node.children || []) {
    const match = findNode(child, targetId);
    if (match) return match;
  }
  return null;
}

function isDescendant(node: TaskHierarchyNode, targetId: string): boolean {
  if (!node.children) return false;
  for (const child of node.children) {
    if (child.task_id === targetId || isDescendant(child, targetId)) {
      return true;
    }
  }
  return false;
}

export function TaskHierarchyView({
  rootTaskId,
  selectedTaskId,
  onSelectTask,
  dependencyMap,
  refreshIntervalMs = 30000,
  canEditHierarchy = false,
}: TaskHierarchyViewProps) {
  const { toast } = useToast();
  const [tree, setTree] = useState<TaskHierarchyTree | null>(null);
  const [loading, setLoading] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [rootDropActive, setRootDropActive] = useState(false);

  const fetchHierarchy = useCallback(async () => {
    if (!rootTaskId) return;
    setLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase.rpc('get_task_hierarchy', {
        root_task_id: rootTaskId,
      });
      if (error) {
        throw error;
      }
      const built = buildHierarchyTree(data || []);
      setTree(built);
      setCollapsedNodes(new Set());
    } catch (error) {
      console.error('Failed to load task hierarchy', error);
      toast({
        title: 'Unable to load hierarchy',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [rootTaskId, toast]);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  useEffect(() => {
    if (!refreshIntervalMs) return;
    const interval = setInterval(fetchHierarchy, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [fetchHierarchy, refreshIntervalMs]);

  const toggleNode = (taskId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleDrop = async (targetId: string | null) => {
    if (!draggingId || draggingId === targetId) return;
    if (!tree) return;

    if (targetId) {
      const targetNode = findNode(tree.root, targetId);
      const draggedNode = findNode(tree.root, draggingId);
      if (!targetNode || !draggedNode) {
        setDraggingId(null);
        return;
      }
      if (isDescendant(draggedNode, targetId)) {
        toast({
          title: 'Move not allowed',
          description: 'Tasks cannot be nested beneath their descendants.',
          variant: 'destructive',
        });
        setDraggingId(null);
        return;
      }
      const proposedLevel = targetNode.hierarchy_level + 1;
      if (proposedLevel > MAX_TASK_HIERARCHY_LEVEL) {
        toast({
          title: 'Hierarchy limit reached',
          description: `Level ${proposedLevel} exceeds the ${MAX_TASK_HIERARCHY_LEVEL + 1}-level hierarchy limit.`,
          variant: 'destructive',
        });
        setDraggingId(null);
        return;
      }
    }

    try {
      const response = await fetch(`/api/workflows/tasks/${draggingId}/reparent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentTaskId: targetId }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Unable to move task');
      }
      toast({
        title: 'Hierarchy updated',
        description: 'Task position saved.',
      });
      fetchHierarchy();
    } catch (error) {
      toast({
        title: 'Move failed',
        description: error instanceof Error ? error.message : 'Unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setDraggingId(null);
      setRootDropActive(false);
    }
  };

  const renderNode = useCallback(
    (node: TaskHierarchyNode) => {
      if (!node) return null;
      const collapsed = collapsedNodes.has(node.task_id);
      const hasChildren = Boolean(node.children && node.children.length > 0);
      const dependencyInfo = dependencyMap?.[node.task_id];
      const isBlocked = dependencyInfo?.blocked || node.status === 'blocked';
      const blockers = dependencyInfo?.blockers || [];

      return (
        <li key={node.task_id} className="space-y-1">
          <div
            className={cn(
              'flex items-center gap-2 rounded-md border px-2 py-1 text-sm transition-colors',
              selectedTaskId === node.task_id && 'border-blue-500 bg-blue-50',
              draggingId === node.task_id && 'opacity-60',
              canEditHierarchy && 'cursor-grab active:cursor-grabbing'
            )}
            draggable={canEditHierarchy}
            onDragStart={() => setDraggingId(node.task_id)}
            onDragEnd={() => {
              setDraggingId(null);
              setRootDropActive(false);
            }}
            onDragOver={(event) => {
              if (!canEditHierarchy) return;
              event.preventDefault();
            }}
            onDrop={(event) => {
              if (!canEditHierarchy) return;
              event.preventDefault();
              handleDrop(node.task_id);
            }}
          >
            {hasChildren ? (
              <button
                type="button"
                aria-label={collapsed ? 'Expand node' : 'Collapse node'}
                className="rounded p-1 transition hover:bg-slate-100"
                onClick={() => toggleNode(node.task_id)}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <button
              type="button"
              onClick={() => onSelectTask?.(node.task_id)}
              className="flex-1 text-left"
            >
              <span className="font-medium">{node.title}</span>
              <span className="block text-xs text-slate-500">Level {node.hierarchy_level}</span>
            </button>
            <Badge variant={statusVariant[node.status]}>
              {node.status.replace('_', ' ')}
            </Badge>
            {isBlocked && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ShieldAlert className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    <p className="font-semibold mb-1">Blocked by:</p>
                    {blockers.length === 0 && <p>No blocker details available.</p>}
                    {blockers.map((blocker) => (
                      <p key={blocker.id}>{blocker.title} ({blocker.status})</p>
                    ))}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {dependencyInfo && dependencyInfo.blockers.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    <p className="font-semibold mb-1">Prerequisites:</p>
                    {dependencyInfo.blockers.map((blocker) => (
                      <p key={blocker.id}>{blocker.title}</p>
                    ))}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {hasChildren && !collapsed && (
            <ul className="ml-5 border-l border-slate-200 pl-4 space-y-1">
              {node.children!.map((child) => renderNode(child))}
            </ul>
          )}
        </li>
      );
    },
    [dependencyMap, collapsedNodes, onSelectTask, selectedTaskId, canEditHierarchy, draggingId, handleDrop]
  );

  const summary = useMemo(() => {
    if (!tree) return null;
    return [
      { label: 'Total', value: tree.totalTasks },
      { label: 'Completed', value: tree.completedTasks },
      { label: 'Blocked', value: tree.blockedTasks },
      { label: 'Depth', value: tree.maxDepth + 1 },
    ];
  }, [tree]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Task Hierarchy</CardTitle>
          <CardDescription>Expand/collapse to inspect lineage and dependency risk.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {canEditHierarchy && (
            <Badge variant="outline" className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              Drag to rearrange
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHierarchy}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary && (
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            {summary.map((item) => (
              <div key={item.label} className="rounded border bg-slate-50 p-3 text-center">
                <p className="text-xs uppercase text-slate-500">{item.label}</p>
                <p className="text-lg font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {canEditHierarchy && (
          <div
            className={cn(
              'rounded-md border border-dashed p-2 text-center text-xs text-slate-500',
              rootDropActive && 'border-blue-500 bg-blue-50 text-blue-600'
            )}
            onDragOver={(event) => {
              if (!draggingId) return;
              event.preventDefault();
              setRootDropActive(true);
            }}
            onDragLeave={() => setRootDropActive(false)}
            onDrop={(event) => {
              if (!draggingId) return;
              event.preventDefault();
              handleDrop(null);
            }}
          >
            Drop here to promote task to the root level
          </div>
        )}

        <ScrollArea className="max-h-[420px] pr-4">
          {loading && <p className="text-sm text-slate-500">Loading hierarchy...</p>}
          {!loading && tree && (
            <ul className="space-y-2">
              {renderNode(tree.root)}
            </ul>
          )}
          {!loading && !tree && (
            <p className="text-sm text-slate-500">No hierarchy data available for this task.</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
