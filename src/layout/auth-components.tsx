import { signIn, signOut } from '~/src/lib/auth/auth'
// import { Button } from './ui/button'
import {
  Button,
} from '@radix-ui/themes'

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
        style={{
          borderWidth: 0,
          fontSize: '12px',
        }}
        className='mt-1 mr-2 bg-background text-foreground'
        {...props}
      >
        login
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
        style={{
          borderWidth: 0,
          fontSize: '12px',
        }}
        className='mt-1 mr-2 bg-background text-foreground'
        {...props}
      >
        logout
      </Button>
    </form>
  )
}
