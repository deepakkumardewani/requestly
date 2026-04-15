"use client";

import { useMemo } from "react";

type FormattedJsonResponseBodyProps = {
  body: string;
};

/** Pretty-prints JSON when valid; otherwise shows the raw body string. */
export function FormattedJsonResponseBody({
  body,
}: FormattedJsonResponseBodyProps) {
  const text = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }, [body]);

  return <pre className="text-foreground whitespace-pre-wrap">{text}</pre>;
}
