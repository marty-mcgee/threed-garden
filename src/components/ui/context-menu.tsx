"use client"

import * as React from "react"
import { ContextMenu as Primitive } from "radix-ui"
import { cn } from "@/libraries/utils/index"

function ContextMenu(props: React.ComponentProps<typeof Primitive.Root>) {
  return <Primitive.Root {...props} />
}

function ContextMenuTrigger(props: React.ComponentProps<typeof Primitive.Trigger>) {
  return <Primitive.Trigger data-slot="context-menu-trigger" {...props} />
}

function ContextMenuContent({ className, ...props }: React.ComponentProps<typeof Primitive.Content>) {
  return <Primitive.Portal><Primitive.Content data-slot="context-menu-content" className={cn("z-50 max-h-[var(--radix-context-menu-content-available-height)] min-w-40 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md", className)} {...props} /></Primitive.Portal>
}

function ContextMenuItem({ className, ...props }: React.ComponentProps<typeof Primitive.Item>) {
  return <Primitive.Item data-slot="context-menu-item" className={cn("relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:shrink-0", className)} {...props} />
}

function ContextMenuLabel({ className, ...props }: React.ComponentProps<typeof Primitive.Label>) {
  return <Primitive.Label data-slot="context-menu-label" className={cn("px-2 py-1 text-xs font-semibold text-muted-foreground", className)} {...props} />
}

function ContextMenuSeparator({ className, ...props }: React.ComponentProps<typeof Primitive.Separator>) {
  return <Primitive.Separator data-slot="context-menu-separator" className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
}

export { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator }
