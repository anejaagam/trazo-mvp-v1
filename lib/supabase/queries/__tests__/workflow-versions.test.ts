import { diffTemplateVersions } from '../workflows';
import * as SupabaseServer from '@/lib/supabase/server';

describe('workflow template version diff', () => {
  const mockSelect = jest.fn();
  const mockEq = jest.fn();
  const mockSingle = jest.fn();
  const mockFrom = jest.fn();

  beforeEach(() => {
    jest.spyOn(SupabaseServer, 'createClient').mockResolvedValue({
      from: (table: string) => {
        mockFrom(table);
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              single: async () => {
                if (val === 'A') {
                  return { data: { id: 'A', steps: [{ title: 'Step 1' }, { title: 'Step 2' }] }, error: null };
                }
                if (val === 'B') {
                  return { data: { id: 'B', steps: [{ title: 'Step 1' }, { title: 'Step 3' }] }, error: null };
                }
                return { data: null, error: new Error('Not found') };
              }
            })
          })
        };
      }
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('computes added and removed steps between versions', async () => {
    const result = await diffTemplateVersions('A', 'B');
    expect(result.error).toBeNull();
    expect(result.data?.added).toEqual(['Step 3']);
    expect(result.data?.removed).toEqual(['Step 2']);
    expect(result.data?.changed).toEqual([]); // placeholder
  });
});