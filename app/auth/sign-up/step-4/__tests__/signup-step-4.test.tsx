import { render, screen, fireEvent } from '@testing-library/react';
import SignUpStep4 from '../page';

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

// Mock console.log to check complete signup data
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

describe('Signup Step 4 - Farm Details', () => {
  beforeEach(() => {
    storageMock.clear();
    storageMock.getItem.mockClear();
    storageMock.setItem.mockClear();
    consoleLogSpy.mockClear();
    
    // Set steps 1, 2, and 3 data to allow access to step 4
    storageMock.setItem('signupStep1', JSON.stringify({
      name: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
      role: 'org_admin'
    }));
    storageMock.setItem('signupStep2', JSON.stringify({
      companyName: 'Test Farm Inc',
      companyWebsite: 'https://testfarm.com',
      farmLocation: '123 Farm Road',
      plantType: 'cannabis',
      jurisdiction: 'oregon',
      dataRegion: 'us'
    }));
    storageMock.setItem('signupStep3', JSON.stringify({
      emergencyContactPerson: 'Jane Doe',
      emergencyContactEmail: 'jane@emergency.com',
      emergencyContactNumber: '+1234567890'
    }));
    
    // Clear mock calls from setup
    storageMock.setItem.mockClear();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<SignUpStep4 />);
      
      expect(screen.getByLabelText(/number of containers/i)).toBeInTheDocument();
      expect(screen.getByText('Type of Crop')).toBeInTheDocument();
      expect(screen.getByText('Growing Environment')).toBeInTheDocument();
    });

    it('should render progress indicator showing step 4 of 4', () => {
      render(<SignUpStep4 />);
      
      expect(screen.getByText(/step 4 of 4/i)).toBeInTheDocument();
    });

    it('should render back and complete setup buttons', () => {
      render(<SignUpStep4 />);
      
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /complete setup/i })).toBeInTheDocument();
    });

    it('should show helper text for all fields', () => {
      render(<SignUpStep4 />);
      
      expect(screen.getByText(/specify the total number of containers/i)).toBeInTheDocument();
      expect(screen.getByText(/select the primary type of crop/i)).toBeInTheDocument();
      expect(screen.getByText(/indicate whether your farm operates/i)).toBeInTheDocument();
    });

    it('should render page title', () => {
      render(<SignUpStep4 />);
      
      expect(screen.getByText('Farm Details')).toBeInTheDocument();
    });
  });

  describe('Access Control', () => {
    it('should redirect to step 1 if step 1 not completed', () => {
      storageMock.clear();
      storageMock.setItem('signupStep2', JSON.stringify({ companyName: 'Test' }));
      storageMock.setItem('signupStep3', JSON.stringify({ emergencyContactPerson: 'Test' }));
      
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SignUpStep4 />);
      
      expect(consoleError).toHaveBeenCalled();
      const errorCalls = consoleError.mock.calls.find(call => 
        call.some(arg => arg?.message?.includes('Not implemented: navigation'))
      );
      expect(errorCalls).toBeDefined();
      
      consoleError.mockRestore();
    });

    it('should redirect to step 1 if step 2 not completed', () => {
      storageMock.clear();
      storageMock.setItem('signupStep1', JSON.stringify({ name: 'Test' }));
      storageMock.setItem('signupStep3', JSON.stringify({ emergencyContactPerson: 'Test' }));
      
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SignUpStep4 />);
      
      expect(consoleError).toHaveBeenCalled();
      const errorCalls = consoleError.mock.calls.find(call => 
        call.some(arg => arg?.message?.includes('Not implemented: navigation'))
      );
      expect(errorCalls).toBeDefined();
      
      consoleError.mockRestore();
    });

    it('should redirect to step 1 if step 3 not completed', () => {
      storageMock.clear();
      storageMock.setItem('signupStep1', JSON.stringify({ name: 'Test' }));
      storageMock.setItem('signupStep2', JSON.stringify({ companyName: 'Test' }));
      
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SignUpStep4 />);
      
      expect(consoleError).toHaveBeenCalled();
      const errorCalls = consoleError.mock.calls.find(call => 
        call.some(arg => arg?.message?.includes('Not implemented: navigation'))
      );
      expect(errorCalls).toBeDefined();
      
      consoleError.mockRestore();
    });

    it('should allow access if all previous steps are completed', () => {
      render(<SignUpStep4 />);
      
      expect(screen.getByText('Farm Details')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require number of containers', () => {
      render(<SignUpStep4 />);
      
      const labels = screen.getAllByText(/number of containers/i);
      const label = labels.find(el => el.tagName === 'LABEL');
      expect(label?.querySelector('span.text-red-600')).toBeInTheDocument();
    });

    it('should disable complete button when number of containers is empty', () => {
      render(<SignUpStep4 />);
      
      const completeButton = screen.getByRole('button', { name: /complete setup/i });
      expect(completeButton).toBeDisabled();
    });

    it('should enable complete button when number of containers is filled', () => {
      render(<SignUpStep4 />);
      
      const containersInput = screen.getByLabelText(/number of containers/i);
      fireEvent.change(containersInput, { target: { value: '10' } });
      
      const completeButton = screen.getByRole('button', { name: /complete setup/i });
      expect(completeButton).not.toBeDisabled();
    });
  });

  describe('Field Types', () => {
    it('should have number input for containers', () => {
      render(<SignUpStep4 />);
      
      const input = screen.getByLabelText(/number of containers/i);
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('Crop Type Selection', () => {
    it('should default to produce crop type', () => {
      render(<SignUpStep4 />);
      
      const produceCheckbox = screen.getByRole('checkbox', { name: 'Produce' });
      const cannabisCheckbox = screen.getByRole('checkbox', { name: 'Cannabis' });
      
      expect(produceCheckbox.getAttribute('data-state')).toBe('checked');
      expect(cannabisCheckbox.getAttribute('data-state')).not.toBe('checked');
    });

    it('should allow switching to cannabis crop type', () => {
      render(<SignUpStep4 />);
      
      const cannabisLabel = screen.getByLabelText('Cannabis');
      fireEvent.click(cannabisLabel);
      
      const cannabisCheckbox = screen.getByRole('checkbox', { name: 'Cannabis' });
      const produceCheckbox = screen.getByRole('checkbox', { name: 'Produce' });
      
      expect(cannabisCheckbox.getAttribute('data-state')).toBe('checked');
      expect(produceCheckbox.getAttribute('data-state')).not.toBe('checked');
    });

    it('should switch back to produce from cannabis', () => {
      render(<SignUpStep4 />);
      
      const cannabisLabel = screen.getByLabelText('Cannabis');
      fireEvent.click(cannabisLabel);
      
      const produceLabel = screen.getByLabelText('Produce');
      fireEvent.click(produceLabel);
      
      const produceCheckbox = screen.getByRole('checkbox', { name: 'Produce' });
      const cannabisCheckbox = screen.getByRole('checkbox', { name: 'Cannabis' });
      
      expect(produceCheckbox.getAttribute('data-state')).toBe('checked');
      expect(cannabisCheckbox.getAttribute('data-state')).not.toBe('checked');
    });
  });

  describe('Growing Environment Selection', () => {
    it('should default to indoor growing environment', () => {
      render(<SignUpStep4 />);
      
      const indoorCheckbox = screen.getByRole('checkbox', { name: 'Indoor' });
      const outdoorCheckbox = screen.getByRole('checkbox', { name: 'Outdoor' });
      
      expect(indoorCheckbox.getAttribute('data-state')).toBe('checked');
      expect(outdoorCheckbox.getAttribute('data-state')).not.toBe('checked');
    });

    it('should allow switching to outdoor environment', () => {
      render(<SignUpStep4 />);
      
      const outdoorLabel = screen.getByLabelText('Outdoor');
      fireEvent.click(outdoorLabel);
      
      const outdoorCheckbox = screen.getByRole('checkbox', { name: 'Outdoor' });
      const indoorCheckbox = screen.getByRole('checkbox', { name: 'Indoor' });
      
      expect(outdoorCheckbox.getAttribute('data-state')).toBe('checked');
      expect(indoorCheckbox.getAttribute('data-state')).not.toBe('checked');
    });

    it('should switch back to indoor from outdoor', () => {
      render(<SignUpStep4 />);
      
      const outdoorLabel = screen.getByLabelText('Outdoor');
      fireEvent.click(outdoorLabel);
      
      const indoorLabel = screen.getByLabelText('Indoor');
      fireEvent.click(indoorLabel);
      
      const indoorCheckbox = screen.getByRole('checkbox', { name: 'Indoor' });
      const outdoorCheckbox = screen.getByRole('checkbox', { name: 'Outdoor' });
      
      expect(indoorCheckbox.getAttribute('data-state')).toBe('checked');
      expect(outdoorCheckbox.getAttribute('data-state')).not.toBe('checked');
    });
  });

  describe('Form Input', () => {
    it('should update number of containers when typing', () => {
      render(<SignUpStep4 />);
      
      const input = screen.getByLabelText(/number of containers/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: '25' } });
      
      expect(input.value).toBe('25');
    });

    it('should accept numeric values for containers', () => {
      render(<SignUpStep4 />);
      
      const input = screen.getByLabelText(/number of containers/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: '100' } });
      
      expect(input.value).toBe('100');
    });
  });

  describe('Navigation', () => {
    it('should navigate back to step 3 when back button clicked', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SignUpStep4 />);
      
      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);
      
      expect(consoleError).toHaveBeenCalled();
      const navError = consoleError.mock.calls.find(call => 
        call.some(arg => arg?.message?.includes('Not implemented: navigation'))
      );
      expect(navError).toBeDefined();
      
      consoleError.mockRestore();
    });

    it('should complete signup and navigate to success page', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SignUpStep4 />);
      
      const containersInput = screen.getByLabelText(/number of containers/i);
      fireEvent.change(containersInput, { target: { value: '50' } });
      
      const completeButton = screen.getByRole('button', { name: /complete setup/i });
      fireEvent.click(completeButton);
      
      // Check localStorage.setItem was called for step 4
      expect(storageMock.setItem).toHaveBeenCalledWith(
        'signupStep4',
        expect.stringContaining('50')
      );
      
      // Check navigation was attempted
      expect(consoleError).toHaveBeenCalled();
      
      consoleError.mockRestore();
    });
  });

  describe('Data Persistence', () => {
    it('should save step 4 data to localStorage', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SignUpStep4 />);
      
      const containersInput = screen.getByLabelText(/number of containers/i);
      fireEvent.change(containersInput, { target: { value: '30' } });
      
      const cannabisCheckbox = screen.getByLabelText('Cannabis');
      fireEvent.click(cannabisCheckbox);
      
      const outdoorCheckbox = screen.getByLabelText('Outdoor');
      fireEvent.click(outdoorCheckbox);
      
      const completeButton = screen.getByRole('button', { name: /complete setup/i });
      fireEvent.click(completeButton);
      
      const setItemCall = storageMock.setItem.mock.calls.find((call: [string, string]) => call[0] === 'signupStep4');
      expect(setItemCall).toBeDefined();
      const savedData = JSON.parse(setItemCall![1]);
      
      expect(savedData.numberOfContainers).toBe('30');
      expect(savedData.cropType).toBe('cannabis');
      expect(savedData.growingEnvironment).toBe('outdoor');
      
      consoleError.mockRestore();
    });

    it('should combine all steps data on completion', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SignUpStep4 />);
      
      const containersInput = screen.getByLabelText(/number of containers/i);
      fireEvent.change(containersInput, { target: { value: '20' } });
      
      const completeButton = screen.getByRole('button', { name: /complete setup/i });
      fireEvent.click(completeButton);
      
      // Check console.log was called with complete signup data
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Complete signup data:',
        expect.objectContaining({
          step1: expect.objectContaining({ name: 'John Doe' }),
          step2: expect.objectContaining({ companyName: 'Test Farm Inc' }),
          step3: expect.objectContaining({ emergencyContactPerson: 'Jane Doe' }),
          step4: expect.objectContaining({ numberOfContainers: '20' })
        })
      );
      
      consoleError.mockRestore();
    });
  });

  describe('Security and Data Integrity', () => {
    it('should prevent progression without required field', () => {
      render(<SignUpStep4 />);
      
      const completeButton = screen.getByRole('button', { name: /complete setup/i });
      expect(completeButton).toBeDisabled();
    });

    it('should properly store form data structure', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SignUpStep4 />);
      
      const containersInput = screen.getByLabelText(/number of containers/i);
      fireEvent.change(containersInput, { target: { value: '15' } });
      
      const completeButton = screen.getByRole('button', { name: /complete setup/i });
      fireEvent.click(completeButton);
      
      const setItemCall = storageMock.setItem.mock.calls.find((call: [string, string]) => call[0] === 'signupStep4');
      expect(setItemCall).toBeDefined();
      const savedData = JSON.parse(setItemCall![1]);
      
      // Verify data structure has exactly the expected fields
      expect(Object.keys(savedData).sort()).toEqual([
        'cropType',
        'growingEnvironment',
        'numberOfContainers'
      ].sort());
      
      consoleError.mockRestore();
    });

    it('should validate number input type', () => {
      render(<SignUpStep4 />);
      
      const input = screen.getByLabelText(/number of containers/i);
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('Default Values', () => {
    it('should have produce as default crop type', () => {
      render(<SignUpStep4 />);
      
      const produceCheckbox = screen.getByRole('checkbox', { name: 'Produce' });
      expect(produceCheckbox.getAttribute('data-state')).toBe('checked');
    });

    it('should have indoor as default growing environment', () => {
      render(<SignUpStep4 />);
      
      const indoorCheckbox = screen.getByRole('checkbox', { name: 'Indoor' });
      expect(indoorCheckbox.getAttribute('data-state')).toBe('checked');
    });

    it('should have empty containers field initially', () => {
      render(<SignUpStep4 />);
      
      const input = screen.getByLabelText(/number of containers/i) as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  describe('UI Elements', () => {
    it('should display package icon for containers field', () => {
      render(<SignUpStep4 />);
      
      const container = screen.getByLabelText(/number of containers/i).parentElement;
      expect(container?.querySelector('svg.lucide-package')).toBeInTheDocument();
    });

    it('should have proper placeholder text', () => {
      render(<SignUpStep4 />);
      
      expect(screen.getByPlaceholderText('Number of Containers')).toBeInTheDocument();
    });

    it('should render checkbox elements for crop type', () => {
      render(<SignUpStep4 />);
      
      expect(screen.getByLabelText('Produce')).toBeInTheDocument();
      expect(screen.getByLabelText('Cannabis')).toBeInTheDocument();
    });

    it('should render checkbox elements for growing environment', () => {
      render(<SignUpStep4 />);
      
      expect(screen.getByLabelText('Indoor')).toBeInTheDocument();
      expect(screen.getByLabelText('Outdoor')).toBeInTheDocument();
    });
  });
});
