'use client'
// 'use server'

// ** REACT Imports
import { Suspense } from 'react'

// ** NEXT Imports
// import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'

// ** COMPONENT Imports
import MainNav from '#/layout/ui/main-nav'
import MainNav2 from '#/layout/ui/main-nav-2'
import CustomLink from '#/layout/ui/custom-link'
// ** AUTH Imports
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
  <Suspense fallback={null}>
    <div
      id='ThreeDAppHeader'
      style={{
        display: 'flex',
        alignItems: 'center',
        // height: '36px',
      }}
    >
      {/* MAIN NAV */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          flexGrow: 1,
        }}
      >
        {/* <MainNav /> */}
        {/* OR */}
        {/* <MainNav2 /> within a dom node shell */}
        <div
          style={{
            display: 'flex',
            // alignItems: 'center',
            // flexGrow: 1,
            // marginLeft: 4,
            // marginTop: -8,
          }}
        >
          <div
            style={{
              display: 'flex',
              // flexGrow: 0,
              alignItems: 'center',
              margin: 2,
            }}
          >
            <CustomLink href='/#logo'
              style={{
                display: 'flex',
                color: '#DDDDDD',
                textDecoration: 'none',
                // marginTop: 4,
                // marginLeft: 4,
                // marginBottom: 4,
                marginRight: 4,
              }}
            >
              <Image 
                src='/favicon/favicon.png' 
                // priority={true} 
                alt='ThreeD App Home'
                width={24}
                height={24}
              />
            </CustomLink>
            <CustomLink href='/#home' 
              style={{
                display: 'flex',
                color: '#DDDDDD',
                textDecoration: 'none',
                // marginLeft: 4,
                // marginTop: -2,
                // marginBottom: 2,
              }}
            >
              ThreeD Garden
            </CustomLink>
          </div>
          
          <div
            style={{
              // display: 'inline-flex',
              // flexGrow: 0,
              // flexGrow: 1,
              // alignItems: 'center',
              // marginTop: 0,
            }}
          >
            {/* <MainNav2 /> within a dom node shell */}
            <MainNav2 />
          </div>

        </div>
      </div>
      {/* USER AUTH */}
      <div
        style={{
          display: 'inline-flex',
          // flexGrow: 0,
          // marginTop: 8,
          marginRight: 4,
        }}
      >
        {/* NEXT-AUTH */}
        {/* <UserButtonNextAuth /> */}

        {/* CLERK-JS AUTH */}
        <SignedOut>
          <SignInButton mode='modal'>
            <Button 
              className='Button'
              // className='
              //   rounded 
              //   border-0
              //   border-black 
              //   bg-transparent 
              //   px-2 
              //   py-0
              //   m-0
              //   text-white 
              //   transition-colors 
              //   hover:bg-black 
              //   hover:text-gray
              // '
            >
              Sign In
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Link
                  label='Dashboard'
                  labelIcon={<LayoutDashboard className='h-6 w-6' />}
                  href='/#dashboard'
                />
              </UserButton.MenuItems>
            </UserButton>
        </SignedIn>       

      </div>
    </div>
  </Suspense>
  )
}
