"use client";

import {
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "@/lib/constants";
import {
  fetchGraphQLSchema,
  formatTypeRef,
  type IntrospectionArg,
  type IntrospectionField,
  type IntrospectionFullType,
  type IntrospectionTypeRef,
  type ParsedSchema,
} from "@/lib/graphqlIntrospection";
import type { KVPair } from "@/types";

type GraphQLSchemaExplorerProps = {
  url: string;
  headers: KVPair[];
  sslVerify: boolean;
  followRedirects: boolean;
  onFieldSnippet: (snippet: string) => void;
};

type SchemaSection = {
  title: string;
  fields: IntrospectionField[];
};

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; schema: ParsedSchema };

/** Unwraps NON_NULL/LIST wrappers to get the named type name. */
function getNamedTypeName(ref: IntrospectionTypeRef | null): string | null {
  if (!ref) return null;
  if (ref.name) return ref.name;
  return getNamedTypeName(ref.ofType);
}

/** Returns a placeholder literal for a required arg based on its scalar type. */
function argPlaceholder(arg: IntrospectionArg): string {
  const typeName = getNamedTypeName(arg.type);
  switch (typeName) {
    case "Int":
    case "Float":
      return "0";
    case "Boolean":
      return "false";
    default:
      return '""';
  }
}

/**
 * Builds the argument string for a field, including only args that are
 * required (NON_NULL with no default). Optional args are omitted so the
 * generated query is minimal but valid.
 */
function buildArgsString(args: IntrospectionArg[]): string {
  const required = args.filter(
    (a) => a.type.kind === "NON_NULL" && a.defaultValue === null,
  );
  if (required.length === 0) return "";
  const pairs = required.map((a) => `${a.name}: ${argPlaceholder(a)}`);
  return `(${pairs.join(", ")})`;
}

/**
 * Builds a query snippet for a field.
 * - Scalar/enum fields → `fieldName`
 * - Object fields → includes all scalar subfields AND nested object subfields
 *   (each nested object gets its own scalar selection; stops at depth 2 to
 *   avoid runaway nesting for circular/recursive schemas)
 */
function buildFieldSnippet(
  field: IntrospectionField,
  allTypes: IntrospectionFullType[],
): string {
  const argsStr = buildArgsString(field.args ?? []);
  const namedTypeName = getNamedTypeName(field.type);
  if (!namedTypeName) return `${field.name}${argsStr}`;

  const resolvedType = allTypes.find((t) => t.name === namedTypeName);
  if (
    !resolvedType ||
    resolvedType.kind === "SCALAR" ||
    resolvedType.kind === "ENUM"
  ) {
    return `${field.name}${argsStr}`;
  }

  const subLines = buildSubfieldLines(
    resolvedType,
    allTypes,
    "  ",
    new Set([namedTypeName]),
  );

  if (subLines.length === 0) {
    return `${field.name}${argsStr} { }`;
  }

  return `${field.name}${argsStr} {\n${subLines.join("\n")}\n}`;
}

/**
 * Recursively builds subfield lines for an object type.
 * - Scalar/enum fields → single line with indent
 * - Object fields → nested block with one more level of indent
 * - `seen` prevents infinite recursion for self-referential types
 */
function buildSubfieldLines(
  type: IntrospectionFullType,
  allTypes: IntrospectionFullType[],
  indent: string,
  seen: Set<string>,
): string[] {
  const lines: string[] = [];

  for (const f of type.fields ?? []) {
    const subTypeName = getNamedTypeName(f.type);
    if (!subTypeName) continue;

    const subType = allTypes.find((t) => t.name === subTypeName);
    if (!subType) continue;

    if (subType.kind === "SCALAR" || subType.kind === "ENUM") {
      lines.push(`${indent}${f.name}`);
    } else if (subType.kind === "OBJECT" && !seen.has(subTypeName)) {
      const nestedIndent = `${indent}  `;
      const nestedSeen = new Set([...seen, subTypeName]);
      const nestedLines = buildSubfieldLines(
        subType,
        allTypes,
        nestedIndent,
        nestedSeen,
      );
      if (nestedLines.length > 0) {
        lines.push(`${indent}${f.name} {`);
        lines.push(...nestedLines);
        lines.push(`${indent}}`);
      }
    }
  }

  return lines;
}

function FieldRow({
  field,
  allTypes,
  onFieldClick,
}: {
  field: IntrospectionField;
  allTypes: IntrospectionFullType[];
  onFieldClick: (snippet: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onFieldClick(buildFieldSnippet(field, allTypes))}
      title={field.description ?? field.name}
      className="group flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-xs hover:bg-muted/60 transition-colors"
    >
      <span className="font-mono text-foreground group-hover:text-theme-accent transition-colors">
        {field.name}
      </span>
      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
        {formatTypeRef(field.type)}
      </span>
    </button>
  );
}

function TypeSection({
  title,
  fields,
  allTypes,
  onFieldClick,
  searchTerm,
}: {
  title: string;
  fields: IntrospectionField[];
  allTypes: IntrospectionFullType[];
  onFieldClick: (snippet: string) => void;
  searchTerm: string;
}) {
  const [open, setOpen] = useState(true);

  const filtered = searchTerm
    ? fields.filter((f) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : fields;

  if (filtered.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1 px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0" />
        )}
        {title}
        <span className="ml-auto font-mono text-[10px] font-normal">
          {filtered.length}
        </span>
      </button>
      {open && (
        <div className="pb-2 pl-1">
          {filtered.map((field) => (
            <FieldRow
              key={field.name}
              field={field}
              allTypes={allTypes}
              onFieldClick={onFieldClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OtherTypeRow({
  type,
  searchTerm,
}: {
  type: IntrospectionFullType;
  searchTerm: string;
}) {
  const [open, setOpen] = useState(false);

  if (!type.fields || type.fields.length === 0) return null;

  const filtered = searchTerm
    ? type.fields.filter(
        (f) =>
          f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          type.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : type.fields;

  if (filtered.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-xs hover:bg-muted/40 transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        <span className="font-mono font-medium text-foreground">
          {type.name}
        </span>
      </button>
      {open && (
        <div className="pl-3">
          {filtered.map((field) => (
            <div
              key={field.name}
              className="flex w-full items-center justify-between gap-2 px-2 py-1 text-xs"
              title={field.description ?? field.name}
            >
              <span className="font-mono text-muted-foreground">
                {field.name}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground/60">
                {formatTypeRef(field.type)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GraphQLSchemaExplorer({
  url,
  headers,
  sslVerify,
  followRedirects,
  onFieldSnippet,
}: GraphQLSchemaExplorerProps) {
  const [fetchState, setFetchState] = useState<FetchState>({ status: "idle" });
  const [searchTerm, setSearchTerm] = useState("");

  async function handleFetchSchema() {
    if (!url.trim()) {
      toast.warning("Enter a GraphQL endpoint URL first");
      return;
    }

    setFetchState({ status: "loading" });
    try {
      const schema = await fetchGraphQLSchema({
        url,
        headers,
        sslVerify,
        followRedirects,
        timeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
      });
      setFetchState({ status: "success", schema });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : ((err as { message?: string })?.message ??
            "Failed to fetch schema");
      setFetchState({ status: "error", message });
      toast.error("Schema fetch failed", { description: message });
    }
  }

  function buildSections(schema: ParsedSchema): SchemaSection[] {
    const sections: SchemaSection[] = [];

    const queryType = schema.types.find(
      (t) => t.name === schema.queryTypeName && t.fields,
    );
    if (queryType?.fields) {
      sections.push({ title: "Queries", fields: queryType.fields });
    }

    const mutationType = schema.types.find(
      (t) => t.name === schema.mutationTypeName && t.fields,
    );
    if (mutationType?.fields) {
      sections.push({ title: "Mutations", fields: mutationType.fields });
    }

    const subscriptionType = schema.types.find(
      (t) => t.name === schema.subscriptionTypeName && t.fields,
    );
    if (subscriptionType?.fields) {
      sections.push({
        title: "Subscriptions",
        fields: subscriptionType.fields,
      });
    }

    return sections;
  }

  function getOtherTypes(schema: ParsedSchema): IntrospectionFullType[] {
    const rootNames = new Set(
      [
        schema.queryTypeName,
        schema.mutationTypeName,
        schema.subscriptionTypeName,
      ].filter(Boolean),
    );

    return schema.types.filter(
      (t) => !rootNames.has(t.name) && t.kind === "OBJECT" && t.fields?.length,
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-2 py-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Schema
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1.5 text-[11px]"
          onClick={handleFetchSchema}
          disabled={fetchState.status === "loading"}
          data-testid="fetch-schema-btn"
        >
          {fetchState.status === "loading" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          {fetchState.status === "loading" ? "Fetching…" : "Fetch Schema"}
        </Button>
      </div>

      {/* Search */}
      {fetchState.status === "success" && (
        <div className="relative border-b px-2 py-1.5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search fields…"
            className="h-6 pl-7 text-xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-1">
        {fetchState.status === "idle" && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <p className="text-xs text-muted-foreground">
              Click "Fetch Schema" to explore
            </p>
            <p className="text-[11px] text-muted-foreground/60">
              Requires the endpoint to support introspection
            </p>
          </div>
        )}

        {fetchState.status === "loading" && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {fetchState.status === "error" && (
          <div className="px-3 py-4">
            <p className="text-xs text-destructive">{fetchState.message}</p>
          </div>
        )}

        {fetchState.status === "success" &&
          (() => {
            const sections = buildSections(fetchState.schema);
            const otherTypes = getOtherTypes(fetchState.schema);
            return (
              <div className="space-y-1">
                {sections.map((section) => (
                  <TypeSection
                    key={section.title}
                    title={section.title}
                    fields={section.fields}
                    allTypes={fetchState.schema.types}
                    onFieldClick={onFieldSnippet}
                    searchTerm={searchTerm}
                  />
                ))}
                {otherTypes.length > 0 && (
                  <div>
                    <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Types
                    </div>
                    {otherTypes.map((type) => (
                      <OtherTypeRow
                        key={type.name}
                        type={type}
                        searchTerm={searchTerm}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
      </div>

      {fetchState.status === "success" && (
        <p className="border-t px-2 py-1 text-[10px] text-muted-foreground">
          Click a field to append it to the query editor
        </p>
      )}
    </div>
  );
}
