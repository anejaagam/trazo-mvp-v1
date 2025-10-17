import { getRegionConfig, validateRegionConfig, type Region } from '../region';

describe('Region Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getRegionConfig', () => {
    it('should return US configuration when region is US', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-us.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-us-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-us-service-role-key';

      const config = getRegionConfig('US');

      expect(config.url).toBe('https://test-us.supabase.co');
      expect(config.anonKey).toBe('test-us-anon-key');
      expect(config.serviceRoleKey).toBe('test-us-service-role-key');
    });

    it('should return Canada configuration when region is CA', () => {
      process.env.NEXT_PUBLIC_CAN_SUPABASE_URL = 'https://test-ca.supabase.co';
      process.env.NEXT_PUBLIC_CAN_SUPABASE_ANON_KEY = 'test-ca-anon-key';
      process.env.CAN_SUPABASE_SERVICE_ROLE_KEY = 'test-ca-service-role-key';

      const config = getRegionConfig('CA');

      expect(config.url).toBe('https://test-ca.supabase.co');
      expect(config.anonKey).toBe('test-ca-anon-key');
      expect(config.serviceRoleKey).toBe('test-ca-service-role-key');
    });

    it('should handle missing service role key gracefully', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-us.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-us-anon-key';
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const config = getRegionConfig('US');

      expect(config.url).toBe('https://test-us.supabase.co');
      expect(config.anonKey).toBe('test-us-anon-key');
      expect(config.serviceRoleKey).toBeUndefined();
    });
  });

  describe('validateRegionConfig', () => {
    it('should pass validation when all required env vars are present', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-us.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-us-anon-key';
      process.env.CAN_NEXT_PUBLIC_CASUPABASE_URL = 'https://test-ca.supabase.co';
      process.env.CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY = 'test-ca-anon-key';

      expect(() => validateRegionConfig()).not.toThrow();
    });

    it('should throw error when US URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-us-anon-key';
      process.env.CAN_NEXT_PUBLIC_CASUPABASE_URL = 'https://test-ca.supabase.co';
      process.env.CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY = 'test-ca-anon-key';

      expect(() => validateRegionConfig()).toThrow('Missing NEXT_PUBLIC_SUPABASE_URL');
    });

    it('should throw error when US anon key is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-us.supabase.co';
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      process.env.CAN_NEXT_PUBLIC_CASUPABASE_URL = 'https://test-ca.supabase.co';
      process.env.CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY = 'test-ca-anon-key';

      expect(() => validateRegionConfig()).toThrow('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
    });

    it('should throw error when Canada URL is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-us.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-us-anon-key';
      delete process.env.CAN_NEXT_PUBLIC_CASUPABASE_URL;
      process.env.CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY = 'test-ca-anon-key';

      expect(() => validateRegionConfig()).toThrow('Missing CAN_NEXT_PUBLIC_CASUPABASE_URL');
    });

    it('should throw error when Canada anon key is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-us.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-us-anon-key';
      process.env.CAN_NEXT_PUBLIC_CASUPABASE_URL = 'https://test-ca.supabase.co';
      delete process.env.CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY;

      expect(() => validateRegionConfig()).toThrow('Missing CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY');
    });

    it('should list all missing environment variables', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      delete process.env.CAN_NEXT_PUBLIC_CASUPABASE_URL;
      delete process.env.CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY;

      expect(() => validateRegionConfig()).toThrow(/Missing NEXT_PUBLIC_SUPABASE_URL/);
      expect(() => validateRegionConfig()).toThrow(/Missing NEXT_PUBLIC_SUPABASE_ANON_KEY/);
      expect(() => validateRegionConfig()).toThrow(/Missing CAN_NEXT_PUBLIC_CASUPABASE_URL/);
      expect(() => validateRegionConfig()).toThrow(/Missing CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY/);
    });
  });

  describe('Region Type', () => {
    it('should accept US as a valid region', () => {
      const region: Region = 'US';
      expect(region).toBe('US');
    });

    it('should accept CA as a valid region', () => {
      const region: Region = 'CA';
      expect(region).toBe('CA');
    });
  });
});
