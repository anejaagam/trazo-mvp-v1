import { render, screen, fireEvent } from '@testing-library/react';
import { EquipmentControlCard } from '../equipment-control-card';
import { EquipmentType, EquipmentState, ControlMode } from '@/types/equipment';
import type { EquipmentControl } from '@/types/equipment';

// Mock usePermissions hook
jest.mock('@/hooks/use-permissions', () => ({
  usePermissions: () => ({
    can: jest.fn(() => {
      // Grant all permissions for testing
      return true;
    }),
  }),
}));

describe('EquipmentControlCard', () => {
  const mockOnStateChange = jest.fn();
  const mockOnAutoConfigChange = jest.fn();

  const baseControl: EquipmentControl = {
    type: EquipmentType.COOLING,
    state: EquipmentState.OFF,
    mode: ControlMode.MANUAL,
    override: false,
    schedule_enabled: false,
    level: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render equipment name and icon', () => {
      render(
        <EquipmentControlCard
          control={baseControl}
          onStateChange={mockOnStateChange}
          onAutoConfigChange={mockOnAutoConfigChange}
        />
      );

      expect(screen.getByText('Cooling')).toBeInTheDocument();
    });

    it('should render in compact mode', () => {
      const { container } = render(
        <EquipmentControlCard
          control={baseControl}
          onStateChange={mockOnStateChange}
          onAutoConfigChange={mockOnAutoConfigChange}
          compact
        />
      );

      // Compact mode should have simpler layout
      expect(container.querySelector('.space-y-3')).not.toBeInTheDocument();
    });

    it('should show current power level', () => {
      const control = { ...baseControl, level: 75, state: EquipmentState.ON };
      
      render(
        <EquipmentControlCard
          control={control}
          onStateChange={mockOnStateChange}
          onAutoConfigChange={mockOnAutoConfigChange}
        />
      );

      expect(screen.getByText(/75%/)).toBeInTheDocument();
    });
  });

  describe('3-State Control', () => {
    it('should render OFF, ON, AUTO buttons', () => {
      render(
        <EquipmentControlCard
          control={baseControl}
          onStateChange={mockOnStateChange}
          onAutoConfigChange={mockOnAutoConfigChange}
        />
      );

      expect(screen.getByText('OFF')).toBeInTheDocument();
      expect(screen.getByText('ON')).toBeInTheDocument();
      expect(screen.getByText('AUTO')).toBeInTheDocument();
    });

    it('should highlight active state button', () => {
      const control = { ...baseControl, state: EquipmentState.ON };
      
      const { rerender } = render(
        <EquipmentControlCard
          control={control}
          onStateChange={mockOnStateChange}
          onAutoConfigChange={mockOnAutoConfigChange}
        />
      );

      const onButton = screen.getByText('ON').closest('button');
      expect(onButton).toHaveClass('bg-primary');

      // Switch to AUTO
      const autoControl = { ...baseControl, state: EquipmentState.AUTO, mode: ControlMode.AUTOMATIC };
      rerender(
        <EquipmentControlCard
          control={autoControl}
          onStateChange={mockOnStateChange}
          onAutoConfigChange={mockOnAutoConfigChange}
        />
      );

      const autoButton = screen.getByText('AUTO').closest('button');
      expect(autoButton).toHaveClass('bg-blue-600');
    });

    it('should call onStateChange when clicking state buttons', () => {
      render(
        <EquipmentControlCard
          control={baseControl}
          onStateChange={mockOnStateChange}
          onAutoConfigChange={mockOnAutoConfigChange}
        />
      );

      const onButton = screen.getByText('ON').closest('button');
      if (onButton) {
        fireEvent.click(onButton);
        expect(mockOnStateChange).toHaveBeenCalledWith(EquipmentState.ON);
      }
    });
  });

  describe('Power Level Slider', () => {
    it('should show slider in MANUAL ON mode', () => {
      const control = { ...baseControl, state: EquipmentState.ON, level: 50 };
      
      render(
        <EquipmentControlCard
          control={control}
          onStateChange={mockOnStateChange}
          onAutoConfigChange={mockOnAutoConfigChange}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute('aria-valuenow', '50');
    });

    it('should not show slider when OFF', () => {
      render(
        <EquipmentControlCard
          control={baseControl}
          onStateChange={mockOnStateChange}
          onAutoConfigChange={mockOnAutoConfigChange}
        />
      );

      expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    });

    it('should not show slider in AUTO mode', () => {
      const control = { ...baseControl, state: EquipmentState.AUTO, mode: ControlMode.AUTOMATIC };
      
      render(
        <EquipmentControlCard
          control={control}
          onStateChange={mockOnStateChange}
          onAutoConfigChange={mockOnAutoConfigChange}
        />
      );

      expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    });
  });

  describe('AUTO Mode Display', () => {
    it('should show AUTO configuration when in AUTO mode', () => {
      const control: EquipmentControl = {
        ...baseControl,
        state: EquipmentState.AUTO,
        mode: ControlMode.AUTOMATIC,
        auto_config: {
          thresholds: {
            temperature: { min: 18, max: 24 },
          },
        },
      };

      render(
        <EquipmentControlCard
          control={control}
          onStateChange={mockOnStateChange}
          onAutoConfigChange={mockOnAutoConfigChange}
        />
      );

      expect(screen.getByText(/temperature/i)).toBeInTheDocument();
      expect(screen.getByText(/18.*24/)).toBeInTheDocument();
    });

    it('should show configure button in AUTO mode', () => {
      const control = { ...baseControl, state: EquipmentState.AUTO, mode: ControlMode.AUTOMATIC };
      
      render(
        <EquipmentControlCard
          control={control}
          onStateChange={mockOnStateChange}
          onAutoConfigChange={mockOnAutoConfigChange}
        />
      );

      expect(screen.getByText(/configure/i)).toBeInTheDocument();
    });
  });

  describe('Override Toggle', () => {
    it('should show override toggle when equipment has override', () => {
      const control = { ...baseControl, override: true, state: EquipmentState.ON };
      
      render(
        <EquipmentControlCard
          control={control}
          onStateChange={mockOnStateChange}
          onAutoConfigChange={mockOnAutoConfigChange}
        />
      );

      expect(screen.getByText(/override/i)).toBeInTheDocument();
    });

    it('should show warning when override is active', () => {
      const control = { ...baseControl, override: true, state: EquipmentState.ON };
      
      render(
        <EquipmentControlCard
          control={control}
          onStateChange={mockOnStateChange}
          onAutoConfigChange={mockOnAutoConfigChange}
        />
      );

      // Look for warning indicator
      expect(screen.getByText(/override active/i)).toBeInTheDocument();
    });
  });

  describe('Permission-Based Rendering', () => {
    it('should disable controls when user lacks permissions', () => {
      // Re-mock usePermissions to deny permissions
      jest.resetModules();
      jest.mock('@/hooks/use-permissions', () => ({
        usePermissions: () => ({
          can: jest.fn(() => false),
        }),
      }));

      const { container } = render(
        <EquipmentControlCard
          control={baseControl}
          onStateChange={mockOnStateChange}
          onAutoConfigChange={mockOnAutoConfigChange}
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Equipment Type Variations', () => {
    it('should render different icon for lighting equipment', () => {
      const control = { ...baseControl, type: EquipmentType.LIGHTING };
      
      render(
        <EquipmentControlCard
          control={control}
          onStateChange={mockOnStateChange}
          onAutoConfigChange={mockOnAutoConfigChange}
        />
      );

      expect(screen.getByText('Lighting')).toBeInTheDocument();
    });

    it('should render different icon for CO2 equipment', () => {
      const control = { ...baseControl, type: EquipmentType.CO2_INJECTION };
      
      render(
        <EquipmentControlCard
          control={control}
          onStateChange={mockOnStateChange}
          onAutoConfigChange={mockOnAutoConfigChange}
        />
      );

      expect(screen.getByText('CO₂ Injection')).toBeInTheDocument();
    });
  });
});
