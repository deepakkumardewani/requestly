"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SecretInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange"
> & {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** When true, value starts visible (default: hidden). */
  defaultVisible?: boolean;
  toggleTestId?: string;
};

export function SecretInput({
  value,
  onChange,
  className,
  defaultVisible = false,
  toggleTestId,
  ...props
}: SecretInputProps) {
  const [visible, setVisible] = useState(defaultVisible);
  const masked = !visible;

  return (
    <div className="relative">
      <Input
        {...props}
        type={masked ? "password" : "text"}
        className={cn("pr-8", className)}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        data-testid={toggleTestId}
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-1 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground"
        title={masked ? "Show value" : "Hide value"}
      >
        {masked ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
