import { buildHierarchyTree, collectDescendantIds } from '../hierarchy';

describe('hierarchy utilities', () => {
  const flatPayload: any[] = [
    { task_id: 'root', parent_id: null, title: 'Root', status: 'to_do' as const, hierarchy_level: 0, sequence_order: 1, path: [] },
    { task_id: 'child-1', parent_id: 'root', title: 'Child 1', status: 'done' as const, hierarchy_level: 1, sequence_order: 2, path: ['root'] },
    { task_id: 'child-0', parent_id: 'root', title: 'Child 0', status: 'blocked' as const, hierarchy_level: 1, sequence_order: 1, path: ['root'] },
  ];

  it('builds a sorted tree with summary data', () => {
    const tree = buildHierarchyTree(flatPayload);
    expect(tree).not.toBeNull();
    expect(tree?.totalTasks).toBe(3);
    expect(tree?.completedTasks).toBe(1);
    expect(tree?.blockedTasks).toBe(1);
    expect(tree?.root.children?.[0].task_id).toBe('child-0');
  });

  it('collects descendant ids from a node', () => {
    const tree = buildHierarchyTree(flatPayload);
    const ids = tree ? collectDescendantIds(tree.root) : new Set<string>();
    expect(ids.has('child-1')).toBe(true);
    expect(ids.size).toBe(2);
  });
});
