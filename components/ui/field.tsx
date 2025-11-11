"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const fieldVariants = cva(
  "flex w-full items-center gap-3 border-2 bg-background px-3 py-2 font-display font-semibold text-body-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-within:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-neutral-200 focus-within:border-information-600 hover:border-neutral-300",
        error: "border-red-500 focus-within:border-red-600",
      },
      size: {
        sm: "h-8 px-2 text-sm rounded-md",
        default: "h-12 px-3 rounded-sm", // 2px border radius from Figma
        lg: "h-14 px-4 text-lg rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface FieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof fieldVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
}

const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ className, variant, size, leftIcon, rightIcon, error, ...props }, ref) => {
    const fieldVariant = error ? "error" : variant;
    
    return (
      <div className={cn(fieldVariants({ variant: fieldVariant, size, className }))}>
        {leftIcon && (
          <div className="flex items-center justify-center shrink-0 size-5 text-neutral-600">
            {leftIcon}
          </div>
        )}
        <input
          className="flex-1 bg-transparent border-0 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed"
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="flex items-center justify-center shrink-0 size-5 text-neutral-600">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Field.displayName = "Field";

export { Field, fieldVariants };