import { describe, expect, it } from "vitest";
import { decryptPayload, encryptPayload } from "./crypto";

describe("encryptPayload / decryptPayload", () => {
  it("round-trips the original string", async () => {
    const plain = 'hello 世界 { "json": true }';
    const { ciphertext, iv, keyB64 } = await encryptPayload(plain);
    const out = await decryptPayload(ciphertext, iv, keyB64);
    expect(out).toBe(plain);
  });

  it("produces different ciphertext and IV for the same plaintext on each call", async () => {
    const plain = "same";
    const a = await encryptPayload(plain);
    const b = await encryptPayload(plain);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
  });

  it("rejects decryption with a wrong key", async () => {
    const { ciphertext, iv } = await encryptPayload("secret");
    const wrongKeyB64 = btoa(String.fromCharCode(...new Array(32).fill(0)));
    await expect(decryptPayload(ciphertext, iv, wrongKeyB64)).rejects.toThrow();
  });

  it("rejects decryption when ciphertext is corrupted", async () => {
    const { ciphertext, iv, keyB64 } = await encryptPayload("x");
    const bytes = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
    if (bytes.length < 1) {
      throw new Error("expected non-empty ciphertext");
    }
    bytes[0] = bytes[0] ^ 0xff;
    const mangled = btoa(String.fromCharCode(...bytes));
    await expect(decryptPayload(mangled, iv, keyB64)).rejects.toThrow();
  });
});
