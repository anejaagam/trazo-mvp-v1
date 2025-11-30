"use client";

import type { ReactNode } from 'react';
import { toast as sonnerToast } from 'sonner';

type ToastVariant = 'default' | 'destructive' | 'success';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

export function useToast() {
  const toast = ({ title, description, variant = 'default' }: ToastOptions) => {
    const hasContent = Boolean(title || description);
    const body: ReactNode = hasContent ? (
      <div className="space-y-1">
        {title && <p className="font-medium">{title}</p>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    ) : 'Notification';

    if (variant === 'destructive') {
      sonnerToast.error(body);
    } else if (variant === 'success') {
      sonnerToast.success(body);
    } else {
      sonnerToast(body);
    }
  };

  return { toast };
}
