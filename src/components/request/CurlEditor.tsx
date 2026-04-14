"use client";

import { Copy, Import } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateCurl } from "@/lib/curlGenerator";
import { CurlParseError, parseCurl } from "@/lib/curlParser";
import { useTabsStore } from "@/stores/useTabsStore";

type CurlEditorProps = {
  tabId: string;
};

export function CurlEditor({ tabId }: CurlEditorProps) {
  const [curlInput, setCurlInput] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  const { tabs, updateTabState } = useTabsStore();
  const tab = tabs.find((t) => t.tabId === tabId);

  if (!tab) return null;

  const generatedCurl = generateCurl(tab);

  function handleImport() {
    if (!curlInput.trim()) return;
    setParseError(null);

    try {
      const parsed = parseCurl(curlInput);
      updateTabState(tabId, {
        method: parsed.method,
        url: parsed.url,
        headers: parsed.headers,
        body: parsed.body,
        auth: parsed.auth,
      });
      setCurlInput("");
      toast.success("cURL imported successfully");
    } catch (err) {
      const msg =
        err instanceof CurlParseError ? err.message : "Failed to parse cURL";
      setParseError(msg);
    }
  }

  async function handleCopyGenerated() {
    try {
      await navigator.clipboard.writeText(generatedCurl);
      toast.success("cURL copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-3">
      {/* Import section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium">Import cURL</p>
        </div>
        <Textarea
          data-testid="curl-input"
          className="min-h-[100px] font-mono text-xs"
          placeholder={`curl -X GET 'https://api.example.com/v1/users' \\\n  -H 'Authorization: Bearer TOKEN'`}
          value={curlInput}
          onChange={(e) => {
            setCurlInput(e.target.value);
            setParseError(null);
          }}
        />
        {parseError && <p className="text-xs text-destructive">{parseError}</p>}
        <Button
          data-testid="curl-import-btn"
          size="sm"
          className="gap-1.5 bg-method-accent/10 text-method-accent hover:bg-method-accent/20"
          onClick={handleImport}
          disabled={!curlInput.trim()}
        >
          <Import className="h-3.5 w-3.5" />
          Import
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Headers and parameters will be automatically parsed into the request
          fields.
        </p>
      </div>

      {/* Generated cURL section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium">Generated cURL</p>
          <Button
            data-testid="copy-curl-btn"
            variant="ghost"
            size="sm"
            className="h-6 gap-1 text-xs"
            onClick={handleCopyGenerated}
          >
            <Copy className="h-3 w-3" />
            Copy
          </Button>
        </div>
        <pre
          data-testid="generated-curl"
          className="rounded-md bg-muted p-2 font-mono text-[11px] text-method-accent whitespace-pre-wrap break-all"
        >
          {generatedCurl || "No URL configured"}
        </pre>
      </div>
    </div>
  );
}
