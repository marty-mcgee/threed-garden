

// ** REACT Imports
import { 
  useState,
  // useRef,
  // useEffect,
  // Suspense,
  // useCallback,
} from 'react'


import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import {
	HamburgerMenuIcon,
	DotFilledIcon,
	CheckIcon,
	ChevronRightIcon,
} from '@radix-ui/react-icons'


// ** RADIX-UI DropdownMenu
export const DropdownMenuThreeD = () => {
  const [bookmarksChecked, setBookmarksChecked] = useState(true)
  const [urlsChecked, setUrlsChecked] = useState(false)
  const [person, setPerson] = useState('marty')

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className='IconButton' aria-label='Customise options'>
          <HamburgerMenuIcon />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content 
          className='DropdownMenuContent' 
          // sideOffset={5}
        >
          <DropdownMenu.Item 
            className='DropdownMenuItem'
            // onClick={() => handleShowModalAbout()}
          >
            About <div className='RightSlot'>⌘+A</div>
          </DropdownMenu.Item>
          <DropdownMenu.Item 
            className='DropdownMenuItem'
            // onClick={() => handleShowModal3dModel()}
          >
            3D Model <div className='RightSlot'>⌘+N</div>
          </DropdownMenu.Item>
          <DropdownMenu.Item 
            className='DropdownMenuItem'
            // onClick={() => handleShowModalShare()}
          >
            Share <div className='RightSlot'>⌘+N</div>
          </DropdownMenu.Item>
          <DropdownMenu.Item 
            className='DropdownMenuItem'
            // onClick={() => handleShowModalLoading()}
          >
            Loading <div className='RightSlot'>⌘+N</div>
          </DropdownMenu.Item>
          <DropdownMenu.Item 
            className='DropdownMenuItem' 
            disabled
          >
            New Private Modal <div className='RightSlot'>⇧+⌘+N</div>
          </DropdownMenu.Item>
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className='DropdownMenuSubTrigger'>
              Files
              <div className='RightSlot'>
                <ChevronRightIcon />
              </div>
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent
                className='DropdownMenuSubContent'
                sideOffset={2}
                alignOffset={-5}
              >
                <DropdownMenu.Item className='DropdownMenuItem'>
                  Save Page As… <div className='RightSlot'>⌘+S</div>
                </DropdownMenu.Item>
                <DropdownMenu.Item className='DropdownMenuItem'>
                  Create Shortcut…
                </DropdownMenu.Item>
                <DropdownMenu.Item className='DropdownMenuItem'>
                  Name Window…
                </DropdownMenu.Item>
                <DropdownMenu.Separator className='DropdownMenu.Separator' />
                <DropdownMenu.Item className='DropdownMenuItem'>
                  Developer Tools
                </DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className='DropdownMenuSubTrigger'>
              Edits
              <div className='RightSlot'>
                <ChevronRightIcon />
              </div>
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent
                className='DropdownMenuSubContent'
                sideOffset={2}
                alignOffset={-5}
              >
                <DropdownMenu.Item className='DropdownMenuItem'>
                  Save Page As… <div className='RightSlot'>⌘+S</div>
                </DropdownMenu.Item>
                <DropdownMenu.Item className='DropdownMenuItem'>
                  Create Shortcut…
                </DropdownMenu.Item>
                <DropdownMenu.Item className='DropdownMenuItem'>
                  Name Window…
                </DropdownMenu.Item>
                <DropdownMenu.Separator className='DropdownMenu.Separator' />
                <DropdownMenu.Item className='DropdownMenuItem'>
                  Developer Tools
                </DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className='DropdownMenuSubTrigger'>
              Plan Views
              <div className='RightSlot'>
                <ChevronRightIcon />
              </div>
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent
                className='DropdownMenuSubContent'
                sideOffset={2}
                alignOffset={-5}
              >
                <DropdownMenu.Item className='DropdownMenuItem'>
                  Save Page As… <div className='RightSlot'>⌘+S</div>
                </DropdownMenu.Item>
                <DropdownMenu.Item className='DropdownMenuItem'>
                  Create Shortcut…
                </DropdownMenu.Item>
                <DropdownMenu.Item className='DropdownMenuItem'>
                  Name Window…
                </DropdownMenu.Item>
                <DropdownMenu.Separator className='DropdownMenu.Separator' />
                <DropdownMenu.Item className='DropdownMenuItem'>
                  Developer Tools
                </DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className='DropdownMenuSubTrigger'>
              3D Views
              <div className='RightSlot'>
                <ChevronRightIcon />
              </div>
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent
                className='DropdownMenuSubContent'
                sideOffset={2}
                alignOffset={-5}
              >
                <DropdownMenu.Item className='DropdownMenuItem'>
                  Save Page As… <div className='RightSlot'>⌘+S</div>
                </DropdownMenu.Item>
                <DropdownMenu.Item className='DropdownMenuItem'>
                  Create Shortcut…
                </DropdownMenu.Item>
                <DropdownMenu.Item className='DropdownMenuItem'>
                  Name Window…
                </DropdownMenu.Item>
                <DropdownMenu.Separator className='DropdownMenu.Separator' />
                <DropdownMenu.Item className='DropdownMenuItem'>
                  Developer Tools
                </DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>

          <DropdownMenu.Separator className='DropdownMenuSeparator' />

          <DropdownMenu.CheckboxItem
            className='DropdownMenuCheckboxItem'
            checked={bookmarksChecked}
            onCheckedChange={setBookmarksChecked}
          >
            <DropdownMenu.ItemIndicator className='DropdownMenuItemIndicator'>
              <CheckIcon />
            </DropdownMenu.ItemIndicator>
            Show Bookmarks <div className='RightSlot'>⌘+B</div>
          </DropdownMenu.CheckboxItem>
          <DropdownMenu.CheckboxItem
            className='DropdownMenuCheckboxItem'
            checked={urlsChecked}
            onCheckedChange={setUrlsChecked}
          >
            <DropdownMenu.ItemIndicator className='DropdownMenuItemIndicator'>
              <CheckIcon />
            </DropdownMenu.ItemIndicator>
            Show Full URLs
          </DropdownMenu.CheckboxItem>

          <DropdownMenu.Separator className='DropdownMenuSeparator' />

          <DropdownMenu.Label className='DropdownMenuLabel'>
            People
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={person} onValueChange={setPerson}>
            <DropdownMenu.RadioItem
              className='DropdownMenuRadioItem'
              value='marty'
            >
              <DropdownMenu.ItemIndicator className='DropdownMenuItemIndicator'>
                <DotFilledIcon />
              </DropdownMenu.ItemIndicator>
              Marty McGee
            </DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem
              className='DropdownMenuRadioItem'
              value='alex'
            >
              <DropdownMenu.ItemIndicator className='DropdownMenuItemIndicator'>
                <DotFilledIcon />
              </DropdownMenu.ItemIndicator>
              Alex Uychocde
            </DropdownMenu.RadioItem>
          </DropdownMenu.RadioGroup>

          <DropdownMenu.Arrow className='DropdownMenuArrow' />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}