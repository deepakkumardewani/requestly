"use client";

import { Link } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTabsStore } from "@/stores/useTabsStore";
import { ShareModal } from "./ShareModal";

type ShareButtonProps = {
  tabId: string;
};

export function ShareButton({ tabId }: ShareButtonProps) {
  const [open, setOpen] = useState(false);

  const tab = useTabsStore((s) => s.tabs.find((t) => t.tabId === tabId));

  // Nothing to share until the user has typed a URL
  const disabled = !tab?.url;

  return (
    <>
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={() => setOpen(true)}
          >
            <Link className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Share request link</TooltipContent>
      </Tooltip>

      {open && tab && (
        <ShareModal open={open} onOpenChange={setOpen} tab={tab} />
      )}
    </>
  );
}
