"use client";

import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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

type EnvVariableTableProps = {
  env: EnvironmentModel;
};

export function EnvVariableTable({ env }: EnvVariableTableProps) {
  const t = useTranslations("environment");
  const { updateEnv } = useEnvironmentsStore();
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());

  function toggleSecretVisibility(varId: string) {
    setVisibleSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(varId)) next.delete(varId);
      else next.add(varId);
      return next;
    });
  }

  function updateVariable(varId: string, patch: Partial<EnvVariable>) {
    updateEnv(env.id, {
      variables: env.variables.map((v) =>
        v.id === varId ? { ...v, ...patch } : v,
      ),
    });
  }

  function addVariable() {
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

  function deleteVariable(varId: string) {
    updateEnv(env.id, {
      variables: env.variables.filter((v) => v.id !== varId),
    });
    setVisibleSecrets((prev) => {
      const next = new Set(prev);
      next.delete(varId);
      return next;
    });
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto p-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 text-xs">{t("variable")}</TableHead>
              <TableHead className="h-8 text-xs">{t("initialValue")}</TableHead>
              <TableHead className="h-8 text-xs">{t("currentValue")}</TableHead>
              <TableHead className="h-8 w-20 text-center text-xs">
                {t("secret")}
              </TableHead>
              <TableHead className="h-8 w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {env.variables.map((variable) => {
              const masked =
                variable.isSecret && !visibleSecrets.has(variable.id);
              return (
                <TableRow key={variable.id} data-testid="var-row">
                  <TableCell className="py-1">
                    <Input
                      data-testid="var-key-input"
                      className="h-7 border-0 bg-transparent font-mono text-xs shadow-none"
                      value={variable.key}
                      placeholder={t("variableNamePlaceholder")}
                      onChange={(e) =>
                        updateVariable(variable.id, { key: e.target.value })
                      }
                    />
                  </TableCell>
                  <TableCell className="py-1">
                    <Input
                      data-testid="var-initial-value-input"
                      className="h-7 border-0 bg-transparent font-mono text-xs shadow-none"
                      type={masked ? "password" : "text"}
                      value={variable.initialValue}
                      placeholder={t("initialValuePlaceholder")}
                      onChange={(e) =>
                        updateVariable(variable.id, {
                          initialValue: e.target.value,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="py-1">
                    <Input
                      data-testid="var-current-value-input"
                      className="h-7 border-0 bg-transparent font-mono text-xs shadow-none"
                      type={masked ? "password" : "text"}
                      value={variable.currentValue}
                      placeholder={t("currentValuePlaceholder")}
                      onChange={(e) =>
                        updateVariable(variable.id, {
                          currentValue: e.target.value,
                        })
                      }
                    />
                  </TableCell>

                  {/* Secret column: checkbox to mark as secret + eye to reveal */}
                  <TableCell className="py-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <Checkbox
                        data-testid="var-secret-checkbox"
                        checked={variable.isSecret}
                        onCheckedChange={(checked) => {
                          updateVariable(variable.id, {
                            isSecret: checked === true,
                          });
                          if (!checked) {
                            setVisibleSecrets((prev) => {
                              const next = new Set(prev);
                              next.delete(variable.id);
                              return next;
                            });
                          }
                        }}
                      />
                      {variable.isSecret && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          data-testid="var-secret-toggle"
                          onClick={() => toggleSecretVisibility(variable.id)}
                        >
                          {visibleSecrets.has(variable.id) ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      data-testid="var-delete-btn"
                      onClick={() => deleteVariable(variable.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Button
        variant="outline"
        size="sm"
        data-testid="add-variable-btn"
        className="mt-3 w-full border-dashed text-xs text-muted-foreground"
        onClick={addVariable}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        {t("addVariable")}
      </Button>

      <div className="mt-4 rounded-md bg-muted/50 p-3">
        <p className="text-xs font-medium">{t("about")}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {t.rich("aboutDescription", {
            token: () => (
              <code className="rounded bg-muted px-1 text-method-accent">
                {"{{VARIABLE_NAME}}"}
              </code>
            ),
          })}
        </p>
      </div>
    </div>
  );
}
