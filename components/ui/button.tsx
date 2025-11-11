import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-semibold text-body-base leading-[12.8px] transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative",
  {
    variants: {
      variant: {
        // Primary (Default) - matches Figma "Default" with green background and white text
        default:
          "bg-brand-lighter-green-500 text-white hover:bg-brand-lighter-green-600 focus-visible:ring-2 focus-visible:ring-information-600 focus-visible:ring-offset-2 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed",
        
        // Secondary/Outline - matches Figma "Variant8" with blue text and no background
        outline:
          "border-0 bg-transparent text-information-600 hover:text-information-800 focus-visible:ring-2 focus-visible:ring-information-600 focus-visible:ring-offset-2 disabled:text-neutral-400 disabled:cursor-not-allowed",
        
        // Info variant - matches Figma "Variant5" with blue background
        info:
          "bg-information-600 text-white hover:bg-information-800 focus-visible:ring-2 focus-visible:ring-information-600 focus-visible:ring-offset-2 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed",
        
        // Ghost variant
        ghost: 
          "bg-transparent text-primary hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        
        // Link variant
        link: 
          "text-primary underline-offset-4 hover:underline p-0 h-auto font-medium bg-transparent",

        // Destructive variant
        destructive:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed",
      },
      size: {
        sm: "h-8 px-3 py-1.5 text-sm rounded-lg",
        default: "h-10 px-4 py-2 rounded-3xl", // 24px border radius from Figma
        lg: "h-12 px-6 py-3 text-lg rounded-3xl",
        xl: "h-14 px-8 py-4 text-lg rounded-3xl",
        icon: "h-10 w-10 rounded-3xl",
        "icon-sm": "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, leftIcon, rightIcon, ...props }, ref) => {
    const buttonClassName = cn(buttonVariants({ variant, size, className }));
    
    if (asChild) {
      return (
        <Slot
          className={buttonClassName}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={buttonClassName}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {leftIcon && !loading && (
          <span className="flex items-center justify-center">{leftIcon}</span>
        )}
        {children}
        {rightIcon && (
          <span className="flex items-center justify-center">{rightIcon}</span>
        )}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
