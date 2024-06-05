

import { signIn, signOut } from '#/app/auth'
import { Button } from './ui/button'

export function SignIn({
  provider,
  ...props
}: { provider?: string } & React.ComponentPropsWithRef<typeof Button>) {
  // console.debug('SignIn Button Clicked')
  return (
    <form
      action={async () => {
        'use server'
        console.debug('SignIn Button Clicked')
        await signIn(provider)
      }}
    >
      <Button {...props}>Sign In</Button>
    </form>
  )
}

export function SignOut(props: React.ComponentPropsWithRef<typeof Button>) {
  // console.debug('SignOut Button Clicked')
  return (
    <form
      action={async () => {
        'use server'
        console.debug('SignOut Button Clicked')
        await signOut()
      }}
      className='w-full'
    >
      <Button className='w-full p-0' {...props}>
        Sign Out
      </Button>
    </form>
  )
}
