"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SaveRequestModal } from "@/components/collections/SaveRequestModal";
import { CommandPalette } from "@/components/common/CommandPalette";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useCloseTabGuard } from "@/hooks/useCloseTabGuard";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMethodTheme } from "@/hooks/useMethodTheme";
import { useSaveRequest } from "@/hooks/useSaveRequest";
import { decodeShareLink } from "@/lib/shareLink";
import { useTabsStore } from "@/stores/useTabsStore";
import { useUIStore } from "@/stores/useUIStore";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";

export function MainLayout() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { openTab, tabs } = useTabsStore();

  const {
    mobileSidebarOpen,
    toggleMobileSidebar,
    saveModalOpen,
    setSaveModalOpen,
    setIsCreatingCollection,
    setPendingBulkClose,
  } = useUIStore();
  const { save, activeTab } = useSaveRequest();
  const { handleCloseTab } = useCloseTabGuard();
  const { closeAllTabs } = useTabsStore();

  function handleCloseActiveTab() {
    if (activeTab) handleCloseTab(activeTab);
  }

  function handleCloseAllTabs() {
    const hasDirty = tabs.some((t) => t.isDirty);
    if (hasDirty) {
      setPendingBulkClose({ kind: "all" });
    } else {
      closeAllTabs();
    }
  }

  const activeMethod = activeTab?.method ?? "GET";

  // Prevent closing the browser tab when there are unsaved changes
  useEffect(() => {
    const hasDirty = tabs.some((t) => t.isDirty);
    if (!hasDirty) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [tabs]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydrate a tab from a ?r= share link on first mount
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("r");
    if (!raw) return;

    const payload = decodeShareLink(raw);
    if (payload) {
      openTab({
        name: `${payload.method} ${payload.url || "Shared Request"}`,
        method: payload.method,
        url: payload.url,
        headers: payload.headers,
        params: payload.params,
        body: payload.body,
        auth: payload.auth,
      });
    }

    if (payload) {
      toast.success("Request loaded from shared link");
    } else {
      toast.error("Invalid share link");
    }

    // Strip the ?r= param from the URL without triggering a navigation
    history.replaceState({}, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drive the whole UI's accent color from the active method
  useMethodTheme(activeMethod);
  // Global keyboard shortcuts
  useKeyboardShortcuts({
    onSave: save,
    onCloseTab: handleCloseActiveTab,
    onCloseAllTabs: handleCloseAllTabs,
    onNewRequest: openTab,
    onNewCollection: () => setIsCreatingCollection(true),
    onManageEnvironments: () => router.push("/environments"),
    onOpenSettings: () => router.push("/settings"),
    onImportCollection: () => router.push("/import"),
    onTransformPlayground: () => router.push("/transform"),
    onCompareJson: () => router.push("/json-compare"),
  });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop: resizable two-column layout */}
      {mounted ? (
        <ResizablePanelGroup
          orientation="horizontal"
          className="hidden md:flex"
        >
          <ResizablePanel
            defaultSize="20%"
            minSize="10%"
            maxSize="90%"
            className="border-r border-border"
          >
            <LeftPanel />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="80%" minSize="80%">
            <RightPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="hidden h-full w-full md:flex">
          <div className="w-[20%] border-r border-border" />
          <div className="flex-1" />
        </div>
      )}

      {/* Mobile: full RightPanel + Sheet for sidebar */}
      <div className="flex w-full md:hidden">
        <RightPanel />
      </div>
      <Sheet open={mobileSidebarOpen} onOpenChange={toggleMobileSidebar}>
        <SheetContent side="left" className="w-72 p-0">
          <LeftPanel />
        </SheetContent>
      </Sheet>

      {/* Command Palette — always mounted, visibility controlled by store */}
      <CommandPalette />

      {/* Save Request Modal — opened by Cmd+S or Save button when tab has no collection */}
      {saveModalOpen && activeTab && (
        <SaveRequestModal
          open={saveModalOpen}
          onOpenChange={setSaveModalOpen}
          tab={activeTab}
        />
      )}
    </div>
  );
}
