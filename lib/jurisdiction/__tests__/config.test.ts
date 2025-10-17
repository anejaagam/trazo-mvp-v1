import { describe, it, expect } from '@jest/globals';
import { OREGON_CANNABIS } from '../cannabis/oregon';
import { MARYLAND_CANNABIS } from '../cannabis/maryland';  
import { CANADA_CANNABIS } from '../cannabis/canada';
import { PRIMUS_GFS } from '../produce/primus-gfs';

describe('Jurisdiction Configuration System', () => {
  describe('Individual jurisdiction configs', () => {
    it('should have Oregon cannabis configuration', () => {
      expect(OREGON_CANNABIS).toBeDefined();
      expect(OREGON_CANNABIS.id).toBe('oregon_cannabis');
      expect(OREGON_CANNABIS.plant_type).toBe('cannabis');
      expect(OREGON_CANNABIS.country).toBe('us');
      expect(OREGON_CANNABIS.rules).toBeDefined();
    });

    it('should have Maryland cannabis configuration', () => {
      expect(MARYLAND_CANNABIS).toBeDefined();
      expect(MARYLAND_CANNABIS.id).toBe('maryland_cannabis');
      expect(MARYLAND_CANNABIS.plant_type).toBe('cannabis');
      expect(MARYLAND_CANNABIS.country).toBe('us');
    });

    it('should have Canada cannabis configuration', () => {
      expect(CANADA_CANNABIS).toBeDefined();
      expect(CANADA_CANNABIS.id).toBe('canada_cannabis');
      expect(CANADA_CANNABIS.plant_type).toBe('cannabis');
      expect(CANADA_CANNABIS.country).toBe('canada');
    });

    it('should have PrimusGFS configuration', () => {
      expect(PRIMUS_GFS).toBeDefined();
      expect(PRIMUS_GFS.id).toBe('primus_gfs');
      expect(PRIMUS_GFS.plant_type).toBe('produce');
    });
  });

  describe('Config structure validation', () => {
    it('should have all required properties', () => {
      const configs = [OREGON_CANNABIS, MARYLAND_CANNABIS, CANADA_CANNABIS, PRIMUS_GFS];
      
      configs.forEach(config => {
        expect(config.id).toBeDefined();
        expect(config.name).toBeDefined();
        expect(config.country).toBeDefined();
        expect(config.plant_type).toBeDefined();
        expect(config.rules).toBeDefined();
        expect(typeof config.rules).toBe('object');
      });
    });

    it('should have unique jurisdiction IDs', () => {
      const configs = [OREGON_CANNABIS, MARYLAND_CANNABIS, CANADA_CANNABIS, PRIMUS_GFS];
      const ids = configs.map(config => config.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });
  });
});