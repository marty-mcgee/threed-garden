// 'use client'
// 'use server'
// ^^ does this file require client or server pragma ???

// ** COMPONENT Imports
import Logo from '#/layout/ui/logo'
// import MainNav from '#/layout/ui/main-nav'
// import UserButton from '#/layout/ui/user-button'
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"
import { LayoutDashboard } from "lucide-react"

// ** UI Imports
import {
  Grid,
  Flex,
} from '@radix-ui/themes'

// ** EXPORT Header
export default function Header() {
  return (
    <Grid
      id='ThreeDAppHeader'
      columns='2'
    >
      <Flex
        justify='start'
        align='center'
      >

        {/* <Logo /> */}
        {/* @ ts-expect-error Async Server Component */}
        {/* <MainNav /> */}
      
      </Flex>
      <Flex
        justify='end'
        align='center'
      >

        {/* @ ts-expect-error Async Server Component */}
        {/* <UserButton /> */}
        
        <SignedOut>
          <SignInButton mode="modal">
            <button className="rounded-full border border-black bg-black px-4 py-1.5 text-sm text-white transition-colors hover:bg-white hover:text-black">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Link
                label="Dashboard"
                labelIcon={<LayoutDashboard className="h-4 w-4" />}
                href="/"
              />
            </UserButton.MenuItems>
          </UserButton>
        </SignedIn>
      
      </Flex>
    </Grid>
  )
}
