import { Compartment, EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";

/**
 * Documents the CodeEditor placeholder strategy (Task 3): update placeholder via
 * Compartment.reconfigure so EditorView is not destroyed when placeholder text changes.
 */
describe("CodeMirror placeholder Compartment pattern", () => {
  it("updates extensions in place while preserving document text", () => {
    const slot = new Compartment();
    let state = EditorState.create({
      doc: "hello",
      extensions: [slot.of([])],
    });
    expect(state.doc.toString()).toBe("hello");

    state = state.update({ effects: slot.reconfigure([]) }).state;
    expect(state.doc.toString()).toBe("hello");
  });
});
