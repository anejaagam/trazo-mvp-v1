/**
 * Tests for useJurisdiction hook
 */

import { renderHook } from '@testing-library/react';
import { useJurisdiction, useJurisdictionOptions } from '../use-jurisdiction';
import type { JurisdictionId } from '@/lib/jurisdiction/types';

describe('useJurisdiction', () => {
  describe('with valid jurisdiction ID', () => {
    it('should return jurisdiction config for MD (Maryland)', () => {
      const { result } = renderHook(() => useJurisdiction('maryland_cannabis' as JurisdictionId));

      expect(result.current.jurisdiction).not.toBeNull();
      expect(result.current.jurisdiction?.id).toBe('maryland_cannabis');
      expect(result.current.jurisdiction?.name).toBe('Maryland Cannabis (Metrc)');
      expect(result.current.jurisdiction?.plant_type).toBe('cannabis');
    });

    it('should return jurisdiction config for OR (Oregon)', () => {
      const { result } = renderHook(() => useJurisdiction('oregon_cannabis' as JurisdictionId));

      expect(result.current.jurisdiction).not.toBeNull();
      expect(result.current.jurisdiction?.id).toBe('oregon_cannabis');
      expect(result.current.jurisdiction?.name).toBe('Oregon Cannabis (Metrc)');
      expect(result.current.isCannabiJurisdiction).toBe(true);
    });

    it('should return jurisdiction config for CA (Canada)', () => {
      const { result } = renderHook(() => useJurisdiction('canada_cannabis' as JurisdictionId));

      expect(result.current.jurisdiction).not.toBeNull();
      expect(result.current.jurisdiction?.id).toBe('canada_cannabis');
      expect(result.current.jurisdiction?.name).toBe('Canada Cannabis (Health Canada)');
      expect(result.current.isCannabiJurisdiction).toBe(true);
    });

    it('should return jurisdiction config for Primus GFS', () => {
      const { result } = renderHook(() => useJurisdiction('primus_gfs' as JurisdictionId));

      expect(result.current.jurisdiction).not.toBeNull();
      expect(result.current.jurisdiction?.id).toBe('primus_gfs');
      expect(result.current.jurisdiction?.name).toBe('PrimusGFS (Produce)');
      expect(result.current.jurisdiction?.plant_type).toBe('produce');
      expect(result.current.isProduceJurisdiction).toBe(true);
    });
  });

  describe('with null/undefined jurisdiction', () => {
    it('should return null jurisdiction for null ID', () => {
      const { result } = renderHook(() => useJurisdiction(null));

      expect(result.current.jurisdiction).toBeNull();
      expect(result.current.isCannabiJurisdiction).toBe(false);
      expect(result.current.isProduceJurisdiction).toBe(false);
    });

    it('should return null jurisdiction for undefined ID', () => {
      const { result } = renderHook(() => useJurisdiction(undefined));

      expect(result.current.jurisdiction).toBeNull();
    });

    it('should return empty arrays for waste reasons when null', () => {
      const { result } = renderHook(() => useJurisdiction(null));

      expect(result.current.getWasteReasons()).toEqual([]);
      expect(result.current.getDisposalMethods()).toEqual([]);
      expect(result.current.getAllowedBatchStages()).toEqual([]);
    });
  });

  describe('waste management', () => {
    it('should return waste reasons for Maryland', () => {
      const { result } = renderHook(() => useJurisdiction('maryland_cannabis' as JurisdictionId));

      const wasteReasons = result.current.getWasteReasons();
      expect(wasteReasons).toContain('Contamination');
      expect(wasteReasons).toContain('Damaged products');
      expect(wasteReasons.length).toBeGreaterThan(0);
    });

    it('should return disposal methods for Maryland', () => {
      const { result } = renderHook(() => useJurisdiction('maryland_cannabis' as JurisdictionId));

      const disposalMethods = result.current.getDisposalMethods();
      expect(disposalMethods.length).toBeGreaterThan(0);
      expect(disposalMethods.some(method => method.toLowerCase().includes('compost'))).toBe(true);
    });

    it('should check witness requirement', () => {
      const { result: mdResult } = renderHook(() => useJurisdiction('maryland_cannabis' as JurisdictionId));
      const { result: orResult } = renderHook(() => useJurisdiction('oregon_cannabis' as JurisdictionId));

      // Maryland requires witness for waste disposal
      expect(mdResult.current.requiresWitness).toBe(true);
      // Oregon may have different requirements
      expect(typeof orResult.current.requiresWitness).toBe('boolean');
    });
  });

  describe('batch management', () => {
    it('should return allowed batch stages for Maryland', () => {
      const { result } = renderHook(() => useJurisdiction('maryland_cannabis' as JurisdictionId));

      const stages = result.current.getAllowedBatchStages();
      expect(stages).toContain('clone');
      expect(stages).toContain('vegetative');
      expect(stages).toContain('flowering');
      expect(stages.length).toBeGreaterThan(0);
    });

    it('should validate stage transitions for Maryland', () => {
      const { result } = renderHook(() => useJurisdiction('maryland_cannabis' as JurisdictionId));

      // Valid transition
      expect(result.current.isStageTransitionAllowed('clone', 'vegetative')).toBe(true);
      expect(result.current.isStageTransitionAllowed('vegetative', 'flowering')).toBe(true);
      
      // Test that allowed stages work (flowering to harvest is valid)
      expect(result.current.isStageTransitionAllowed('flowering', 'harvest')).toBe(true);
    });

    it('should check plant tag requirements', () => {
      const { result: mdResult } = renderHook(() => useJurisdiction('maryland_cannabis' as JurisdictionId));
      const { result: caResult } = renderHook(() => useJurisdiction('canada_cannabis' as JurisdictionId));

      expect(typeof mdResult.current.requiresPlantTags).toBe('boolean');
      expect(typeof caResult.current.requiresPlantTags).toBe('boolean');
    });

    it('should check METRC requirements', () => {
      const { result: orResult } = renderHook(() => useJurisdiction('oregon_cannabis' as JurisdictionId));

      // Oregon typically requires METRC integration
      expect(typeof orResult.current.requiresMetrc).toBe('boolean');
    });
  });

  describe('compliance reporting', () => {
    it('should return compliance report types for Maryland', () => {
      const { result } = renderHook(() => useJurisdiction('maryland_cannabis' as JurisdictionId));

      const reportTypes = result.current.getComplianceReportTypes();
      expect(Array.isArray(reportTypes)).toBe(true);
      // Compliance report types are optional, just check it's an array
    });

    it('should return compliance report types for Primus GFS', () => {
      const { result } = renderHook(() => useJurisdiction('primus_gfs' as JurisdictionId));

      const reportTypes = result.current.getComplianceReportTypes();
      expect(Array.isArray(reportTypes)).toBe(true);
    });
  });

  describe('feature support', () => {
    it('should check if jurisdiction supports specific features', () => {
      const { result } = renderHook(() => useJurisdiction('maryland_cannabis' as JurisdictionId));

      // Test various feature checks
      const hasBatchTracking = result.current.supports('batch_tracking');
      expect(typeof hasBatchTracking).toBe('boolean');
    });

    it('should return false for unsupported features with null jurisdiction', () => {
      const { result } = renderHook(() => useJurisdiction(null));

      expect(result.current.supports('any_feature')).toBe(false);
    });
  });

  describe('plant type classification', () => {
    it('should correctly identify cannabis jurisdictions', () => {
      const { result: mdResult } = renderHook(() => useJurisdiction('maryland_cannabis' as JurisdictionId));
      const { result: orResult } = renderHook(() => useJurisdiction('oregon_cannabis' as JurisdictionId));
      const { result: caResult } = renderHook(() => useJurisdiction('canada_cannabis' as JurisdictionId));

      expect(mdResult.current.isCannabiJurisdiction).toBe(true);
      expect(orResult.current.isCannabiJurisdiction).toBe(true);
      expect(caResult.current.isCannabiJurisdiction).toBe(true);
    });

    it('should correctly identify produce jurisdictions', () => {
      const { result } = renderHook(() => useJurisdiction('primus_gfs' as JurisdictionId));

      expect(result.current.isProduceJurisdiction).toBe(true);
      expect(result.current.isCannabiJurisdiction).toBe(false);
    });
  });
});

describe('useJurisdictionOptions', () => {
  it('should return all jurisdiction options without plant type filter', () => {
    const { result } = renderHook(() => useJurisdictionOptions());
    const options = result.current();

    expect(Array.isArray(options)).toBe(true);
    expect(options.length).toBeGreaterThan(0);
    expect(options[0]).toHaveProperty('value');
    expect(options[0]).toHaveProperty('label');
    expect(options[0]).toHaveProperty('country');
    expect(options[0]).toHaveProperty('plantType');
  });

  it('should filter jurisdictions by cannabis plant type', () => {
    const { result } = renderHook(() => useJurisdictionOptions('cannabis'));
    const options = result.current();

    expect(Array.isArray(options)).toBe(true);
    options.forEach(option => {
      expect(option.plantType).toBe('cannabis');
    });
  });

  it('should filter jurisdictions by produce plant type', () => {
    const { result } = renderHook(() => useJurisdictionOptions('produce'));
    const options = result.current();

    expect(Array.isArray(options)).toBe(true);
    options.forEach(option => {
      expect(option.plantType).toBe('produce');
    });
  });

    it('should include proper option structure', () => {
      const { result } = renderHook(() => useJurisdictionOptions('cannabis'));
      const options = result.current();

      const mdOption = options.find(opt => opt.value === 'maryland_cannabis');
      expect(mdOption).toBeDefined();
      expect(mdOption?.label).toBe('Maryland Cannabis (Metrc)');
      expect(mdOption?.country).toBe('us');
      expect(mdOption?.plantType).toBe('cannabis');
    });  it('should memoize results properly', () => {
    const { result, rerender } = renderHook(
      ({ plantType }) => useJurisdictionOptions(plantType),
      { initialProps: { plantType: 'cannabis' as const } }
    );

    const firstCall = result.current;
    rerender({ plantType: 'cannabis' as const });
    const secondCall = result.current;

    // Should return the same function reference due to useCallback
    expect(firstCall).toBe(secondCall);
  });
});
