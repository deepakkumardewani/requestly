"use client";

import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateId } from "@/lib/utils";
import { useEnvironmentsStore } from "@/stores/useEnvironmentsStore";
import type { EnvironmentModel, EnvVariable } from "@/types";

export function EnvEditorPage() {
  const {
    environments,
    activeEnvId,
    createEnv,
    updateEnv,
    deleteEnv,
    setActiveEnv,
  } = useEnvironmentsStore();

  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());

  const activeEnv =
    environments.find((e) => e.id === activeEnvId) ?? environments[0];

  function toggleSecretVisibility(varId: string) {
    setVisibleSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(varId)) next.delete(varId);
      else next.add(varId);
      return next;
    });
  }

  function updateVariable(
    env: EnvironmentModel,
    varId: string,
    patch: Partial<EnvVariable>,
  ) {
    updateEnv(env.id, {
      variables: env.variables.map((v) =>
        v.id === varId ? { ...v, ...patch } : v,
      ),
    });
  }

  function addVariable(env: EnvironmentModel) {
    updateEnv(env.id, {
      variables: [
        ...env.variables,
        {
          id: generateId(),
          key: "",
          initialValue: "",
          currentValue: "",
          isSecret: false,
        },
      ],
    });
  }

  function deleteVariable(env: EnvironmentModel, varId: string) {
    updateEnv(env.id, {
      variables: env.variables.filter((v) => v.id !== varId),
    });
  }

  if (environments.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">No environments yet</p>
        <Button onClick={() => createEnv("New Environment")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Environment
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Environments</BreadcrumbPage>
            </BreadcrumbItem>
            {activeEnv && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{activeEnv.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Environments</h1>
          <Button
            size="sm"
            onClick={() => {
              const env = createEnv("New Environment");
              setActiveEnv(env.id);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Environment
          </Button>
        </div>

        {/* Environment tabs */}
        <div className="mt-3 flex gap-2">
          {environments.map((env) => (
            <button
              key={env.id}
              type="button"
              onClick={() => setActiveEnv(env.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeEnv?.id === env.id
                  ? "bg-method-accent/20 text-method-accent ring-1 ring-method-accent/30"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {env.name}
            </button>
          ))}
        </div>
      </div>

      {/* Variable editor */}
      {activeEnv && (
        <div className="flex flex-1 flex-col overflow-auto p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">{activeEnv.name} Variables</h2>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                deleteEnv(activeEnv.id);
                toast.success(`Environment "${activeEnv.name}" deleted`);
              }}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete Environment
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 text-xs">Variable Name</TableHead>
                  <TableHead className="h-8 text-xs">Initial Value</TableHead>
                  <TableHead className="h-8 text-xs">Current Value</TableHead>
                  <TableHead className="h-8 w-20 text-xs">Secret</TableHead>
                  <TableHead className="h-8 w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeEnv.variables.map((variable) => (
                  <TableRow key={variable.id}>
                    <TableCell className="py-1">
                      <Input
                        className="h-7 border-0 bg-transparent font-mono text-xs shadow-none"
                        value={variable.key}
                        placeholder="VARIABLE_NAME"
                        onChange={(e) =>
                          updateVariable(activeEnv, variable.id, {
                            key: e.target.value,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="py-1">
                      <Input
                        className="h-7 border-0 bg-transparent font-mono text-xs shadow-none"
                        type={
                          variable.isSecret && !visibleSecrets.has(variable.id)
                            ? "password"
                            : "text"
                        }
                        value={variable.initialValue}
                        placeholder="Initial value"
                        onChange={(e) =>
                          updateVariable(activeEnv, variable.id, {
                            initialValue: e.target.value,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="py-1">
                      <Input
                        className="h-7 border-0 bg-transparent font-mono text-xs shadow-none"
                        type={
                          variable.isSecret && !visibleSecrets.has(variable.id)
                            ? "password"
                            : "text"
                        }
                        value={variable.currentValue}
                        placeholder="Current value"
                        onChange={(e) =>
                          updateVariable(activeEnv, variable.id, {
                            currentValue: e.target.value,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="py-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => toggleSecretVisibility(variable.id)}
                      >
                        {variable.isSecret &&
                        !visibleSecrets.has(variable.id) ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="py-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => deleteVariable(activeEnv, variable.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full border-dashed text-xs text-muted-foreground"
            onClick={() => addVariable(activeEnv)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Variable
          </Button>

          <div className="mt-4 rounded-md bg-muted/50 p-3">
            <p className="text-xs font-medium">About Environment Variables</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Use{" "}
              <code className="rounded bg-muted px-1 text-method-accent">
                {"{{VARIABLE_NAME}}"}
              </code>{" "}
              in your requests to substitute values from the active environment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
