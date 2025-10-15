import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full font-body transition-all duration-200 file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-2 border-border bg-background text-foreground shadow-sm hover:border-primary/50 focus-visible:border-primary",
        filled:
          "border-2 border-transparent bg-muted text-foreground shadow-sm hover:bg-muted/80 focus-visible:bg-background focus-visible:border-primary",
        outline:
          "border-2 border-primary bg-transparent text-foreground shadow-sm hover:bg-primary/5 focus-visible:bg-primary/5",
        error:
          "border-2 border-destructive bg-background text-foreground shadow-sm focus-visible:border-destructive ring-destructive/20",
      },
      size: {
        sm: "h-8 px-3 py-1 text-body-sm rounded-md",
        default: "h-10 px-3 py-2 text-body-base rounded-lg",
        lg: "h-12 px-4 py-3 text-body-lg rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, size, label, helperText, error, ...props }, ref) => {
    const inputVariant = error ? "error" : variant;
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="space-y-1">
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-body-sm font-medium text-foreground"
          >
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(inputVariants({ variant: inputVariant, size }), className)}
          ref={ref}
          {...props}
        />
        {(helperText || error) && (
          <p className={cn(
            "text-body-xs",
            error ? "text-destructive" : "text-muted-foreground"
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
