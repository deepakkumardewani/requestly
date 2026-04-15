"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTabsStore } from "@/stores/useTabsStore";
import type { AuthConfig, AuthType } from "@/types";

type AuthEditorProps = {
  tabId: string;
};

const AUTH_TYPES: Array<{ value: AuthType; label: string }> = [
  { value: "none", label: "No Auth" },
  { value: "bearer", label: "Bearer Token" },
  { value: "basic", label: "Basic Auth" },
  { value: "api-key", label: "API Key" },
];

export function AuthEditor({ tabId }: AuthEditorProps) {
  const { tabs, updateTabState } = useTabsStore();
  const tab = tabs.find((t) => t.tabId === tabId);

  if (!tab) return null;
  if (tab.type !== "http" && tab.type !== "graphql") return null;

  const { auth } = tab;

  function handleTypeChange(type: AuthType | null) {
    if (!type) return;
    let newAuth: AuthConfig;
    switch (type) {
      case "none":
        newAuth = { type: "none" };
        break;
      case "bearer":
        newAuth = { type: "bearer", token: "" };
        break;
      case "basic":
        newAuth = { type: "basic", username: "", password: "" };
        break;
      case "api-key":
        newAuth = { type: "api-key", key: "", value: "", addTo: "header" };
        break;
      default: {
        const _exhaustive: never = type;
        throw new Error(`Unhandled auth type: ${_exhaustive}`);
      }
    }
    updateTabState(tabId, { auth: newAuth });
  }

  return (
    <div className="space-y-4 p-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Auth Type</Label>
        <Select value={auth.type} onValueChange={handleTypeChange}>
          <SelectTrigger
            className="h-8 w-56 text-xs"
            data-testid="auth-type-selector"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AUTH_TYPES.map((t) => (
              <SelectItem
                key={t.value}
                value={t.value}
                className="text-xs"
                data-testid={`auth-type-${t.value}`}
              >
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {auth.type === "bearer" && (
        <div className="space-y-1.5">
          <Label className="text-xs">Token</Label>
          <Input
            className="h-8 font-mono text-xs"
            type="password"
            data-testid="auth-bearer-token"
            value={auth.token}
            placeholder="Bearer token..."
            onChange={(e) =>
              updateTabState(tabId, {
                auth: { ...auth, token: e.target.value },
              })
            }
          />
        </div>
      )}

      {auth.type === "basic" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Username</Label>
            <Input
              className="h-8 text-xs"
              data-testid="auth-basic-username"
              value={auth.username}
              placeholder="username"
              onChange={(e) =>
                updateTabState(tabId, {
                  auth: { ...auth, username: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Password</Label>
            <Input
              className="h-8 text-xs"
              type="password"
              data-testid="auth-basic-password"
              value={auth.password}
              placeholder="password"
              onChange={(e) =>
                updateTabState(tabId, {
                  auth: { ...auth, password: e.target.value },
                })
              }
            />
          </div>
        </div>
      )}

      {auth.type === "api-key" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Key Name</Label>
              <Input
                className="h-8 text-xs"
                data-testid="auth-apikey-name"
                value={auth.key}
                placeholder="X-API-Key"
                onChange={(e) =>
                  updateTabState(tabId, {
                    auth: { ...auth, key: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Key Value</Label>
              <Input
                className="h-8 font-mono text-xs"
                type="password"
                data-testid="auth-apikey-value"
                value={auth.value}
                placeholder="your-api-key"
                onChange={(e) =>
                  updateTabState(tabId, {
                    auth: { ...auth, value: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Add To</Label>
            <Select
              value={auth.addTo}
              onValueChange={(v) => {
                if (!v) return;
                updateTabState(tabId, {
                  auth: { ...auth, addTo: v as "header" | "query" },
                });
              }}
            >
              <SelectTrigger
                className="h-8 w-40 text-xs"
                data-testid="auth-apikey-addto"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="header"
                  className="text-xs"
                  data-testid="auth-apikey-addto-header"
                >
                  Header
                </SelectItem>
                <SelectItem
                  value="query"
                  className="text-xs"
                  data-testid="auth-apikey-addto-query"
                >
                  Query Param
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {auth.type === "none" && (
        <p className="text-xs text-muted-foreground">
          No authentication will be sent with this request.
        </p>
      )}
    </div>
  );
}
