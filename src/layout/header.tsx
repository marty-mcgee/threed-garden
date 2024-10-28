// 'use client'
// 'use server'
// ^^ does this file require client or server pragma ???

// ** COMPONENT Imports
import MainNav from '#/layout/ui/main-nav'
// import UserButton from '#/layout/ui/user-button'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { LayoutDashboard } from 'lucide-react'

// ** UI Imports
import {
  Grid,
  Flex,
  Container,
} from '@radix-ui/themes'

// ** RETURN JSX
export default function Header() {
  return (
    <>
      <Flex
        id='ThreeDAppHeader'
        className='flex'
        display='inline-flex'
        // direction='row'
        // width='100%'
        // style={{
        //   display: 'inline-flex',
        //   flexDirection: 'row',
        // }}
      >
        <Flex
          // className='flex'
          // justify='start'
          // flexGrow='1'
          style={{
            flexGrow: 1,
          }}
        >
          {/* HEY HEY HEY */}
          <MainNav />
        </Flex>
        <Flex
          // className='flex'
          // justify='end'
          // flexGrow='0'
          style={{
            flexGrow: 0,
          }}
        >
          {/* YO YO YO */}
          {/* @ ts-expect-error Async Server Component */}
          {/* <UserButton /> */}
          <SignedOut>
            <SignInButton mode='modal'>
              <button 
                className='
                  rounded 
                  border 
                  border-black 
                  bg-black 
                  px-3 
                  py-1.5 
                  text-sm 
                  text-white 
                  transition-colors 
                  hover:bg-white 
                  hover:text-black
                '
              >
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Link
                  label='Dashboard'
                  labelIcon={<LayoutDashboard className='h-4 w-4' />}
                  href='/'
                />
              </UserButton.MenuItems>
            </UserButton>
          </SignedIn>
        </Flex>
      </Flex>
    </>
  )
}
