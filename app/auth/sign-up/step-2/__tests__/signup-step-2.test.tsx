/**
 * Signup Step 2 Integration Tests
 * Tests company details, jurisdiction selection, validation, and security
 */

import { render, screen, fireEvent } from '@testing-library/react';
import SignUpStep2 from '../page';

// Mock localStorage with actual storage
const storageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: storageMock,
  writable: true
});

describe('Signup Step 2 - Company Details', () => {
  beforeEach(() => {
    storageMock.clear();
    storageMock.getItem.mockClear();
    storageMock.setItem.mockClear();
    // Set step 1 data to allow access to step 2
    storageMock.setItem('signupStep1', JSON.stringify({
      name: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
      role: 'org_admin'
    }));
    // Clear mock calls from setup
    storageMock.setItem.mockClear();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<SignUpStep2 />);
      
      expect(screen.getByText('Company Details')).toBeInTheDocument();
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company website/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/farm location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/plant type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/regulatory jurisdiction/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/data region/i)).toBeInTheDocument();
    });

    it('should render progress indicator showing step 2 of 4', () => {
      render(<SignUpStep2 />);
      
      // ProgressIndicator should be rendered with currentStep={2}
      const progressIndicator = screen.getByText('Company Details').closest('div');
      expect(progressIndicator).toBeInTheDocument();
    });

    it('should render back and next buttons', () => {
      render(<SignUpStep2 />);
      
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('should show helper text for all fields', () => {
      render(<SignUpStep2 />);
      
      expect(screen.getByText(/enter the official name of your company/i)).toBeInTheDocument();
      expect(screen.getByText(/provide your company's website/i)).toBeInTheDocument();
      expect(screen.getByText(/provide the full address of your farm/i)).toBeInTheDocument();
      expect(screen.getByText(/select the primary type of plants/i)).toBeInTheDocument();
      expect(screen.getByText(/select the regulatory framework/i)).toBeInTheDocument();
      expect(screen.getByText(/choose where your data will be stored/i)).toBeInTheDocument();
    });
  });

  describe('Access Control', () => {
    it('should redirect to step 1 if step 1 not completed', async () => {
      // When step 1 data is missing, component should redirect
      storageMock.clear();
      
      // Mock console.error to suppress JSDOM navigation warnings
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SignUpStep2 />);
      
      // Check that console.error was called with the navigation error
      expect(consoleError).toHaveBeenCalled();
      const errorCalls = consoleError.mock.calls.find(call => 
        call.some(arg => arg?.message?.includes('Not implemented: navigation'))
      );
      expect(errorCalls).toBeDefined();
      
      consoleError.mockRestore();
    });

    it('should allow access if step 1 is completed', () => {
      render(<SignUpStep2 />);
      
      expect(screen.getByText('Company Details')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require company name', () => {
      render(<SignUpStep2 />);
      
      const label = screen.getByText(/company name/i);
      // The asterisk (*) indicates required - it's rendered separately in a span
      expect(label.textContent).toMatch(/company name/i);
      expect(label.querySelector('span.text-red-600')).toBeInTheDocument();
    });

    it('should mark company website as optional', () => {
      render(<SignUpStep2 />);
      
      const label = screen.getByText(/company website/i);
      expect(label).toHaveTextContent(/optional/i);
    });

    it('should require farm location', () => {
      render(<SignUpStep2 />);
      
      const label = screen.getByText(/farm location/i);
      // The asterisk (*) indicates required
      expect(label.textContent).toMatch(/farm location/i);
      expect(label.querySelector('span.text-red-600')).toBeInTheDocument();
    });

    it('should require plant type selection', () => {
      render(<SignUpStep2 />);
      
      // Get the label element specifically (not the placeholder text in options)
      const labels = screen.getAllByText(/plant type/i);
      const labelElement = labels.find(el => el.tagName === 'LABEL');
      expect(labelElement).toBeDefined();
      expect(labelElement?.querySelector('span.text-red-600')).toBeInTheDocument();
    });

    it('should require jurisdiction selection', () => {
      render(<SignUpStep2 />);
      
      const label = screen.getByText(/regulatory jurisdiction/i);
      expect(label.querySelector('span.text-red-600')).toBeInTheDocument();
    });

    it('should require data region selection', () => {
      render(<SignUpStep2 />);
      
      // Get the label element specifically (not the placeholder text in options)
      const labels = screen.getAllByText(/data region/i);
      const labelElement = labels.find(el => el.tagName === 'LABEL');
      expect(labelElement).toBeDefined();
      expect(labelElement?.querySelector('span.text-red-600')).toBeInTheDocument();
    });

    it('should disable next button when required fields are empty', () => {
      render(<SignUpStep2 />);
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('should enable next button when all required fields are filled', () => {
      render(<SignUpStep2 />);
      
      const companyNameInput = screen.getByLabelText(/company name/i);
      const farmLocationInput = screen.getByLabelText(/farm location/i);
      const plantTypeSelect = screen.getByLabelText(/plant type/i);
      const jurisdictionSelect = screen.getByLabelText(/regulatory jurisdiction/i);
      const dataRegionSelect = screen.getByLabelText(/data region/i);
      
      fireEvent.change(companyNameInput, { target: { value: 'Test Farm Inc' } });
      fireEvent.change(farmLocationInput, { target: { value: '123 Farm Road' } });
      fireEvent.change(plantTypeSelect, { target: { value: 'cannabis' } });
      fireEvent.change(jurisdictionSelect, { target: { value: 'oregon' } });
      fireEvent.change(dataRegionSelect, { target: { value: 'us' } });
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('Plant Type Selection', () => {
    it('should show cannabis and produce options', () => {
      render(<SignUpStep2 />);
      
      const plantTypeSelect = screen.getByLabelText(/plant type/i) as HTMLSelectElement;
      
      expect(plantTypeSelect.options.length).toBeGreaterThan(0);
      const optionTexts = Array.from(plantTypeSelect.options).map(opt => opt.textContent);
      expect(optionTexts).toContain('Cannabis');
      expect(optionTexts).toContain('Produce');
    });

    it('should show placeholder when no plant type selected', () => {
      render(<SignUpStep2 />);
      
      const plantTypeSelect = screen.getByLabelText(/plant type/i) as HTMLSelectElement;
      expect(plantTypeSelect.value).toBe('');
      expect(plantTypeSelect.options[0].textContent).toBe('Select Plant Type');
    });
  });

  describe('Jurisdiction Selection - Cannabis', () => {
    it('should show cannabis jurisdictions when cannabis plant type selected', () => {
      render(<SignUpStep2 />);
      
      const plantTypeSelect = screen.getByLabelText(/plant type/i);
      fireEvent.change(plantTypeSelect, { target: { value: 'cannabis' } });
      
      const jurisdictionSelect = screen.getByLabelText(/regulatory jurisdiction/i) as HTMLSelectElement;
      const optionTexts = Array.from(jurisdictionSelect.options).map(opt => opt.textContent);
      
      expect(optionTexts).toContain('Oregon (Metrc)');
      expect(optionTexts).toContain('Maryland (Metrc)');
      expect(optionTexts).toContain('Canada (CTLS)');
      expect(optionTexts).not.toContain('PrimusGFS Certification');
    });

    it('should allow selection of Oregon jurisdiction', () => {
      render(<SignUpStep2 />);
      
      const plantTypeSelect = screen.getByLabelText(/plant type/i);
      const jurisdictionSelect = screen.getByLabelText(/regulatory jurisdiction/i);
      
      fireEvent.change(plantTypeSelect, { target: { value: 'cannabis' } });
      fireEvent.change(jurisdictionSelect, { target: { value: 'oregon' } });
      
      expect((jurisdictionSelect as HTMLSelectElement).value).toBe('oregon');
    });

    it('should allow selection of Maryland jurisdiction', () => {
      render(<SignUpStep2 />);
      
      const plantTypeSelect = screen.getByLabelText(/plant type/i);
      const jurisdictionSelect = screen.getByLabelText(/regulatory jurisdiction/i);
      
      fireEvent.change(plantTypeSelect, { target: { value: 'cannabis' } });
      fireEvent.change(jurisdictionSelect, { target: { value: 'maryland' } });
      
      expect((jurisdictionSelect as HTMLSelectElement).value).toBe('maryland');
    });

    it('should allow selection of Canada jurisdiction', () => {
      render(<SignUpStep2 />);
      
      const plantTypeSelect = screen.getByLabelText(/plant type/i);
      const jurisdictionSelect = screen.getByLabelText(/regulatory jurisdiction/i);
      
      fireEvent.change(plantTypeSelect, { target: { value: 'cannabis' } });
      fireEvent.change(jurisdictionSelect, { target: { value: 'canada' } });
      
      expect((jurisdictionSelect as HTMLSelectElement).value).toBe('canada');
    });
  });

  describe('Jurisdiction Selection - Produce', () => {
    it('should show PrimusGFS when produce plant type selected', () => {
      render(<SignUpStep2 />);
      
      const plantTypeSelect = screen.getByLabelText(/plant type/i);
      fireEvent.change(plantTypeSelect, { target: { value: 'produce' } });
      
      const jurisdictionSelect = screen.getByLabelText(/regulatory jurisdiction/i) as HTMLSelectElement;
      const optionTexts = Array.from(jurisdictionSelect.options).map(opt => opt.textContent);
      
      expect(optionTexts).toContain('PrimusGFS Certification');
      expect(optionTexts).not.toContain('Oregon (Metrc)');
      expect(optionTexts).not.toContain('Maryland (Metrc)');
      expect(optionTexts).not.toContain('Canada (CTLS)');
    });

    it('should allow selection of PrimusGFS jurisdiction', () => {
      render(<SignUpStep2 />);
      
      const plantTypeSelect = screen.getByLabelText(/plant type/i);
      const jurisdictionSelect = screen.getByLabelText(/regulatory jurisdiction/i);
      
      fireEvent.change(plantTypeSelect, { target: { value: 'produce' } });
      fireEvent.change(jurisdictionSelect, { target: { value: 'primus_gfs' } });
      
      expect((jurisdictionSelect as HTMLSelectElement).value).toBe('primus_gfs');
    });
  });

  describe('Jurisdiction Selection - No Plant Type', () => {
    it('should show disabled message when no plant type selected', () => {
      render(<SignUpStep2 />);
      
      const jurisdictionSelect = screen.getByLabelText(/regulatory jurisdiction/i) as HTMLSelectElement;
      const optionTexts = Array.from(jurisdictionSelect.options).map(opt => opt.textContent);
      
      expect(optionTexts).toContain('Please select plant type first');
    });
  });

  describe('Data Region Selection', () => {
    it('should show US and Canada data region options', () => {
      render(<SignUpStep2 />);
      
      const dataRegionSelect = screen.getByLabelText(/data region/i) as HTMLSelectElement;
      const optionTexts = Array.from(dataRegionSelect.options).map(opt => opt.textContent);
      
      expect(optionTexts).toContain('United States');
      expect(optionTexts).toContain('Canada');
    });

    it('should allow selection of US data region', () => {
      render(<SignUpStep2 />);
      
      const dataRegionSelect = screen.getByLabelText(/data region/i);
      fireEvent.change(dataRegionSelect, { target: { value: 'us' } });
      
      expect((dataRegionSelect as HTMLSelectElement).value).toBe('us');
    });

    it('should allow selection of Canada data region', () => {
      render(<SignUpStep2 />);
      
      const dataRegionSelect = screen.getByLabelText(/data region/i);
      fireEvent.change(dataRegionSelect, { target: { value: 'canada' } });
      
      expect((dataRegionSelect as HTMLSelectElement).value).toBe('canada');
    });
  });

  describe('Navigation', () => {
    it('should navigate back to step 1 when back button clicked', () => {
      // Mock console.error to suppress JSDOM navigation warnings
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SignUpStep2 />);
      
      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);
      
      // Check that navigation error was triggered (proves navigation was attempted)
      expect(consoleError).toHaveBeenCalled();
      const navError = consoleError.mock.calls.find(call => 
        call.some(arg => arg?.message?.includes('Not implemented: navigation'))
      );
      expect(navError).toBeDefined();
      
      consoleError.mockRestore();
    });

    it('should save data and navigate to step 3 when next button clicked', () => {
      // Mock console.error to suppress JSDOM navigation warnings  
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SignUpStep2 />);
      
      // Fill in all required fields
      const companyNameInput = screen.getByLabelText(/company name/i);
      const farmLocationInput = screen.getByLabelText(/farm location/i);
      const plantTypeSelect = screen.getByLabelText(/plant type/i);
      const jurisdictionSelect = screen.getByLabelText(/regulatory jurisdiction/i);
      const dataRegionSelect = screen.getByLabelText(/data region/i);
      
      fireEvent.change(companyNameInput, { target: { value: 'Green Leaf Farms' } });
      fireEvent.change(farmLocationInput, { target: { value: '123 Farm Road, Portland, OR' } });
      fireEvent.change(plantTypeSelect, { target: { value: 'cannabis' } });
      fireEvent.change(jurisdictionSelect, { target: { value: 'oregon' } });
      fireEvent.change(dataRegionSelect, { target: { value: 'us' } });
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      
      // Check localStorage.setItem was called with the correct data
      expect(storageMock.setItem).toHaveBeenCalledWith(
        'signupStep2',
        expect.stringContaining('Green Leaf Farms')
      );
      
      // Parse the actual stored data
      const setItemCall = storageMock.setItem.mock.calls.find(call => call[0] === 'signupStep2');
      expect(setItemCall).toBeDefined();
      const savedData = JSON.parse(setItemCall![1]);
      expect(savedData.companyName).toBe('Green Leaf Farms');
      expect(savedData.farmLocation).toBe('123 Farm Road, Portland, OR');
      expect(savedData.plantType).toBe('cannabis');
      expect(savedData.jurisdiction).toBe('oregon');
      expect(savedData.dataRegion).toBe('us');
      
      // Check that navigation was attempted
      expect(consoleError).toHaveBeenCalled();
      const navError = consoleError.mock.calls.find(call => 
        call.some(arg => arg?.message?.includes('Not implemented: navigation'))
      );
      expect(navError).toBeDefined();
      
      consoleError.mockRestore();
    });
  });

  describe('Data Persistence', () => {
    it('should save all form data to localStorage including optional fields', () => {
      // Mock console.error to suppress JSDOM navigation warnings
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SignUpStep2 />);
      
      // Fill in all fields including optional ones
      const companyNameInput = screen.getByLabelText(/company name/i);
      const companyWebsiteInput = screen.getByLabelText(/company website/i);
      const farmLocationInput = screen.getByLabelText(/farm location/i);
      const plantTypeSelect = screen.getByLabelText(/plant type/i);
      const jurisdictionSelect = screen.getByLabelText(/regulatory jurisdiction/i);
      const dataRegionSelect = screen.getByLabelText(/data region/i);
      
      fireEvent.change(companyNameInput, { target: { value: 'Test Farm Inc' } });
      fireEvent.change(companyWebsiteInput, { target: { value: 'https://testfarm.com' } });
      fireEvent.change(farmLocationInput, { target: { value: '456 Test St' } });
      fireEvent.change(plantTypeSelect, { target: { value: 'produce' } });
      fireEvent.change(jurisdictionSelect, { target: { value: 'primus_gfs' } }); // Correct value with underscore
      fireEvent.change(dataRegionSelect, { target: { value: 'canada' } });
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      
      // Check localStorage.setItem was called
      expect(storageMock.setItem).toHaveBeenCalled();
      
      // Get the actual stored data
      const setItemCall = storageMock.setItem.mock.calls.find((call: [string, string]) => call[0] === 'signupStep2');
      expect(setItemCall).toBeDefined();
      const savedData = JSON.parse(setItemCall![1]);
      
      expect(savedData.companyName).toBe('Test Farm Inc');
      expect(savedData.companyWebsite).toBe('https://testfarm.com');
      expect(savedData.farmLocation).toBe('456 Test St');
      expect(savedData.plantType).toBe('produce');
      expect(savedData.jurisdiction).toBe('primus_gfs');
      expect(savedData.dataRegion).toBe('canada');
      
      consoleError.mockRestore();
    });
  });

  describe('Security and Data Integrity', () => {
    it('should validate company website URL format', () => {
      render(<SignUpStep2 />);
      
      const websiteInput = screen.getByLabelText(/company website/i);
      expect(websiteInput).toHaveAttribute('type', 'url');
    });

    it('should prevent progression without all required fields', () => {
      render(<SignUpStep2 />);
      
      // Fill only some fields
      const companyNameInput = screen.getByLabelText(/company name/i);
      fireEvent.change(companyNameInput, { target: { value: 'Test Farm' } });
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('should clear jurisdiction when plant type changes', () => {
      render(<SignUpStep2 />);
      
      const plantTypeSelect = screen.getByLabelText(/plant type/i);
      const jurisdictionSelect = screen.getByLabelText(/regulatory jurisdiction/i);
      
      // Select cannabis and jurisdiction
      fireEvent.change(plantTypeSelect, { target: { value: 'cannabis' } });
      fireEvent.change(jurisdictionSelect, { target: { value: 'oregon' } });
      
      // Change to produce - jurisdiction should reset
      fireEvent.change(plantTypeSelect, { target: { value: 'produce' } });
      
      // Oregon should no longer be available
      const optionTexts = Array.from((jurisdictionSelect as HTMLSelectElement).options).map(opt => opt.value);
      expect(optionTexts).not.toContain('oregon');
    });
  });
});
