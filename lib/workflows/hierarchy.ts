import type { TaskHierarchyNode, TaskHierarchyTree } from '@/types/workflow';

/**
 * Build a hierarchy tree from the flat payload returned by the `get_task_hierarchy` RPC.
 * This utility is shared between server queries and client-side visualizations.
 */
export function buildHierarchyTree(flatData: any[]): TaskHierarchyTree | null {
  if (!flatData || flatData.length === 0) return null;

  const nodeMap = new Map<string, TaskHierarchyNode>();

  flatData.forEach((item) => {
    nodeMap.set(item.task_id, {
      task_id: item.task_id,
      parent_id: item.parent_id,
      title: item.title,
      status: item.status,
      hierarchy_level: item.hierarchy_level,
      sequence_order: item.sequence_order,
      path: item.path,
      children: [],
    });
  });

  let root: TaskHierarchyNode | null = null;
  let maxDepth = 0;
  let completedCount = 0;
  let blockedCount = 0;

  nodeMap.forEach((node) => {
    if (node.status === 'done' || node.status === 'approved') {
      completedCount += 1;
    }
    if (node.status === 'blocked') {
      blockedCount += 1;
    }
    maxDepth = Math.max(maxDepth, node.hierarchy_level);

    if (node.parent_id) {
      const parent = nodeMap.get(node.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    } else {
      root = node;
    }
  });

  nodeMap.forEach((node) => {
    if (node.children) {
      node.children.sort((a, b) => a.sequence_order - b.sequence_order);
    }
  });

  if (!root) return null;

  return {
    root,
    totalTasks: flatData.length,
    maxDepth,
    completedTasks: completedCount,
    blockedTasks: blockedCount,
  };
}

/**
 * Utility helper to collect descendant IDs from a hierarchy tree.
 */
export function collectDescendantIds(node: TaskHierarchyNode, accumulator: Set<string> = new Set()): Set<string> {
  if (!node.children) return accumulator;
  node.children.forEach((child) => {
    accumulator.add(child.task_id);
    collectDescendantIds(child, accumulator);
  });
  return accumulator;
}
