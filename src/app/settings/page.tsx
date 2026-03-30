"use client";

import { Monitor, Moon, Sun, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

type SettingsSection = "general" | "appearance" | "proxy" | "shortcuts";

// Returns true when running on macOS — used to show ⌘ vs Ctrl in shortcut labels
function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

const SHORTCUT_KEYS = [
  { action: "Send Request", key: "Enter" },
  { action: "New Request", key: "N" },
  { action: "Save Current", key: "S" },
  { action: "Close Tab", key: "W" },
  { action: "Command Palette", key: "K" },
  { action: "Focus URL Bar", key: "F" },
];

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export default function SettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("appearance");
  const [clearHistoryOpen, setClearHistoryOpen] = useState(false);

  const { theme, setTheme } = useTheme();
  const {
    sslVerify,
    followRedirects,
    proxyUrl,
    showHealthMonitor,
    showCodeGen,
    autoExpandExplainer,
    setSetting,
  } = useSettingsStore();
  const { clearHistory } = useHistoryStore();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Nav */}
      <nav className="w-52 shrink-0 border-r p-4">
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="mt-3 text-lg font-semibold">Settings</h1>
        </div>

        <div className="space-y-0.5">
          {(
            [
              ["general", "General"],
              ["appearance", "Appearance"],
              ["proxy", "Proxy & SSL"],
              ["shortcuts", "Shortcuts"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={cn(
                "flex w-full items-center rounded px-3 py-2 text-sm transition-colors",
                activeSection === id
                  ? "border-l-2 border-l-method-accent bg-method-accent/10 pl-[calc(0.75rem-2px)] text-method-accent font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto p-8">
        {/* General */}
        {activeSection === "general" && (
          <div className="max-w-lg space-y-6">
            <h2 className="text-base font-semibold">General</h2>

            <div className="rounded-lg border p-4">
              <h3 className="text-sm font-medium">Features</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Toggle optional UI features
              </p>
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Health indicators</Label>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Show success rate and response time in collections
                    </p>
                  </div>
                  <Switch
                    checked={showHealthMonitor}
                    onCheckedChange={(v) => setSetting("showHealthMonitor", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Code generation panel</Label>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Show code snippets for the current request (cURL, fetch,
                      axios, Python, Go)
                    </p>
                  </div>
                  <Switch
                    checked={showCodeGen}
                    onCheckedChange={(v) => setSetting("showCodeGen", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">
                      Auto-expand error explainer
                    </Label>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Automatically expand the "Why did this fail?" panel on
                      4xx/5xx responses
                    </p>
                  </div>
                  <Switch
                    checked={autoExpandExplainer}
                    onCheckedChange={(v) =>
                      setSetting("autoExpandExplainer", v)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="text-sm font-medium">Data Management</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Manage locally stored data
              </p>
              <div className="mt-3 space-y-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={() => setClearHistoryOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear History
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Appearance */}
        {activeSection === "appearance" && (
          <div className="max-w-lg space-y-6">
            <h2 className="text-base font-semibold">Appearance & Theme</h2>

            <div className="grid grid-cols-3 gap-3">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <Card
                  key={value}
                  className={cn(
                    "cursor-pointer transition-all",
                    theme === value
                      ? "border-method-accent ring-2 ring-method-accent/30"
                      : "hover:border-method-accent/50",
                  )}
                  onClick={() => setTheme(value)}
                >
                  <CardContent className="flex flex-col items-center gap-2 py-4">
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        theme === value && "text-method-accent",
                      )}
                    />
                    <span className="text-xs font-medium">{label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Proxy & SSL */}
        {activeSection === "proxy" && (
          <div className="max-w-lg space-y-6">
            <h2 className="text-base font-semibold">Network & Security</h2>

            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">SSL Verification</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Verify SSL certificates for HTTPS requests
                  </p>
                </div>
                <Switch
                  checked={sslVerify}
                  onCheckedChange={(v) => setSetting("sslVerify", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Follow Redirects</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Automatically follow HTTP redirects
                  </p>
                </div>
                <Switch
                  checked={followRedirects}
                  onCheckedChange={(v) => setSetting("followRedirects", v)}
                />
              </div>
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              <Label className="text-sm">Proxy URL</Label>
              <p className="text-xs text-muted-foreground">
                Override the proxy server URL for all requests
              </p>
              <Input
                className="h-8 font-mono text-xs"
                value={proxyUrl}
                placeholder="http://127.0.0.1:8080"
                onChange={(e) => setSetting("proxyUrl", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Shortcuts */}
        {activeSection === "shortcuts" && (
          <div className="max-w-lg space-y-6">
            <h2 className="text-base font-semibold">Keyboard Shortcuts</h2>

            <div className="rounded-lg border">
              <div className="grid grid-cols-2 gap-px bg-border">
                {SHORTCUT_KEYS.map(({ action, key }) => {
                  const modifierLabel = isMac() ? "⌘" : "Ctrl";
                  const shortcut = `${modifierLabel}+${key}`;
                  return (
                    <div
                      key={action}
                      className="flex items-center justify-between bg-background px-4 py-2.5"
                    >
                      <span className="text-xs text-muted-foreground">
                        {action}
                      </span>
                      <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        {shortcut}
                      </kbd>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Clear History Dialog */}
      <Dialog open={clearHistoryOpen} onOpenChange={setClearHistoryOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Clear History</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete all request history. This action cannot
            be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClearHistoryOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                clearHistory();
                setClearHistoryOpen(false);
                toast.success("History cleared");
              }}
            >
              Clear History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
