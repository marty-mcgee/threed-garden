// 'use client'
// 'use server'
// ^^ default pragma 'use client'

// ** REACT Imports
import React from 'react'
// import { Button } from './button'

// ** NEXT Imports
import Image from 'next/image'
import Link from 'next/link'

// ** RADIX-UI Imports
// import {
//   Container,
//   Grid,
//   Flex,
//   Text,
//   Button,
// } from '@radix-ui/themes'

// ** CUSTOM NAVIGATION
import CustomLink from './custom-link'
import ListItem from './list-item'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from './navigation-menu'
// ** THREED DROPDOWN MENU Imports
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'




function MainNavDropdownMenuDemo() {
  // ==========================================================
    // ** RETURN JSX
    return (
      <DropdownMenu.Root>
  
        <DropdownMenu.Trigger asChild>
          <button 
            // className='MenuButton' 
            // className={navigationMenuTriggerStyle()}
            style={{
              backgroundColor: '#222222', 
              color: '#888888',
              textDecoration: 'none',
              borderWidth: 0,
              // marginTop: 0,
              // padding: 0,
              fontSize: 12,
            }}
            aria-label='DEMOS'
          >
            🟢 DEMOS
          </button>
          {/* <NavigationMenuItem>
            <NavigationMenuLink
              href='/home-design'
              className={navigationMenuTriggerStyle()}
              style={{
                backgroundColor: '#222222', 
                color: '#888888',
                textDecoration: 'none',
                // borderWidth: 0,
                // marginTop: 0,
                // padding: 0,
                // fontSize: 12,
              }}
            >
              🟢 DEMO: FULL
            </NavigationMenuLink>
          </NavigationMenuItem> */}
        </DropdownMenu.Trigger>
  
        <DropdownMenu.Portal>
  
          <DropdownMenu.Content 
            className='DropdownMenuContent' 
            // sideOffset={5}
          >
            <DropdownMenu.Item 
              className='DropdownMenuItem'
              // onClick={() => doUpdatePreferences()}
            >
              <Link 
                href='/home-design' 
                title='Home Design Page'
                className='DropdownMenuItem'
              >
                🟢 DEMO: FULL
              </Link>
            </DropdownMenu.Item>
            
            <DropdownMenu.Item 
              className='DropdownMenuItem'
              // onClick={() => doUpdatePreferences()}
            >
              <Link 
                href='/participate' 
                title='Participate Page'
                className='DropdownMenuItem'
              >
                🟣 DEMO: BASIC
              </Link>
            </DropdownMenu.Item>
            
            <DropdownMenu.Item 
              className='DropdownMenuItem'
              // onClick={() => doUpdatePreferences()}
            >
              <Link 
                href='/characters' 
                title='Characters Page'
                className='DropdownMenuItem'
              >
                🔵 DEMO: CHARACTERS
              </Link>
            </DropdownMenu.Item>
            
            <DropdownMenu.Item 
              className='DropdownMenuItem'
              // onClick={() => doUpdatePreferences()}
            >
              <Link 
                href='/terrains' 
                title='Terrains Page'
                className='DropdownMenuItem'
              >
                🟤 DEMO: TERRAINS
              </Link>
            </DropdownMenu.Item>
  
            {/* <DropdownMenu.Separator className='DropdownMenuSeparator' /> */}
  
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
}

function MainNavDropdownMenuChat() {
  // ==========================================================
    // ** RETURN JSX
    return (
      <DropdownMenu.Root>
  
        <DropdownMenu.Trigger asChild>
          <button 
            // className='MenuButton' 
            // className={navigationMenuTriggerStyle()}
            style={{
              backgroundColor: '#222222', 
              color: '#888888',
              textDecoration: 'none',
              borderWidth: 0,
              // marginTop: 0,
              // padding: 0,
              fontSize: 12,
            }}
            aria-label='CHATS'
          >
            {/* <HamburgerMenuIcon /> */}
            🟣 CHATS
          </button>
        </DropdownMenu.Trigger>
  
        <DropdownMenu.Portal>
  
          <DropdownMenu.Content 
            className='DropdownMenuContent' 
            // sideOffset={5}
          >
            <DropdownMenu.Item 
              className='DropdownMenuItem'
              // onClick={() => doUpdatePreferences()}
            >
              <Link 
                href='/chat/openai' 
                title='OpenAI Chat Page'
                className='DropdownMenuItem'
                // style={{
                //   backgroundColor: '#222222', 
                //   color: '#888888',
                //   textDecoration: 'none',
                //   borderWidth: 0,
                //   // marginTop: 0,
                //   // padding: 0,
                //   fontSize: 12,
                // }}
              >
                🟠 CHAT: OpenAI
              </Link>
            </DropdownMenu.Item>
            
            <DropdownMenu.Item 
              className='DropdownMenuItem'
              // onClick={() => doUpdatePreferences()}
            >
              <Link 
                href='/chat/deepseek' 
                title='DeepSeek Chat Page'
                className='DropdownMenuItem'
                // style={{
                //   backgroundColor: '#222222', 
                //   color: '#888888',
                //   textDecoration: 'none',
                //   borderWidth: 0,
                //   // marginTop: 0,
                //   // padding: 0,
                //   fontSize: 12,
                // }}
              >
                🔵 CHAT: DeepSeek
              </Link>
            </DropdownMenu.Item>
  
            {/* <DropdownMenu.Separator className='DropdownMenuSeparator' /> */}
  
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
}






export default function MainNav() {
  return (
    <div
      style={{
        display: 'inline-flex',
        marginLeft: 4,
        marginTop: -8,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          // flexGrow: '0',
          alignItems: 'center',
          marginRight: -16,
        }}
      >
        {/* <CustomLink href='/#home'> */}
          <Image 
            src='/favicon/favicon.png' 
            // priority={true} 
            alt='ThreeD App Home'
            width={24}
            height={24}
          />
        {/* </CustomLink> */}
        <CustomLink href='/#threedgarden' 
          style={{
            color: '#DDDDDD',
            textDecoration: 'none',
            marginLeft: 4,
            // marginTop: -2,
            // marginBottom: 2,
          }}
        >
          ThreeD Garden
        </CustomLink>
      </div>
      
      <div
        style={{
          flexGrow: '1',
          // marginTop: 0,
        }}
      >
        <NavigationMenu
          // style={{
          //   zIndex: '99998 !important',
          // }}
        >
          <NavigationMenuList>
        
            {/* <NavigationMenuItem>
              <NavigationMenuLink
                href='/home-design'
                className={navigationMenuTriggerStyle()}
                style={{
                  backgroundColor: '#222222', 
                  color: '#888888',
                  textDecoration: 'none',
                  // borderWidth: 0,
                  // marginTop: 0,
                  // padding: 0,
                  // fontSize: 12,
                }}
              >
                🟢 DEMO: FULL
              </NavigationMenuLink>
            </NavigationMenuItem> */}
            
            {/* <NavigationMenuItem>
              <NavigationMenuLink
                href='/participate'
                className={navigationMenuTriggerStyle()}
                style={{
                  backgroundColor: '#222222', 
                  color: '#888888',
                  textDecoration: 'none',
                  // borderWidth: 0,
                  // margin: 0,
                  // padding: 0,
                  // fontSize: 12,
                }}
              >
                🟣 DEMO: BASIC
              </NavigationMenuLink>
            </NavigationMenuItem> */}
            
            {/* <NavigationMenuItem>
              <NavigationMenuLink
                href='/characters'
                className={navigationMenuTriggerStyle()}
                style={{
                  backgroundColor: '#222222', 
                  color: '#888888',
                  textDecoration: 'none',
                  // borderWidth: 0,
                  // margin: 0,
                  // padding: 0,
                  // fontSize: 12,
                }}
              >
                🔵 DEMO: CHARACTERS
              </NavigationMenuLink>
            </NavigationMenuItem> */}
        
            <NavigationMenuItem>
              <NavigationMenuLink
                href='/home-design'
                className={navigationMenuTriggerStyle()}
                style={{
                  backgroundColor: '#222222', 
                  color: '#888888',
                  textDecoration: 'none',
                  // borderWidth: 0,
                  // marginTop: 0,
                  // padding: 0,
                  // fontSize: 12,
                }}
              >
                {/* 🟢 DEMO: DROPDOWN */}
                <MainNavDropdownMenuDemo />
              </NavigationMenuLink>
            </NavigationMenuItem>
        
            {/* <NavigationMenuItem>
              <NavigationMenuLink
                href='/chat'
                className={navigationMenuTriggerStyle()}
                style={{
                  backgroundColor: '#222222', 
                  color: '#888888',
                  textDecoration: 'none',
                  // borderWidth: 0,
                  // marginTop: 0,
                  // padding: 0,
                  // fontSize: 12,
                }}
              >
                🟠 CHAT
              </NavigationMenuLink>
            </NavigationMenuItem> */}
        
            <NavigationMenuItem>
              <NavigationMenuLink
                href='/chat'
                className={navigationMenuTriggerStyle()}
                style={{
                  backgroundColor: '#222222', 
                  color: '#888888',
                  textDecoration: 'none',
                  // borderWidth: 0,
                  // marginTop: 0,
                  // padding: 0,
                  // fontSize: 12,
                }}
              >
                {/* 🟠 CHAT: DROPDOWN */}
                <MainNavDropdownMenuChat />
              </NavigationMenuLink>
            </NavigationMenuItem>

            
            {/* 
            <NavigationMenuItem>
              <NavigationMenuTrigger 
                style={{
                  backgroundColor: '#222222',
                  color: '#DDDDDD', 
                  borderWidth: 0,
                  textDecoration: 'none',
                }}
              >
                <CustomLink href='/participate' 
                  style={{
                    // backgroundColor: '#222222',
                    color: '#DDDDDD', 
                    textDecoration: 'none',
                  }}
                >
                  Participate
                </CustomLink>
              </NavigationMenuTrigger>
              <NavigationMenuContent 
                style={{
                  backgroundColor: '#222222',
                  color: '#DDDDDD',
                  textDecoration: 'none',
                  // listStyleType: 'none',
                }}
              >
                <ul 
                  className='
                    grid 
                    gap-0 
                    p-2
                    md:w-[400px] 
                    lg:w-[500px] 
                    lg:grid-cols-[.75fr_1fr]
                  '
                  style={{
                    // backgroundColor: '#111111',
                    textDecoration: 'none',
                    listStyleType: 'none',
                  }}
                >
                  <ListItem href='/home' title='Home Page'>
                    Go to /home page
                  </ListItem>
                  <ListItem href='/participate' title='Participate'>
                    Demo 1: ThreeD Garden
                  </ListItem>
                  <ListItem href='/page' title='About Page'>
                    Read about this project
                  </ListItem>
                  <ListItem href='/home-design' title='Home Design'>
                    Demo 2: Home Design
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem> */}
            
            {/*
            <NavigationMenuItem>
              <NavigationMenuTrigger 
                style={{
                  // backgroundColor: '#222222', 
                  color: '#DDDDDD', 
                  borderWidth: 0,
                }}
              >
                <CustomLink href='/server-example' 
                  style={{
                    color: '#DDDDDD', 
                    textDecoration: 'none',
                  }}
                >
                  Server
                </CustomLink>
              </NavigationMenuTrigger>
              <NavigationMenuContent 
                style={{
                  // backgroundColor: '#222222', 
                  color: '#DDDDDD', 
                  // listStyleType: 'none'
                }}
              >
              <ul 
                className='
                  grid 
                  gap-0 
                  p-1
                  md:w-[400px] 
                  lg:w-[500px] 
                  lg:grid-cols-[.75fr_1fr]
                '
                style={{
                  listStyleType: 'none',
                }}  
              >
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
              <NavigationMenuTrigger 
                style={{
                  // backgroundColor: '#222222', 
                  color: '#DDDDDD', 
                  borderWidth: 0,
                }}
              >
                <CustomLink href='/client-example' 
                  style={{
                    color: '#DDDDDD', 
                    textDecoration: 'none',
                  }}
                >
                  Client
                </CustomLink>
              </NavigationMenuTrigger>
              <NavigationMenuContent 
                style={{
                  // backgroundColor: '#222222', 
                  color: '#DDDDDD', 
                  // listStyleType: 'none'
                }}
              >
                <ul 
                  className='
                    grid 
                    gap-0 
                    p-1
                    md:w-[400px] 
                    lg:w-[500px] 
                    lg:grid-cols-[.75fr_1fr]
                  '
                  style={{
                    listStyleType: 'none',
                  }}
                >
                  <ListItem href='/participate' title='ThreeD Garden: Participate'>
                    Participate
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            */}

          </NavigationMenuList>
        </NavigationMenu>
      </div>

    </div>
  )
}
