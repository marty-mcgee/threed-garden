'use client'
// 'use server'

// ** REACT Imports
// import { Suspense } from 'react'

// ** NEXT Imports
// import dynamic from 'next/dynamic'

// ** COMPONENT Imports
import MainNav from '#/layout/ui/main-nav'
// import UserButtonNextAuth from '#/layout/ui/user-button'
// const UserButtonNextAuth = dynamic(() => import('#/layout/ui/user-button'), { ssr: false })
// const UserButtonNextAuth = dynamic(() => import('#/layout/ui/user-button'), { })
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { LayoutDashboard } from 'lucide-react'

// ** RADIX-UI Imports
import {
  // Grid,
  // Flex,
  // Container,
  Button,
} from '@radix-ui/themes'

// ** RETURN JSX
export default function Header() {
// export default async function Header() {
  return (
    <div
      id='ThreeDAppHeader'
      style={{
        display: 'flex',
        height: '36px',
      }}
    >
      {/* MAIN NAV */}
      <div
        style={{
          flexGrow: 1,
        }}
      >
        <MainNav />
      </div>
      {/* USER AUTH */}
      <div
        style={{
          flexGrow: 0,
          // marginTop: 8,
          // marginRight: 8,
        }}
      >
        {/* NEXT-AUTH */}
        {/* <UserButtonNextAuth /> */}

        {/* CLERK-JS AUTH */}
        <SignedOut>
          <SignInButton mode='modal'>
            <Button 
              className='
                rounded 
                border 
                border-black 
                bg-black 
                px-2 
                py-0.5
                m-1
                text-xs 
                text-white 
                transition-colors 
                hover:bg-black 
                hover:text-gray
              '
            >
              Sign In
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <div className='m-1'>
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Link
                  label='Dashboard'
                  labelIcon={<LayoutDashboard className='h-6 w-6' />}
                  href='/'
                />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        </SignedIn>       

      </div>
    </div>
  )
}
