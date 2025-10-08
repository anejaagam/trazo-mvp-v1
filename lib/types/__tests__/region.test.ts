import { REGION_INFO, type Region, type UserMetadata } from '../region';

describe('Region Types', () => {
  describe('REGION_INFO', () => {
    it('should have US region information', () => {
      expect(REGION_INFO.US).toBeDefined();
      expect(REGION_INFO.US.name).toBe('United States');
      expect(REGION_INFO.US.flag).toBe('🇺🇸');
      expect(REGION_INFO.US.timezone).toBe('America/New_York');
      expect(REGION_INFO.US.supabaseRegion).toBe('us-east-1');
    });

    it('should have CA region information', () => {
      expect(REGION_INFO.CA).toBeDefined();
      expect(REGION_INFO.CA.name).toBe('Canada');
      expect(REGION_INFO.CA.flag).toBe('🇨🇦');
      expect(REGION_INFO.CA.timezone).toBe('America/Toronto');
      expect(REGION_INFO.CA.supabaseRegion).toBe('ca-central-1');
    });

    it('should have exactly 2 regions', () => {
      const regions = Object.keys(REGION_INFO);
      expect(regions).toHaveLength(2);
      expect(regions).toContain('US');
      expect(regions).toContain('CA');
    });

    it('should have consistent structure for all regions', () => {
      Object.values(REGION_INFO).forEach(info => {
        expect(info).toHaveProperty('name');
        expect(info).toHaveProperty('flag');
        expect(info).toHaveProperty('timezone');
        expect(info).toHaveProperty('supabaseRegion');
        expect(typeof info.name).toBe('string');
        expect(typeof info.flag).toBe('string');
        expect(typeof info.timezone).toBe('string');
        expect(typeof info.supabaseRegion).toBe('string');
      });
    });
  });

  describe('Region Type', () => {
    it('should accept US as valid region', () => {
      const region: Region = 'US';
      expect(region).toBe('US');
    });

    it('should accept CA as valid region', () => {
      const region: Region = 'CA';
      expect(region).toBe('CA');
    });
  });

  describe('UserMetadata Type', () => {
    it('should allow valid user metadata with all fields', () => {
      const metadata: UserMetadata = {
        region: 'US',
        full_name: 'John Doe',
        company_name: 'Acme Corp',
      };
      
      expect(metadata.region).toBe('US');
      expect(metadata.full_name).toBe('John Doe');
      expect(metadata.company_name).toBe('Acme Corp');
    });

    it('should allow user metadata with only region', () => {
      const metadata: UserMetadata = {
        region: 'CA',
      };
      
      expect(metadata.region).toBe('CA');
      expect(metadata.full_name).toBeUndefined();
      expect(metadata.company_name).toBeUndefined();
    });

    it('should allow user metadata with region and full name', () => {
      const metadata: UserMetadata = {
        region: 'US',
        full_name: 'Jane Smith',
      };
      
      expect(metadata.region).toBe('US');
      expect(metadata.full_name).toBe('Jane Smith');
      expect(metadata.company_name).toBeUndefined();
    });

    it('should allow user metadata with region and company name', () => {
      const metadata: UserMetadata = {
        region: 'CA',
        company_name: 'Tech Startup Inc',
      };
      
      expect(metadata.region).toBe('CA');
      expect(metadata.full_name).toBeUndefined();
      expect(metadata.company_name).toBe('Tech Startup Inc');
    });
  });
});
