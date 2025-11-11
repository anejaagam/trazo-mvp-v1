import { getStoredRegion, setStoredRegion, clearStoredRegion } from '../client';

describe('Client Storage Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('getStoredRegion', () => {
    it('should return US as default when no region is stored', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);
      
      const region = getStoredRegion();
      
      expect(region).toBe('US');
      expect(localStorage.getItem).toHaveBeenCalledWith('user_region');
    });

    it('should return CA when CA is stored', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('CA');
      
      const region = getStoredRegion();
      
      expect(region).toBe('CA');
      expect(localStorage.getItem).toHaveBeenCalledWith('user_region');
    });

    it('should return US when US is stored', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('US');
      
      const region = getStoredRegion();
      
      expect(region).toBe('US');
      expect(localStorage.getItem).toHaveBeenCalledWith('user_region');
    });

    it('should return US for invalid stored values', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('INVALID');
      
      const region = getStoredRegion();
      
      expect(region).toBe('US');
    });

    it('should return US when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Simulating SSR environment
      delete global.window;
      
      const region = getStoredRegion();
      
      expect(region).toBe('US');
      
      global.window = originalWindow;
    });
  });

  describe('setStoredRegion', () => {
    it('should store US region in localStorage', () => {
      setStoredRegion('US');
      
      expect(localStorage.setItem).toHaveBeenCalledWith('user_region', 'US');
    });

    it('should store CA region in localStorage', () => {
      setStoredRegion('CA');
      
      expect(localStorage.setItem).toHaveBeenCalledWith('user_region', 'CA');
    });

    it('should not throw when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Simulating SSR environment
      delete global.window;
      
      expect(() => setStoredRegion('US')).not.toThrow();
      
      global.window = originalWindow;
    });
  });

  describe('clearStoredRegion', () => {
    it('should remove region from localStorage', () => {
      clearStoredRegion();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('user_region');
    });

    it('should not throw when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Simulating SSR environment
      delete global.window;
      
      expect(() => clearStoredRegion()).not.toThrow();
      
      global.window = originalWindow;
    });
  });

  describe('Integration: Store and Retrieve', () => {
    it('should store and retrieve US region correctly', () => {
      let storedValue: string | null = null;
      
      (localStorage.setItem as jest.Mock).mockImplementation((key, value) => {
        storedValue = value;
      });
      (localStorage.getItem as jest.Mock).mockImplementation(() => storedValue);
      
      setStoredRegion('US');
      const retrieved = getStoredRegion();
      
      expect(retrieved).toBe('US');
    });

    it('should store and retrieve CA region correctly', () => {
      let storedValue: string | null = null;
      
      (localStorage.setItem as jest.Mock).mockImplementation((key, value) => {
        storedValue = value;
      });
      (localStorage.getItem as jest.Mock).mockImplementation(() => storedValue);
      
      setStoredRegion('CA');
      const retrieved = getStoredRegion();
      
      expect(retrieved).toBe('CA');
    });

    it('should clear region and default to US', () => {
      let storedValue: string | null = 'CA';
      
      (localStorage.setItem as jest.Mock).mockImplementation((key, value) => {
        storedValue = value;
      });
      (localStorage.getItem as jest.Mock).mockImplementation(() => storedValue);
      (localStorage.removeItem as jest.Mock).mockImplementation(() => {
        storedValue = null;
      });
      
      setStoredRegion('CA');
      expect(getStoredRegion()).toBe('CA');
      
      clearStoredRegion();
      expect(getStoredRegion()).toBe('US');
    });
  });
});
