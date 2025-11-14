/**
 * Dependency Graph Utilities
 *
 * Provides cycle detection for task prerequisite graph using task_dependencies table.
 */

export interface RawDependencyRow {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: 'blocking' | 'suggested';
}

/**
 * Detect if adding edge (taskId -> dependsOnTaskId) would create a cycle.
 * We perform DFS from dependsOnTaskId to see if taskId is reachable.
 */
export function wouldCreateDependencyCycle(
  taskId: string,
  dependsOnTaskId: string,
  all: RawDependencyRow[]
): boolean {
  if (taskId === dependsOnTaskId) return true; // self edge

  const adj = new Map<string, string[]>();
  all.forEach((row) => {
    if (!adj.has(row.task_id)) adj.set(row.task_id, []);
    adj.get(row.task_id)!.push(row.depends_on_task_id);
  });

  // Add the proposed edge temporarily
  if (!adj.has(taskId)) adj.set(taskId, []);
  adj.get(taskId)!.push(dependsOnTaskId);

  const visited = new Set<string>();
  let found = false;

  const dfs = (node: string) => {
    if (found) return;
    if (node === taskId) {
      found = true; // cycle found reaching original task
      return;
    }
    visited.add(node);
    const neighbors = adj.get(node) || [];
    for (const n of neighbors) {
      if (!visited.has(n)) dfs(n);
    }
  };

  dfs(dependsOnTaskId);
  return found;
}
