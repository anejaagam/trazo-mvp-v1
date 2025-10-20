import { isDevModeActive, DEV_MODE_BANNER } from '@/lib/dev-mode'

/**
 * Dev Mode Banner Component
 * 
 * Displays a prominent banner when dev mode is active.
 * Automatically hidden in production.
 */
export function DevModeBanner() {
  if (!isDevModeActive()) {
    return null
  }

  return (
    <div className={DEV_MODE_BANNER.className}>
      {DEV_MODE_BANNER.text}
    </div>
  )
}
