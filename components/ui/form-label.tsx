"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "font-display font-semibold leading-[12.8px] text-body-base peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "text-black",
        required: "text-black",
        error: "text-red-600",
      },
      size: {
        sm: "text-sm",
        default: "text-body-base",
        lg: "text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  required?: boolean;
  icon?: React.ReactNode;
}

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, variant, size, required, icon, children, ...props }, ref) => {
  const labelVariant = required ? "required" : variant;
  
  return (
    <div className="flex items-center gap-2 relative">
      <LabelPrimitive.Root
        ref={ref}
        className={cn(labelVariants({ variant: labelVariant, size, className }))}
        {...props}
      >
        {children}
        {required && (
          <span className="text-red-600 ml-1">*</span>
        )}
      </LabelPrimitive.Root>
      {icon && (
        <div className="flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}
    </div>
  );
});

Label.displayName = LabelPrimitive.Root.displayName;

export { Label, labelVariants };