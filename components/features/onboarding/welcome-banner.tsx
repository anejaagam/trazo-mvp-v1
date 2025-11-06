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
    <Alert className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/30 shadow-sm">
      <Info className="h-5 w-5 text-primary" />
      <AlertTitle className="text-lg font-semibold">
        {isAdmin ? 'Welcome to Trazo 👋' : '🎉 You\'re all set!'}
      </AlertTitle>
      <AlertDescription>
        {isAdmin ? (
          <div className="space-y-3 mt-2">
            <p className="text-sm leading-relaxed">
              You're the organization admin. Start by inviting your team from Admin → Users. Your jurisdiction is
              {jurisdiction ? ` ${jurisdiction.name}` : ' set during onboarding'}, which tailors compliance and workflows.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tips: Configure sites, set inventory thresholds, and connect sensors when ready.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            <p className="text-sm leading-relaxed text-foreground/90">
              You've been invited to this organization. Based on your role <span className="font-semibold text-primary">({role ?? 'member'})</span>, you can access:
            </p>
            <div className="bg-background/50 rounded-lg p-4 border border-border/50">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {permissions.map((p) => (
                  <div 
                    key={p}
                    className="flex items-center gap-2 text-xs font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-md border border-primary/20"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="capitalize">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <button
          className="mt-4 text-xs font-medium underline-offset-4 hover:underline text-primary/70 hover:text-primary transition-colors"
          onClick={() => { localStorage.setItem('trazo-onboarded', '1'); setDismissed(true) }}
        >
          Dismiss this message
        </button>
      </AlertDescription>
    </Alert>
  )
}
