import { render, screen, fireEvent } from '@testing-library/react';
import SignUpStep3 from '../page';

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

describe('Signup Step 3 - Emergency Contact', () => {
  beforeEach(() => {
    storageMock.clear();
    storageMock.getItem.mockClear();
    storageMock.setItem.mockClear();
    
    // Set step 1 and step 2 data to allow access to step 3
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
    
    // Clear mock calls from setup
    storageMock.setItem.mockClear();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<SignUpStep3 />);
      
      expect(screen.getByLabelText(/emergency contact person/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/emergency contact email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/emergency contact number/i)).toBeInTheDocument();
    });

    it('should render progress indicator showing step 3 of 4', () => {
      render(<SignUpStep3 />);
      
      expect(screen.getByText(/step 3 of 4/i)).toBeInTheDocument();
    });

    it('should render back and next buttons', () => {
      render(<SignUpStep3 />);
      
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('should show helper text for all fields', () => {
      render(<SignUpStep3 />);
      
      expect(screen.getByText(/enter the name of the primary contact person/i)).toBeInTheDocument();
      expect(screen.getByText(/enter the email of the primary contact person/i)).toBeInTheDocument();
      expect(screen.getByText(/provide an emergency contact number/i)).toBeInTheDocument();
    });

    it('should render page title', () => {
      render(<SignUpStep3 />);
      
      expect(screen.getByText('Emergency Contact Details')).toBeInTheDocument();
    });
  });

  describe('Access Control', () => {
    it('should redirect to step 1 if step 1 not completed', () => {
      storageMock.clear();
      storageMock.setItem('signupStep2', JSON.stringify({ companyName: 'Test' }));
      
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SignUpStep3 />);
      
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
      
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SignUpStep3 />);
      
      expect(consoleError).toHaveBeenCalled();
      const errorCalls = consoleError.mock.calls.find(call => 
        call.some(arg => arg?.message?.includes('Not implemented: navigation'))
      );
      expect(errorCalls).toBeDefined();
      
      consoleError.mockRestore();
    });

    it('should allow access if steps 1 and 2 are completed', () => {
      render(<SignUpStep3 />);
      
      expect(screen.getByText('Emergency Contact Details')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require emergency contact person', () => {
      render(<SignUpStep3 />);
      
      const label = screen.getByText(/emergency contact person/i);
      expect(label.querySelector('span.text-red-600')).toBeInTheDocument();
    });

    it('should require emergency contact email', () => {
      render(<SignUpStep3 />);
      
      const label = screen.getByText(/emergency contact email/i);
      expect(label.querySelector('span.text-red-600')).toBeInTheDocument();
    });

    it('should require emergency contact number', () => {
      render(<SignUpStep3 />);
      
      // Get the label element specifically (not the helper text paragraph)
      const labels = screen.getAllByText(/emergency contact number/i);
      const labelElement = labels.find(el => el.tagName === 'LABEL');
      expect(labelElement).toBeDefined();
      expect(labelElement?.querySelector('span.text-red-600')).toBeInTheDocument();
    });

    it('should disable next button when required fields are empty', () => {
      render(<SignUpStep3 />);
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('should enable next button when all required fields are filled', () => {
      render(<SignUpStep3 />);
      
      const personInput = screen.getByLabelText(/emergency contact person/i);
      const emailInput = screen.getByLabelText(/emergency contact email/i);
      const phoneInput = screen.getByLabelText(/emergency contact number/i);
      
      fireEvent.change(personInput, { target: { value: 'Jane Doe' } });
      fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '+1234567890' } });
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('Field Types', () => {
    it('should have text input for contact person', () => {
      render(<SignUpStep3 />);
      
      const input = screen.getByLabelText(/emergency contact person/i);
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should have email input for contact email', () => {
      render(<SignUpStep3 />);
      
      const input = screen.getByLabelText(/emergency contact email/i);
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should have tel input for contact number', () => {
      render(<SignUpStep3 />);
      
      const input = screen.getByLabelText(/emergency contact number/i);
      expect(input).toHaveAttribute('type', 'tel');
    });
  });

  describe('Form Input', () => {
    it('should update emergency contact person when typing', () => {
      render(<SignUpStep3 />);
      
      const input = screen.getByLabelText(/emergency contact person/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Jane Smith' } });
      
      expect(input.value).toBe('Jane Smith');
    });

    it('should update emergency contact email when typing', () => {
      render(<SignUpStep3 />);
      
      const input = screen.getByLabelText(/emergency contact email/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'jane@farm.com' } });
      
      expect(input.value).toBe('jane@farm.com');
    });

    it('should update emergency contact number when typing', () => {
      render(<SignUpStep3 />);
      
      const input = screen.getByLabelText(/emergency contact number/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: '+1987654321' } });
      
      expect(input.value).toBe('+1987654321');
    });
  });

  describe('Navigation', () => {
    it('should navigate back to step 2 when back button clicked', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SignUpStep3 />);
      
      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);
      
      expect(consoleError).toHaveBeenCalled();
      const navError = consoleError.mock.calls.find(call => 
        call.some(arg => arg?.message?.includes('Not implemented: navigation'))
      );
      expect(navError).toBeDefined();
      
      consoleError.mockRestore();
    });

    it('should save data and navigate to step 4 when next button clicked', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SignUpStep3 />);
      
      const personInput = screen.getByLabelText(/emergency contact person/i);
      const emailInput = screen.getByLabelText(/emergency contact email/i);
      const phoneInput = screen.getByLabelText(/emergency contact number/i);
      
      fireEvent.change(personInput, { target: { value: 'Jane Doe' } });
      fireEvent.change(emailInput, { target: { value: 'jane@emergency.com' } });
      fireEvent.change(phoneInput, { target: { value: '+1234567890' } });
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      
      // Check localStorage.setItem was called
      expect(storageMock.setItem).toHaveBeenCalledWith(
        'signupStep3',
        expect.stringContaining('Jane Doe')
      );
      
      // Parse the actual stored data
      const setItemCall = storageMock.setItem.mock.calls.find(call => call[0] === 'signupStep3');
      expect(setItemCall).toBeDefined();
      const savedData = JSON.parse(setItemCall![1]);
      expect(savedData.emergencyContactPerson).toBe('Jane Doe');
      expect(savedData.emergencyContactEmail).toBe('jane@emergency.com');
      expect(savedData.emergencyContactNumber).toBe('+1234567890');
      
      // Check navigation was attempted
      expect(consoleError).toHaveBeenCalled();
      
      consoleError.mockRestore();
    });
  });

  describe('Data Persistence', () => {
    it('should save all emergency contact data to localStorage', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SignUpStep3 />);
      
      const personInput = screen.getByLabelText(/emergency contact person/i);
      const emailInput = screen.getByLabelText(/emergency contact email/i);
      const phoneInput = screen.getByLabelText(/emergency contact number/i);
      
      fireEvent.change(personInput, { target: { value: 'Emergency Contact Name' } });
      fireEvent.change(emailInput, { target: { value: 'emergency@contact.com' } });
      fireEvent.change(phoneInput, { target: { value: '+1555000999' } });
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      
      expect(storageMock.setItem).toHaveBeenCalledWith(
        'signupStep3',
        expect.any(String)
      );
      
      const setItemCall = storageMock.setItem.mock.calls.find((call: [string, string]) => call[0] === 'signupStep3');
      expect(setItemCall).toBeDefined();
      const savedData = JSON.parse(setItemCall![1]);
      
      expect(savedData.emergencyContactPerson).toBe('Emergency Contact Name');
      expect(savedData.emergencyContactEmail).toBe('emergency@contact.com');
      expect(savedData.emergencyContactNumber).toBe('+1555000999');
      
      consoleError.mockRestore();
    });
  });

  describe('Security and Data Integrity', () => {
    it('should prevent progression without all required fields', () => {
      render(<SignUpStep3 />);
      
      const personInput = screen.getByLabelText(/emergency contact person/i);
      const emailInput = screen.getByLabelText(/emergency contact email/i);
      
      // Fill only 2 out of 3 required fields
      fireEvent.change(personInput, { target: { value: 'John Smith' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('should validate email field has correct type attribute', () => {
      render(<SignUpStep3 />);
      
      const emailInput = screen.getByLabelText(/emergency contact email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should validate phone field has correct type attribute', () => {
      render(<SignUpStep3 />);
      
      const phoneInput = screen.getByLabelText(/emergency contact number/i);
      expect(phoneInput).toHaveAttribute('type', 'tel');
    });

    it('should properly store form data structure', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      render(<SignUpStep3 />);
      
      const personInput = screen.getByLabelText(/emergency contact person/i);
      const emailInput = screen.getByLabelText(/emergency contact email/i);
      const phoneInput = screen.getByLabelText(/emergency contact number/i);
      
      fireEvent.change(personInput, { target: { value: 'Test Person' } });
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(phoneInput, { target: { value: '+1234567890' } });
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      
      const setItemCall = storageMock.setItem.mock.calls.find((call: [string, string]) => call[0] === 'signupStep3');
      expect(setItemCall).toBeDefined();
      const savedData = JSON.parse(setItemCall![1]);
      
      // Verify data structure has exactly the expected fields
      expect(Object.keys(savedData)).toEqual([
        'emergencyContactPerson',
        'emergencyContactEmail',
        'emergencyContactNumber'
      ]);
      
      consoleError.mockRestore();
    });
  });

  describe('UI Elements', () => {
    it('should display phone icons in fields', () => {
      render(<SignUpStep3 />);
      
      // SVG icons are rendered with aria-hidden, not as img role
      // Check that icons exist via class names
      const container = screen.getByLabelText(/emergency contact person/i).parentElement;
      expect(container?.querySelector('svg.lucide-phone')).toBeInTheDocument();
    });

    it('should have proper placeholder text', () => {
      render(<SignUpStep3 />);
      
      expect(screen.getByPlaceholderText('Emergency Contact Person')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Emergency Contact Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Emergency Contact Number')).toBeInTheDocument();
    });
  });
});
