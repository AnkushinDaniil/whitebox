import { describe, expect, it } from "vitest";
import {
  hashMessage as viemHashMessage,
  recoverMessageAddress,
  verifyMessage,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  addressOf,
  personalHash,
  publicKey,
  signMessage,
  recoverMessageSigner,
} from "./sig";
import { hexToBytes, bytesToHex } from "@/lib/mpt/bytes";

const PRIV = "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318";
const priv = hexToBytes(PRIV);
const account = privateKeyToAccount(PRIV);

function sigToHex(sig: { r: bigint; s: bigint; yParity: number }): `0x${string}` {
  const r = sig.r.toString(16).padStart(64, "0");
  const s = sig.s.toString(16).padStart(64, "0");
  const v = (27 + sig.yParity).toString(16).padStart(2, "0");
  return ("0x" + r + s + v) as `0x${string}`;
}

describe("keypair → address", () => {
  it("priv=1 → canonical vector address", () => {
    expect(addressOf(hexToBytes("0x" + "00".repeat(31) + "01"))).toBe(
      "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf",
    );
  });
  it("address matches viem for a real key", () => {
    expect(addressOf(priv)).toBe(account.address.toLowerCase());
  });
  it("public key is uncompressed (65 bytes, 0x04 prefix)", () => {
    const pub = publicKey(priv);
    expect(pub.length).toBe(65);
    expect(pub[0]).toBe(0x04);
  });
});

describe("EIP-191 message hashing — vs viem", () => {
  for (const m of ["gm", "I authorize this", "🦄 unicode ✓", ""]) {
    it(`hashMessage("${m}") matches viem`, () => {
      expect(bytesToHex(personalHash(m))).toBe(viemHashMessage(m));
    });
  }
});

describe("sign → recover (signatures, not encryption)", () => {
  it("recovers the signer address from the signature alone", () => {
    const { sig } = signMessage("transfer 1 ETH to alice", priv);
    expect(recoverMessageSigner("transfer 1 ETH to alice", sig)).toBe(
      account.address.toLowerCase(),
    );
  });

  it("viem verifies our signature", async () => {
    const message = "the signature is the authorization";
    const { sig } = signMessage(message, priv);
    const ok = await verifyMessage({
      address: account.address,
      message,
      signature: sigToHex(sig),
    });
    expect(ok).toBe(true);
  });

  it("viem recovers the same address we sign as", async () => {
    const message = "hello whitebox";
    const { sig } = signMessage(message, priv);
    const recovered = await recoverMessageAddress({ message, signature: sigToHex(sig) });
    expect(recovered.toLowerCase()).toBe(addressOf(priv));
  });

  it("tampering the message recovers a different signer", () => {
    const { sig } = signMessage("send 1 ETH", priv);
    expect(recoverMessageSigner("send 100 ETH", sig)).not.toBe(account.address.toLowerCase());
  });
});
