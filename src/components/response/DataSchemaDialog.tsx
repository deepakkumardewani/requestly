"use client";

import { ChevronDownIcon, Copy, Download, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import { LANGUAGES } from "@/lib/quicktype";
import { useDataSchemaStore } from "@/stores/useDataSchemaStore";

const CodeEditor = dynamic(() => import("@/components/request/CodeEditor"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

type DataSchemaDialogProps = {
  responseBody: string;
};

function LanguagePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (lang: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="w-40 justify-between"
          />
        }
      >
        {value}
        <ChevronDownIcon className="ml-auto h-3.5 w-3.5 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search language..." />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            {LANGUAGES.map((lang) => (
              <CommandItem
                key={lang.label}
                value={lang.label}
                data-checked={value === lang.label}
                onSelect={() => {
                  onChange(lang.label);
                  setOpen(false);
                }}
              >
                {lang.label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function DataSchemaDialog({ responseBody }: DataSchemaDialogProps) {
  const {
    isOpen,
    close,
    language,
    setLanguage,
    generatedCode,
    setGeneratedCode,
    isGenerating,
    setGenerating,
    error,
    setError,
  } = useDataSchemaStore();

  const selectedLang =
    LANGUAGES.find((l) => l.label === language) ?? LANGUAGES[0];

  useEffect(() => {
    if (!isOpen || !responseBody) return;

    setGenerating(true);
    setError(null);

    fetch("/api/schema", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: responseBody,
        language: selectedLang.target,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Generation failed");
        setGeneratedCode(data.code);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setGenerating(false));
  }, [isOpen, language, responseBody]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(generatedCode);
      toast.success("Schema copied");
    } catch {
      toast.error("Failed to copy");
    }
  }

  function handleDownload() {
    const blob = new Blob([generatedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schema.${selectedLang.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className="flex h-[80vh] max-w-4xl sm:max-w-4xl flex-col gap-0 p-0"
        showCloseButton={false}
      >
        <DialogHeader className="flex shrink-0 flex-row items-center gap-2 border-b px-4 py-2.5">
          <DialogTitle className="text-sm font-medium">Data Schema</DialogTitle>
          <div className="ml-auto flex items-center gap-1">
            <LanguagePicker value={language} onChange={setLanguage} />
            <TooltipIconButton
              label="Copy"
              onClick={handleCopy}
              disabled={!generatedCode || isGenerating}
            >
              <Copy className="h-3.5 w-3.5" />
            </TooltipIconButton>
            <TooltipIconButton
              label="Download"
              onClick={handleDownload}
              disabled={!generatedCode || isGenerating}
            >
              <Download className="h-3.5 w-3.5" />
            </TooltipIconButton>
            <DialogClose render={<Button variant="ghost" size="icon-sm" />}>
              <X className="h-3.5 w-3.5" />
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto">
          {isGenerating && (
            <div className="flex flex-col gap-2 p-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
          )}
          {!isGenerating && error && (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}
          {!isGenerating && !error && generatedCode && (
            <CodeEditor
              value={generatedCode}
              language={selectedLang.cmLang}
              readOnly
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
