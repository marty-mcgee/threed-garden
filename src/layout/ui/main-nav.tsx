// 'use client'
'use server'
// ^^ does this file require client or server pragma ???

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
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
	HamburgerMenuIcon,
	DotFilledIcon,
	CheckIcon,
	ChevronRightIcon,
} from '@radix-ui/react-icons'

import '#/lib/home-design/src/styles/radix-ui.css'

import React from 'react'
// import { Button } from './button'

export default async function MainNav() {
	// const [bookmarksChecked, setBookmarksChecked] = React.useState(true);
	// const [urlsChecked, setUrlsChecked] = React.useState(false);
	// const [person, setPerson] = React.useState("pedro");

  return (
    <Flex 
      // display={'inline-flex'}
      // justify={'between'}
      // gap={'2'}
      align={'center'}
      style={{
        marginTop: 4, // wth !!!
        marginLeft: 4,
        marginBottom: 4,
        paddingBottom: 4,
      }}
    >
      <Flex
        align={'center'}
      >
        <CustomLink href='/#home'>
          <Button variant='ghost'>  
            <Image src='/favicon/favicon.png' priority={true} alt='Home' width='32' height='32' />
          </Button>
        </CustomLink>
        <Text
          as={'label'}
          weight={'medium'}
          className='pl-2 pr-2'
        >
          <CustomLink href='/#threedgarden' 
            style={{
              color: '#DDDDDD',
              textDecoration: 'none',
            }}
          >
            THREED GARDEN
          </CustomLink>
        </Text>
      </Flex>
      
      <Flex
        // justify={'between'}
        // gap={'2'}
        align={'center'}
        style={{
          // position: 'absolute',
          // bottom: '32px',
          // paddingTop: '2px',
        }}
      >
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="IconButton" aria-label="Start Here">
              <HamburgerMenuIcon />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content className="DropdownMenuContent" sideOffset={5}>
              
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger className="DropdownMenuSubTrigger">
                  Demos
                  <div className="RightSlot">
                    <ChevronRightIcon />
                  </div>
                </DropdownMenu.SubTrigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.SubContent
                    className="DropdownMenuSubContent"
                    sideOffset={2}
                    alignOffset={-5}
                  >
                    <DropdownMenu.Separator className="DropdownMenuSeparator" />
                    <DropdownMenu.Item className="DropdownMenuItem">
                      <CustomLink href='/participate'>
                        ThreeD Garden
                      </CustomLink> 
                      <div className="RightSlot">⌘+1</div>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="DropdownMenuSeparator" />
                    <DropdownMenu.Item className="DropdownMenuItem">
                      <CustomLink href='/home-design'>
                        ThreeD Home Design
                      </CustomLink>
                      <div className="RightSlot">⌘+2</div>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="DropdownMenuSeparator" />
                    <DropdownMenu.Item className="DropdownMenuItem">
                      <CustomLink href='/demo/index.html'>
                        ThreeD Legacy Home Design 
                      </CustomLink>
                      <div className="RightSlot">⌘+3</div>
                    </DropdownMenu.Item>
                    {/* <DropdownMenu.Separator className="DropdownMenuSeparator" />
                    <DropdownMenu.Item className="DropdownMenuItem">
                      <CustomLink href='https://companyjuice.mintlify.app'>
                        Documentation
                      </CustomLink>
                      <div className="RightSlot">⌘+4</div>
                    </DropdownMenu.Item> */}
                    <DropdownMenu.Separator className="DropdownMenuSeparator" />
                  </DropdownMenu.SubContent>
                </DropdownMenu.Portal>
              </DropdownMenu.Sub>

              <DropdownMenu.Separator className="DropdownMenuSeparator" />

              <DropdownMenu.Item className="DropdownMenuItem">
                <CustomLink href='https://companyjuice.mintlify.app'>
                  Documentation
                </CustomLink>
                <div className="RightSlot">⇧+⌘+D</div>
              </DropdownMenu.Item>

              {/* <DropdownMenu.Separator className="DropdownMenuSeparator" /> */}

              {/* <DropdownMenu.CheckboxItem
                className="DropdownMenuCheckboxItem"
                // checked={bookmarksChecked}
                // onCheckedChange={setBookmarksChecked}
              >
                <DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
                  <CheckIcon />
                </DropdownMenu.ItemIndicator>
                Show Bookmarks <div className="RightSlot">⌘+B</div>
              </DropdownMenu.CheckboxItem> */}
              {/* <DropdownMenu.CheckboxItem
                className="DropdownMenuCheckboxItem"
                // checked={urlsChecked}
                // onCheckedChange={setUrlsChecked}
              >
                <DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
                  <CheckIcon />
                </DropdownMenu.ItemIndicator>
                Show Full URLs
              </DropdownMenu.CheckboxItem> */}

              {/* <DropdownMenu.Separator className="DropdownMenuSeparator" /> */}

              {/* <DropdownMenu.Label className="DropdownMenuLabel">
                People
              </DropdownMenu.Label>
              <DropdownMenu.RadioGroup 
                // value={person} 
                // onValueChange={setPerson}
              >
                <DropdownMenu.RadioItem
                  className="DropdownMenuRadioItem"
                  value="pedro"
                >
                  <DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
                    <DotFilledIcon />
                  </DropdownMenu.ItemIndicator>
                  Pedro Duarte
                </DropdownMenu.RadioItem>
                <DropdownMenu.RadioItem
                  className="DropdownMenuRadioItem"
                  value="colm"
                >
                  <DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
                    <DotFilledIcon />
                  </DropdownMenu.ItemIndicator>
                  Colm Tuite
                </DropdownMenu.RadioItem>
              </DropdownMenu.RadioGroup>

              <DropdownMenu.Arrow className="DropdownMenuArrow" /> */}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </Flex>

    </Flex>
  )
}
