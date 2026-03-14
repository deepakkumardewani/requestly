"use client";

import { Copy } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

type HeadersViewerProps = {
  headers: Record<string, string>;
};

export function HeadersViewer({ headers }: HeadersViewerProps) {
  const entries = Object.entries(headers);

  async function copyHeader(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(`${key}: ${value}`);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  }

  return (
    <ScrollArea className="h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-7 text-xs">Name</TableHead>
            <TableHead className="h-7 text-xs">Value</TableHead>
            <TableHead className="h-7 w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map(([key, value]) => (
            <TableRow key={key} className="group">
              <TableCell className="py-1 font-mono text-[11px] font-medium">
                {key}
              </TableCell>
              <TableCell className="py-1 font-mono text-[11px] text-muted-foreground">
                {value}
              </TableCell>
              <TableCell className="py-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => copyHeader(key, value)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
