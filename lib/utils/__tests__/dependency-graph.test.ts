import { wouldCreateDependencyCycle } from '../dependency-graph';

describe('wouldCreateDependencyCycle', () => {
  const baseGraph = [
    { id: '1', task_id: 'A', depends_on_task_id: 'B', dependency_type: 'blocking' },
    { id: '2', task_id: 'B', depends_on_task_id: 'C', dependency_type: 'blocking' },
  ];

  it('returns true when creating a self dependency', () => {
    expect(wouldCreateDependencyCycle('A', 'A', baseGraph as any)).toBe(true);
  });

  it('detects indirect cycles', () => {
    expect(wouldCreateDependencyCycle('C', 'A', baseGraph as any)).toBe(true);
  });

  it('allows edges that do not create cycles', () => {
    expect(wouldCreateDependencyCycle('C', 'D', baseGraph as any)).toBe(false);
  });
});
