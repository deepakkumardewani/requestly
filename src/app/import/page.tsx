"use client";

import { Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CurlParseError, parseCurl } from "@/lib/curlParser";
import { useCollectionsStore } from "@/stores/useCollectionsStore";
import { useTabsStore } from "@/stores/useTabsStore";

type ImportStatus = "idle" | "dragging" | "processing" | "success" | "error";

export default function ImportPage() {
  const router = useRouter();
  const [curlInput, setCurlInput] = useState("");
  const [curlError, setCurlError] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { createCollection, addRequest } = useCollectionsStore();
  const openTab = useTabsStore((s) => s.openTab);

  function handleCurlImport() {
    if (!curlInput.trim()) return;
    setCurlError(null);

    try {
      const parsed = parseCurl(curlInput);
      openTab({
        name: `${parsed.method} request`,
        method: parsed.method,
        url: parsed.url,
        headers: parsed.headers,
        body: parsed.body,
        auth: parsed.auth,
      });
      toast.success("cURL imported — opened in new tab");
      router.push("/");
    } catch (err) {
      const msg =
        err instanceof CurlParseError ? err.message : "Failed to parse cURL";
      setCurlError(msg);
    }
  }

  function handleFileUpload(file: File) {
    setImportStatus("processing");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as Record<string, unknown>;

        // Detect format
        if (
          data.info &&
          (data.info as Record<string, unknown>)._postman_schema
        ) {
          // Postman Collection v2.1
          importPostmanCollection(data);
        } else if (data.collections || data.requests) {
          // Requestly format
          importRequestlyCollection(data);
        } else {
          throw new Error(
            "Unrecognized format. Supports Requestly JSON and Postman Collection v2.1",
          );
        }

        setImportStatus("success");
        toast.success(`Imported "${file.name}" successfully`);
      } catch (err) {
        setImportStatus("error");
        toast.error(
          err instanceof Error ? err.message : "Failed to import file",
        );
      }
    };
    reader.readAsText(file);
  }

  function importPostmanCollection(data: Record<string, unknown>) {
    const info = data.info as Record<string, unknown>;
    const collection = createCollection(
      String(info.name ?? "Imported Collection"),
    );
    const items = data.item as Array<Record<string, unknown>>;
    for (const item of items ?? []) {
      const req = item.request as Record<string, unknown> | undefined;
      if (!req) continue;
      const url =
        typeof req.url === "string"
          ? req.url
          : (((req.url as Record<string, unknown>)?.raw as string) ?? "");
      addRequest(collection.id, {
        tabId: crypto.randomUUID(),
        requestId: null,
        name: String(item.name ?? "Request"),
        isDirty: false,
        method: String(req.method ?? "GET") as ReturnType<
          typeof parseCurl
        >["method"],
        url,
        params: [],
        headers: [],
        auth: { type: "none" },
        body: { type: "none", content: "" },
        preScript: "",
        postScript: "",
      });
    }
  }

  function importRequestlyCollection(data: Record<string, unknown>) {
    const collections =
      (data.collections as Array<Record<string, unknown>>) ?? [];
    for (const col of collections) {
      const collection = createCollection(String(col.name ?? "Imported"));
      const requests = (col.requests as Array<Record<string, unknown>>) ?? [];
      for (const req of requests) {
        addRequest(collection.id, {
          tabId: crypto.randomUUID(),
          requestId: null,
          name: String(req.name ?? "Request"),
          isDirty: false,
          method: String(req.method ?? "GET") as ReturnType<
            typeof parseCurl
          >["method"],
          url: String(req.url ?? ""),
          params: [],
          headers: [],
          auth: { type: "none" },
          body: { type: "none", content: "" },
          preScript: "",
          postScript: "",
        });
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Import</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-3">
          <h1 className="text-xl font-semibold">Import API Resources</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Import collections from files or cURL commands
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl p-6">
        <Tabs defaultValue="file">
          <TabsList className="w-full">
            <TabsTrigger value="file" className="flex-1">
              File Upload
            </TabsTrigger>
            <TabsTrigger value="curl" className="flex-1">
              cURL Import
            </TabsTrigger>
            <TabsTrigger value="json" className="flex-1">
              Raw JSON
            </TabsTrigger>
          </TabsList>

          {/* File Upload */}
          <TabsContent value="file" className="mt-4">
            <div
              className={`flex min-h-[180px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                importStatus === "dragging"
                  ? "border-method-accent bg-method-accent/5"
                  : "border-border hover:border-method-accent/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setImportStatus("dragging");
              }}
              onDragLeave={() => setImportStatus("idle")}
              onDrop={(e) => {
                e.preventDefault();
                setImportStatus("idle");
                const file = e.dataTransfer.files[0];
                if (file) handleFileUpload(file);
              }}
            >
              <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Drag and drop files here</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Supports Requestly JSON or Postman Collection v2.1 (Max 50MB)
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>
          </TabsContent>

          {/* cURL Import */}
          <TabsContent value="curl" className="mt-4 space-y-3">
            <Textarea
              className="min-h-[140px] font-mono text-xs"
              placeholder={`curl -X GET 'https://api.example.com/v1/users' \\\n  -H 'Authorization: Bearer TOKEN'`}
              value={curlInput}
              onChange={(e) => {
                setCurlInput(e.target.value);
                setCurlError(null);
              }}
            />
            {curlError && (
              <p className="text-xs text-destructive">{curlError}</p>
            )}
            <Button
              className="gap-2 bg-method-accent/10 text-method-accent hover:bg-method-accent/20"
              onClick={handleCurlImport}
              disabled={!curlInput.trim()}
            >
              Import Command
            </Button>
            <p className="text-xs text-muted-foreground">
              Headers and parameters will be automatically parsed into the
              request fields.
            </p>
          </TabsContent>

          {/* Raw JSON */}
          <TabsContent value="json" className="mt-4 space-y-3">
            <Textarea
              className="min-h-[200px] font-mono text-xs"
              placeholder='{"collections": [{"name": "My API", "requests": [...]}]}'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />
            <Button
              className="gap-2 bg-method-accent/10 text-method-accent hover:bg-method-accent/20"
              onClick={() => {
                try {
                  const data = JSON.parse(jsonInput) as Record<string, unknown>;
                  importRequestlyCollection(data);
                  toast.success("Collection imported");
                  setJsonInput("");
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : "Invalid JSON",
                  );
                }
              }}
              disabled={!jsonInput.trim()}
            >
              Import JSON
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
