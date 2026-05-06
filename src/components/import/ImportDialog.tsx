"use client";

import { load as loadYaml } from "js-yaml";
import { ExternalLink, FileJson, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CurlParseError, parseCurl } from "@/lib/curlParser";
import { isInsomniaExport, parseInsomnia } from "@/lib/insomniaParser";
import {
  isProbablyOpenApiDoc,
  OpenApiParseError,
  parseOpenApi,
} from "@/lib/openapiParser";
import { generateId } from "@/lib/utils";
import { useCollectionsStore } from "@/stores/useCollectionsStore";
import { useTabsStore } from "@/stores/useTabsStore";
import type { AuthConfig, BodyConfig, HttpMethod, KVPair } from "@/types";

type DropState = "idle" | "dragging" | "processing";

type ImportDialogProps = {
  open: boolean;
  onClose: () => void;
};

const HELP_LINKS = [
  {
    label: "How to copy as cURL",
    href: "https://everything.curl.dev/cmdline/copyas.html",
  },
  {
    label: "Export from Insomnia",
    href: "https://developer.konghq.com/how-to/import-an-api-spec-as-a-document/#export-data",
  },
  {
    label: "Export from Postman",
    href: "https://learning.postman.com/docs/getting-started/importing-and-exporting/importing-and-exporting-overview#exporting-postman-data",
  },
];

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export function ImportDialog({ open, onClose }: ImportDialogProps) {
  const [dropState, setDropState] = useState<DropState>("idle");
  const [curlInput, setCurlInput] = useState("");
  const [curlError, setCurlError] = useState<string | null>(null);
  const [openApiPaste, setOpenApiPaste] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { createCollection, addRequest } = useCollectionsStore();
  const openTab = useTabsStore((s) => s.openTab);

  function handleClose() {
    setCurlInput("");
    setCurlError(null);
    setOpenApiPaste("");
    setDropState("idle");
    onClose();
  }

  function importOpenApiText(text: string, label: string) {
    const { collectionName, requests } = parseOpenApi(text);
    const collection = createCollection(collectionName);
    for (const req of requests) {
      addRequest(collection.id, {
        tabId: generateId(),
        requestId: null,
        isDirty: false,
        ...req,
      });
    }
    toast.success(
      `Imported "${label}" — ${requests.length} request${requests.length === 1 ? "" : "s"}`,
    );
  }

  function handleOpenApiPasteImport() {
    if (!openApiPaste.trim()) return;
    try {
      importOpenApiText(openApiPaste.trim(), "OpenAPI");
      handleClose();
    } catch (err) {
      toast.error(
        err instanceof OpenApiParseError
          ? err.message
          : "Failed to parse OpenAPI document",
      );
    }
  }

  function handleCurlImport() {
    if (!curlInput.trim()) return;
    setCurlError(null);
    try {
      const parsed = parseCurl(curlInput);
      openTab({
        type: "http",
        name: `${parsed.method} request`,
        method: parsed.method,
        url: parsed.url,
        headers: parsed.headers,
        body: parsed.body,
        auth: parsed.auth,
      });
      toast.success("cURL imported — opened in new tab");
      handleClose();
    } catch (err) {
      const msg =
        err instanceof CurlParseError
          ? err.message
          : "Failed to parse cURL command";
      setCurlError(msg);
    }
  }

  function handleFileUpload(file: File) {
    setDropState("processing");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        let parsed: unknown;
        try {
          parsed = JSON.parse(text) as unknown;
        } catch {
          try {
            parsed = loadYaml(text) as unknown;
          } catch (yamlErr) {
            setDropState("idle");
            toast.error(
              yamlErr instanceof Error ? yamlErr.message : "Invalid YAML/JSON",
            );
            return;
          }
        }

        if (isRecord(parsed) && isInsomniaExport(parsed)) {
          importFileData(parsed, file.name);
          handleClose();
          setDropState("idle");
          return;
        }

        if (isRecord(parsed) && isProbablyOpenApiDoc(parsed)) {
          try {
            importOpenApiText(text, file.name);
          } catch (err) {
            toast.error(
              err instanceof OpenApiParseError
                ? err.message
                : "Failed to import OpenAPI",
            );
          }
          handleClose();
          setDropState("idle");
          return;
        }

        if (
          isRecord(parsed) &&
          parsed.info &&
          isRecord(parsed.info) &&
          parsed.info._postman_schema
        ) {
          importPostmanCollection(parsed);
          toast.success(`Imported "${file.name}" successfully`);
          handleClose();
          setDropState("idle");
          return;
        }

        setDropState("idle");
        toast.error(
          "Unrecognized format. Supported: OpenAPI 3 / Swagger 2, Postman v2.1, Insomnia v4",
        );
      } catch (err) {
        setDropState("idle");
        toast.error(
          err instanceof Error ? err.message : "Failed to import file",
        );
      }
    };
    reader.readAsText(file);
  }

  function importFileData(data: Record<string, unknown>, fileName: string) {
    if (isInsomniaExport(data)) {
      const collections = parseInsomnia(data);
      for (const col of collections) {
        const collection = createCollection(col.name);
        for (const req of col.requests) {
          addRequest(collection.id, {
            tabId: generateId(),
            requestId: null,
            isDirty: false,
            ...req,
          });
        }
      }
      const total = collections.reduce((sum, c) => sum + c.requests.length, 0);
      toast.success(
        `Imported "${fileName}" — ${total} request${total === 1 ? "" : "s"} in ${collections.length} collection${collections.length === 1 ? "" : "s"}`,
      );
      return;
    }

    if (data.info && (data.info as Record<string, unknown>)._postman_schema) {
      importPostmanCollection(data);
      toast.success(`Imported "${fileName}" successfully`);
      return;
    }

    throw new Error(
      "Unrecognized format. Supported: OpenAPI 3 / Swagger 2, Postman Collection v2.1, Insomnia v4 export",
    );
  }

  function importPostmanCollection(data: Record<string, unknown>) {
    const info = data.info as Record<string, unknown>;
    const collection = createCollection(
      String(info.name ?? "Imported Collection"),
    );
    importPostmanItems(
      collection.id,
      (data.item as Array<Record<string, unknown>>) ?? [],
    );
  }

  function importPostmanItems(
    collectionId: string,
    items: Array<Record<string, unknown>>,
  ) {
    for (const item of items) {
      // Nested folder — recurse into items
      if (Array.isArray(item.item)) {
        importPostmanItems(
          collectionId,
          item.item as Array<Record<string, unknown>>,
        );
        continue;
      }

      const req = item.request as Record<string, unknown> | undefined;
      if (!req) continue;

      const url =
        typeof req.url === "string"
          ? req.url
          : (((req.url as Record<string, unknown>)?.raw as string) ?? "");

      const rawHeaders =
        (req.header as Array<Record<string, unknown>> | undefined) ?? [];
      const headers: KVPair[] = rawHeaders
        .filter((h) => !h.disabled)
        .map((h) => ({
          id: generateId(),
          key: String(h.key ?? ""),
          value: String(h.value ?? ""),
          enabled: true,
        }));

      const body = parsePostmanBody(
        req.body as Record<string, unknown> | undefined,
      );
      const auth = parsePostmanAuth(
        req.auth as Record<string, unknown> | undefined,
      );

      addRequest(collectionId, {
        tabId: generateId(),
        requestId: null,
        name: String(item.name ?? "Request"),
        isDirty: false,
        type: "http",
        method: String(req.method ?? "GET").toUpperCase() as HttpMethod,
        url,
        params: [],
        headers,
        auth,
        body,
        preScript: "",
        postScript: "",
      });
    }
  }

  function parsePostmanBody(
    body: Record<string, unknown> | undefined,
  ): BodyConfig {
    if (!body) return { type: "none", content: "" };

    const mode = String(body.mode ?? "");
    if (mode === "raw") {
      const raw = String(body.raw ?? "");
      const options = body.options as Record<string, unknown> | undefined;
      const lang = String(
        (options?.raw as Record<string, unknown>)?.language ?? "",
      );
      if (lang === "json") return { type: "json", content: raw };
      if (lang === "xml") return { type: "xml", content: raw };
      if (lang === "html") return { type: "html", content: raw };
      return { type: "text", content: raw };
    }
    if (mode === "urlencoded") {
      const params =
        (body.urlencoded as Array<Record<string, unknown>> | undefined) ?? [];
      const content = params
        .filter((p) => !p.disabled)
        .map(
          (p) =>
            `${encodeURIComponent(String(p.key ?? ""))}=${encodeURIComponent(String(p.value ?? ""))}`,
        )
        .join("&");
      return { type: "urlencoded", content };
    }

    return { type: "none", content: "" };
  }

  function parsePostmanAuth(
    auth: Record<string, unknown> | undefined,
  ): AuthConfig {
    if (!auth) return { type: "none" };
    const type = String(auth.type ?? "none");

    if (type === "bearer") {
      const items =
        (auth.bearer as Array<Record<string, unknown>> | undefined) ?? [];
      const tokenItem = items.find((i) => i.key === "token");
      return { type: "bearer", token: String(tokenItem?.value ?? "") };
    }
    if (type === "basic") {
      const items =
        (auth.basic as Array<Record<string, unknown>> | undefined) ?? [];
      const username = String(
        items.find((i) => i.key === "username")?.value ?? "",
      );
      const password = String(
        items.find((i) => i.key === "password")?.value ?? "",
      );
      return { type: "basic", username, password };
    }

    return { type: "none" };
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-xl flex flex-col h-[620px]">
        <DialogHeader>
          <DialogTitle>Import</DialogTitle>
          <DialogDescription>
            Paste cURL or OpenAPI (YAML/JSON), or drop a collection / spec file.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 flex-1 min-h-0">
          {/* cURL input at top */}
          <div className="space-y-1.5">
            <Textarea
              className="min-h-[80px] max-h-[120px] font-mono text-xs resize-none break-all overflow-wrap-anywhere"
              placeholder={`Paste cURL command here…\ncurl -X GET 'https://api.example.com/v1/users' -H 'Authorization: Bearer TOKEN'`}
              value={curlInput}
              onChange={(e) => {
                setCurlInput(e.target.value);
                setCurlError(null);
              }}
            />
            {curlError && (
              <p className="text-xs text-destructive">{curlError}</p>
            )}
            {curlInput.trim() && (
              <Button
                size="sm"
                className="gap-1.5 bg-method-accent/10 text-method-accent hover:bg-method-accent/20"
                onClick={handleCurlImport}
              >
                Import cURL
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <Textarea
              className="min-h-[72px] max-h-[100px] font-mono text-xs resize-none break-all overflow-wrap-anywhere"
              placeholder="Paste OpenAPI 3 or Swagger 2 (YAML or JSON)…"
              value={openApiPaste}
              onChange={(e) => setOpenApiPaste(e.target.value)}
            />
            {openApiPaste.trim() && (
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5"
                onClick={handleOpenApiPasteImport}
              >
                Import OpenAPI
              </Button>
            )}
          </div>

          {/* File drop zone */}
          <div
            className={`flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              dropState === "dragging"
                ? "border-method-accent bg-method-accent/5"
                : "border-border hover:border-method-accent/40"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDropState("dragging");
            }}
            onDragLeave={() => setDropState("idle")}
            onDrop={(e) => {
              e.preventDefault();
              setDropState("idle");
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload(file);
            }}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              {dropState === "processing" ? (
                <FileJson className="h-4 w-4 text-muted-foreground animate-pulse" />
              ) : (
                <Upload className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm font-medium">
              {dropState === "processing" ? "Processing…" : "Drop file here"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              OpenAPI / Swagger YAML or JSON, Postman v2.1, Insomnia v4 JSON
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={dropState === "processing"}
              onClick={() => fileInputRef.current?.click()}
            >
              Choose file
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".json,.yaml,.yml,application/json,text/yaml"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = "";
              }}
            />
          </div>

          {/* Help links — inline, no dropdown */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {HELP_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
