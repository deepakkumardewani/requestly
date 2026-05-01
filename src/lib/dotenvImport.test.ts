import { describe, expect, it } from "vitest";
import { parseDotEnvContent } from "./dotenvImport";

describe("parseDotEnvContent", () => {
  it("parses KEY=VALUE and skips blanks and comments", () => {
    const raw = `
# comment
FOO=bar

BAZ=qux
`;
    expect(parseDotEnvContent(raw)).toEqual([
      { key: "FOO", value: "bar" },
      { key: "BAZ", value: "qux" },
    ]);
  });

  it("later duplicate key wins", () => {
    expect(
      parseDotEnvContent(`A=1
A=2`),
    ).toEqual([{ key: "A", value: "2" }]);
  });

  it("strips matching quotes", () => {
    expect(parseDotEnvContent(`X="hello"`)).toEqual([
      { key: "X", value: "hello" },
    ]);
  });
});
