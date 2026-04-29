/** @vitest-environment happy-dom */

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CodeEditor from "./CodeEditor";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

afterEach(() => {
  cleanup();
});

describe("CodeEditor", () => {
  it("renders editor container", async () => {
    const { container } = render(
      <CodeEditor value={"hello"} language="text" />,
    );

    expect(container.querySelector('[data-testid="code-editor"]')).toBeTruthy();

    await waitFor(
      () => {
        expect(container.querySelector(".cm-content")).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });

  it("reflects value prop in document after mount", async () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <CodeEditor value="first" language="text" onChange={onChange} />,
    );

    await waitFor(
      () => {
        expect(container.querySelector(".cm-content")?.textContent).toBe(
          "first",
        );
      },
      { timeout: 5000 },
    );

    rerender(<CodeEditor value="second" language="text" onChange={onChange} />);

    await waitFor(
      () => {
        expect(container.querySelector(".cm-content")?.textContent).toBe(
          "second",
        );
      },
      { timeout: 5000 },
    );
  });

  it("fires onChange when pasting valid JSON with jsonAutoFormatOnPaste", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <CodeEditor
        value=""
        language="json"
        onChange={onChange}
        jsonAutoFormatOnPaste
      />,
    );

    await waitFor(
      () => {
        expect(container.querySelector(".cm-content")).toBeInstanceOf(
          HTMLElement,
        );
      },
      { timeout: 5000 },
    );
    const cmContent = container.querySelector(".cm-content") as HTMLElement;

    fireEvent.paste(cmContent, {
      clipboardData: {
        getData: (fmt: string) => (fmt === "text/plain" ? '{"a":1}' : ""),
      },
    } as unknown as ClipboardEvent);

    await waitFor(
      () => {
        expect(onChange).toHaveBeenCalled();
        const last = onChange.mock.calls.at(-1)?.[0] as string;
        expect(last).toContain('"a"');
        expect(last).toContain("1");
      },
      { timeout: 3000 },
    );
  });

  it("recreates editor when language changes", async () => {
    const { container, rerender } = render(
      <CodeEditor value="{}" language="json" />,
    );

    await waitFor(
      () => expect(container.querySelector(".cm-content")).toBeTruthy(),
      { timeout: 5000 },
    );

    rerender(<CodeEditor value="// x" language="javascript" />);

    await waitFor(
      () => {
        expect(container.querySelector(".cm-content")?.textContent).toContain(
          "// x",
        );
      },
      { timeout: 5000 },
    );
  });
});
