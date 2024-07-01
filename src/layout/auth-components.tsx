import { signIn, signOut } from '~/src/lib/auth/auth'
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
      <Button
        // style={{borderWidth: 0}}
        className='mt-3 mr-2 bg-background text-foreground'
        {...props}
      >
        Sign In
      </Button>
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
      // className='w-full'
    >
      <Button 
        // style={{borderWidth: 0}}
        className='mt-3 mr-2 bg-background text-foreground'
        {...props}
      >
        Sign Out
      </Button>
    </form>
  )
}
