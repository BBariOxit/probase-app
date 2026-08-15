'use client';

import * as React from 'react';
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';

import { cn } from '@/lib/utils';

/**
 * A label for something that shows only an icon.
 *
 * The collapsed sidebar is the reason this exists, so the popup is offset with
 * a margin rather than a positioner prop — the gap belongs to the popup's own
 * box either way, and this keeps the component to one styling surface.
 */
function Tooltip({
  content,
  side = 'right',
  children,
}: {
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: React.ReactElement;
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger delay={300} render={children} />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner side={side} className="z-50">
          <TooltipPrimitive.Popup
            className={cn(
              'mx-2 my-1 rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md',
              'origin-(--transform-origin) transition-[transform,opacity] duration-150',
              'data-ending-style:scale-95 data-ending-style:opacity-0',
              'data-starting-style:scale-95 data-starting-style:opacity-0',
            )}
          >
            {content}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export { Tooltip };
