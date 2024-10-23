// 'use client'
'use server'
// ^^ does this file require client or server pragma ???

// ** COMPONENT Imports
import Logo from '#/layout/ui/logo'
import MainNav from '#/layout/ui/main-nav'
import UserButton from '#/layout/ui/user-button'

// ** UI Imports
import {
  Grid,
  Flex,
} from '@radix-ui/themes'

// ** EXPORT Header
export default async function Header() {
  return (
    <>
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
          <MainNav />
        
        </Flex>
        <Flex
          justify='end'
          align='center'
        >

          {/* @ ts-expect-error Async Server Component */}
          <UserButton />
        
        </Flex>
      </Grid>
    </>
  )
}
