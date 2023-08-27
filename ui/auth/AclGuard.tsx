// ==============================================================
// RESOURCES

'use client'

// ** React
import { useState } from 'react'

// ** Next
import { useRouter, usePathname } from 'next/navigation'

// ** Contexts
import { AbilityContext } from '#/lib/auth/acl/Can'

// ** Configs
import { buildAbilityFor } from '#/lib/config/acl'

// ** Components
import NotAuthorized from '#/pages/401'
import BlankLayout from '#/ui/layouts/BlankLayout'

// ** Hooks
import { useAuth } from '#/lib/auth/hooks/useAuth'

// ==============================================================
// IMPORTS COMPLETE
console.debug('🔑 AclGuard: loading...')

// ** Function Component <React.FC> (returns JSX) for JS Module Export
const AclGuard = (props: any) => {
  // ** Props
  const { aclAbilities, children, guestGuard } = props
  const [ability, setAbility] = useState(undefined)

  // ** Hooks
  const auth = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // If guestGuard is true and user is not logged in or its an error page, render the page without checking access
  // if (guestGuard || router.route === '/404' || router.route === '/500' || router.route === '/') {
  if (guestGuard || pathname === '/404' || pathname === '/500' || pathname === '/') {
    console.debug('🔑 AclGuard: loaded')
    return <>{children}</>
  }

  // User is logged in, build ability for the user based on his role
  if (auth.user && auth.user.role && !ability) {
    setAbility(buildAbilityFor(auth.user.role, aclAbilities.subject))
  }

  // Check the access of current user and render pages
  if (ability && ability.can(aclAbilities.action, aclAbilities.subject)) {
    return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>
  }

  // Render Not Authorized component if the current user has limited access
  return (
    <BlankLayout>
      <NotAuthorized />
    </BlankLayout>
  )
}

export default AclGuard
