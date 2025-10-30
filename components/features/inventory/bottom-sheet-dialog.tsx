'use client'

/**
 * Bottom Sheet Dialog Component
 * 
 * A custom dialog that slides up from the bottom middle of the screen
 * Wrapper around the base Dialog component with custom positioning and animation
 */

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const BottomSheetDialog = DialogPrimitive.Root

const BottomSheetDialogTrigger = DialogPrimitive.Trigger

const BottomSheetDialogPortal = DialogPrimitive.Portal

const BottomSheetDialogClose = DialogPrimitive.Close

const BottomSheetDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
BottomSheetDialogOverlay.displayName = DialogPrimitive.Overlay.displayName

type BottomSheetDialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  disableOutsideClose?: boolean
  disableEscapeClose?: boolean
}

const BottomSheetDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  BottomSheetDialogContentProps
>(({ className, children, disableOutsideClose, disableEscapeClose, onInteractOutside, onPointerDownOutside, onEscapeKeyDown, ...props }, ref) => (
  <BottomSheetDialogPortal>
    <BottomSheetDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed bottom-0 left-[50%] z-50',
        'translate-x-[-50%]',
        'w-full max-w-2xl',
        'max-h-[90vh] overflow-y-auto',
        'rounded-t-2xl border bg-background p-6 shadow-lg',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:slide-out-to-bottom-[100%] data-[state=open]:slide-in-from-bottom-[100%]',
        'duration-300',
        className
      )}
      onInteractOutside={(e) => {
        if (disableOutsideClose) e.preventDefault()
        onInteractOutside?.(e)
      }}
      onPointerDownOutside={(e) => {
        if (disableOutsideClose) e.preventDefault()
        onPointerDownOutside?.(e)
      }}
      onEscapeKeyDown={(e) => {
        if (disableEscapeClose) e.preventDefault()
        onEscapeKeyDown?.(e)
      }}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
        <XIcon className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </BottomSheetDialogPortal>
))
BottomSheetDialogContent.displayName = DialogPrimitive.Content.displayName

const BottomSheetDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col gap-2 text-center sm:text-left',
      className
    )}
    {...props}
  />
)
BottomSheetDialogHeader.displayName = 'BottomSheetDialogHeader'

const BottomSheetDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
      className
    )}
    {...props}
  />
)
BottomSheetDialogFooter.displayName = 'BottomSheetDialogFooter'

const BottomSheetDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none', className)}
    {...props}
  />
))
BottomSheetDialogTitle.displayName = DialogPrimitive.Title.displayName

const BottomSheetDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
BottomSheetDialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  BottomSheetDialog,
  BottomSheetDialogPortal,
  BottomSheetDialogOverlay,
  BottomSheetDialogClose,
  BottomSheetDialogTrigger,
  BottomSheetDialogContent,
  BottomSheetDialogHeader,
  BottomSheetDialogFooter,
  BottomSheetDialogTitle,
  BottomSheetDialogDescription,
}
