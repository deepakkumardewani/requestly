"use client";

export function ChainPageFooter() {
  return (
    <footer className="flex h-7 shrink-0 items-center justify-center border-t border-border bg-card/50">
      <p className="text-[10px] text-muted-foreground">
        Drag nodes to reposition · Draw from handle to handle to create
        connections · Add a Display node to configure data extraction ·
        Delete/Backspace to remove edges
      </p>
    </footer>
  );
}
