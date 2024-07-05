// 'use client'
'use server'
// ^^ does this file require client or server pragma ???

// ** COMPONENT Imports
import MainNav from './main-nav'
import UserButton from './user-button'

// ** UI Imports
import {
  Grid,
  Flex,
} from '@radix-ui/themes'

// ** EXPORT Header
export default async function Header() {
  return (
    <Flex
      id={'ThreeDAppHeader'}
      justify={'between'}
    >
      <MainNav />
      <UserButton />
    </Flex>
  )
}
