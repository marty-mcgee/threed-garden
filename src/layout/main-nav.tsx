// 'use client'
'use server'
// ^^ does this file require client or server pragma ???


import React from 'react'

// ** UI Imports
import {
  Box,
  Grid,
  Flex,
  Text,
  Button,
} from '@radix-ui/themes'

import Image from 'next/image'

import { cn } from '#//lib/utils/tailwind-utils'
import CustomLink from './custom-link'

export default async function MainNav() {
  return (
    <Flex
      // justify={'between'}
      // gap={'2'}
      align={'center'}
    >
      <CustomLink href='/'>
        <Button variant='ghost'>  
          <Image src='/favicon/favicon.png' priority={true} alt='Index: Home' width='32' height='32' />
        </Button>
      </CustomLink>
      <Text
        as={'label'}
        weight={'medium'}
        className='pl-2'
      >
        <CustomLink href='/participate' 
          style={{
            color: '#DDDDDD',
            textDecoration: 'none',
          }}
        >
          THREED GARDEN
        </CustomLink>
      </Text>
    </Flex>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'>
>(({ className, title, children, ...props }, ref) => {
  return (
    <li
      className='
        p-2
      '
    >
      {/* <NavigationMenuLink> */}
        <div 
          // className='
          //   p-2
          //   text-sm 
          //   font-medium 
          //   leading-none
          // '
        >
          <a
            ref={ref}
            // className={cn(
            //   className
            // )}
            {...props}
          >
            {title}
          </a>
        </div>
        <div
          // className='
          //   p-2
          //   text-sm 
          //   leading-snug 
          //   line-clamp-2 
          //   text-muted-foreground
          // '
        >
          {children}
        </div>
        
      {/* </NavigationMenuLink> */}
    </li>
  )
})
ListItem.displayName = 'ListItem'
