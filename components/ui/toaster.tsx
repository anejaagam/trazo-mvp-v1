'use client'

import * as React from 'react'

export interface ToasterProps {
  className?: string
}

// Simple placeholder toaster component
// TODO: Replace with proper toast library like sonner
const Toaster = ({ className }: ToasterProps) => {
  return (
    <div className={className}>
      {/* Toast notifications will appear here */}
    </div>
  )
}

export { Toaster }