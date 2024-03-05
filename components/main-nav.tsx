'use client'

import Image from 'next/image'

import { cn } from '@/lib/utils'
import CustomLink from './custom-link'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from './ui/navigation-menu'
import React from 'react'
// import { Button } from './ui/button'

export function MainNav() {
  return (
    <div className='flex items-center space-x-0 lg:space-x-0'>
      <CustomLink href='/'>
        <Image src='/favicon/apple-icon.png' priority={true} alt='Home' width='48' height='48' />
      </CustomLink>
      <h3 className='pl-2'>
        <CustomLink href='/participate' style={{color: '#DDDDDD'}}>
          THREED GARDEN
        </CustomLink>
      </h3>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Participate</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className='grid gap-0 p-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]'>
                <ListItem href='/home' title='Home'>
                  Go to the home page.
                </ListItem>
                <ListItem href='/participate' title='Participate'>
                  Use the ThreeD Garden interface.
                </ListItem>
                <ListItem href='/page' title='About Page'>
                  Read more about this project's pages.
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Server</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className='grid gap-0 p-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]'>
                <ListItem href='/server-example' title='RSC Example'>
                  Protecting React Server Component.
                </ListItem>
                <ListItem href='/middleware-example' title='Middleware Example'>
                  Using Middleware to protect pages & APIs.
                </ListItem>
                <ListItem href='/api-example' title='Route Handler Example'>
                  Getting the session inside an API Route.
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              href='/client-example'
              className={navigationMenuTriggerStyle()}
            >
              Client
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'>
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          <div className='text-sm font-medium leading-none'>{title}</div>
          <p className='text-sm leading-snug line-clamp-2 text-muted-foreground'>
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = 'ListItem'
