// 'use client'
'use server'
// ^^ this file requires server pragma

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'

// ** AUTH GUARD
import { auth } from '~/src/lib/auth/auth'
// import { SessionProvider } from 'next-auth/react'
// import { useSession } from 'next-auth/react'
import { SignIn, SignOut } from './auth-components'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

export default async function UserButton() {
  const session = await auth()
  // const { data: session, status } = useSession()
  if (!session?.user) {
    return <SignIn />
  }
  return (
    <div className="flex gap-2 items-center">
      {/* <span className="hidden text-sm sm:inline-flex">
        {session.user.email}
      </span> */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className='relative rounded-full'>
            <div className='mr-2'>{session.user.name}</div>
            <Avatar className='w-12 h-12'>
              {session.user.image && (
                <AvatarImage
                  src={session.user.image}
                  alt={session.user.name ?? ''}
                />
              )}
              <AvatarFallback>{session.user.email}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56' align='end' forceMount>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col space-y-1'>
              <p className='text-sm font-medium leading-none'>
                {session.user.name}
              </p>
              <p className='text-xs leading-none text-muted-foreground'>
                {session.user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuItem>
            <SignOut />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
