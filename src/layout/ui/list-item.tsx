import { cn } from "#//lib/utils/tailwind-utils"
import * as React from 'react'

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
          className='
            p-1
            text-sm 
            font-medium 
            leading-none
          '
        >
          <a
            ref={ref}
            style={{
              color: '#DDDDDD',
            }}
            className={cn(
              // 'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
              className
            )}
            {...props}
          >
            {title}
          </a>
        </div>
        <div
          className='
            p-2
            text-sm 
            leading-snug 
            line-clamp-2 
            text-muted-foreground
          '
        >
          {children}
        </div>
        
      {/* </NavigationMenuLink> */}
    </li>
  )
})
ListItem.displayName = 'ListItem'

export default ListItem
