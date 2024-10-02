// 'use client'
// 'use server'
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
        // gap='3'
        // justify='end'
        // align='center'
      >
        <Flex
          // columns='1'
          justify='start'
          align='center'
        >
          {/* <Logo /> */}
          <MainNav />
        </Flex>
        <Grid
          columns='1'
          // justify='end'
          align='center'
        >
          <Flex
            justify='end'
          >
            <UserButton />
          </Flex>
        </Grid>
      </Grid>
    </>
  )
}
