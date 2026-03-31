"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { Play, PlayCircle, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";

type NodeContextMenuProps = {
  x: number;
  y: number;
  requestId: string;
  onClose: () => void;
  onAddAfter: (requestId: string) => void;
  onRunUpTo: (requestId: string) => void;
  onRunFromHere: (requestId: string) => void;
  onDelete: (requestId: string) => void;
};

const ITEM_CLASS =
  "relative flex cursor-default items-center gap-2 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50";

export function NodeContextMenu({
  x,
  y,
  requestId,
  onClose,
  onAddAfter,
  onRunUpTo,
  onRunFromHere,
  onDelete,
}: NodeContextMenuProps) {
  // Virtual anchor at cursor coordinates — Base UI Positioner anchors to this
  const anchor = useMemo(
    () => ({
      getBoundingClientRect: (): DOMRect =>
        ({
          x,
          y,
          width: 0,
          height: 0,
          top: y,
          right: x,
          bottom: y,
          left: x,
          toJSON: () => ({}),
        }) as DOMRect,
    }),
    [x, y],
  );

  return (
    <MenuPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {/* Hidden trigger required by Base UI; layout is overridden by the virtual anchor */}
      <MenuPrimitive.Trigger className="sr-only" aria-hidden />

      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner
          className="isolate z-50 outline-none"
          anchor={anchor}
          side="bottom"
          align="start"
          sideOffset={4}
        >
          <MenuPrimitive.Popup className="z-50 min-w-48 origin-(--transform-origin) overflow-hidden rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <MenuPrimitive.Item
              className={ITEM_CLASS}
              onClick={() => {
                onAddAfter(requestId);
                onClose();
              }}
            >
              <Plus className="h-4 w-4 shrink-0" />
              Add API after this
            </MenuPrimitive.Item>

            <MenuPrimitive.Item
              className={ITEM_CLASS}
              onClick={() => {
                onRunUpTo(requestId);
                onClose();
              }}
            >
              <Play className="h-4 w-4 shrink-0" />
              Run up to here
            </MenuPrimitive.Item>

            <MenuPrimitive.Item
              className={ITEM_CLASS}
              onClick={() => {
                onRunFromHere(requestId);
                onClose();
              }}
            >
              <PlayCircle className="h-4 w-4 shrink-0" />
              Run from here
            </MenuPrimitive.Item>

            <MenuPrimitive.Separator className="-mx-1 my-1 h-px bg-border" />

            <MenuPrimitive.Item
              className={`${ITEM_CLASS} text-destructive focus:bg-destructive/10 focus:text-destructive`}
              onClick={() => {
                onDelete(requestId);
                onClose();
              }}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              Delete node
            </MenuPrimitive.Item>
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}
