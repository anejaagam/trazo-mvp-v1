"use client"

import { useEffect, useMemo, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import type { RoleKey } from '@/lib/rbac/types'
import { ROLES } from '@/lib/rbac/roles'
import { useJurisdiction } from '@/hooks/use-jurisdiction'

type Props = {
  role: string | null
  jurisdictionId?: string
}

export function WelcomeBanner({ role, jurisdictionId }: Props) {
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    const seen = localStorage.getItem('trazo-onboarded')
    setDismissed(seen === '1')
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { jurisdiction } = useJurisdiction(jurisdictionId as any)

  const isAdmin = role === 'org_admin'
  const permissions = useMemo(() => {
    const r = (role || 'operator') as RoleKey
    const def = ROLES[r]
    if (!def) return []
    if (def.permissions.includes('*')) return ['Full access to all features']
    // Show a condensed, human-friendly list
    const cats = new Set(def.permissions.map(p => p.split(':')[0]))
    return Array.from(cats)
  }, [role])

  if (dismissed) return null

  return (
    <Alert className="bg-primary/5 border-primary/20">
      <Info className="h-4 w-4" />
      <AlertTitle>
        {isAdmin ? 'Welcome to Trazo 👋' : 'You’re all set'}
      </AlertTitle>
      <AlertDescription>
        {isAdmin ? (
          <div className="space-y-2">
            <p className="text-sm">
              You’re the organization admin. Start by inviting your team from Admin → Users. Your jurisdiction is
              {jurisdiction ? ` ${jurisdiction.name}` : ' set during onboarding'}, which tailors compliance and workflows.
            </p>
            <p className="text-xs text-muted-foreground">
              Tips: Configure sites, set inventory thresholds, and connect sensors when ready.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm">
              You’ve been invited to this organization. Based on your role ({role ?? 'member'}), you can access:
            </p>
            <ul className="text-xs list-disc pl-5">
              {permissions.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        )}
        <button
          className="mt-3 text-xs underline text-primary"
          onClick={() => { localStorage.setItem('trazo-onboarded', '1'); setDismissed(true) }}
        >
          Dismiss
        </button>
    </AlertDescription>
    </Alert>
  )
}
