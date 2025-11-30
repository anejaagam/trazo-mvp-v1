import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { SEVERITY_COLORS, SEVERITY_LABELS, type ErrorSeverity } from '@/lib/errors/types'

interface SeverityBadgeProps {
  severity: ErrorSeverity
  className?: string
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const colors = SEVERITY_COLORS[severity]
  const label = SEVERITY_LABELS[severity]

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {label}
    </Badge>
  )
}
