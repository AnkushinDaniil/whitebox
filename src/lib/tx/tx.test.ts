import { describe, expect, it } from "vitest";
import {
  serializeTransaction,
  keccak256 as viemKeccak,
  type TransactionSerializableEIP1559,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  type TxFields,
  intToBytes,
  signingHash,
  signTx,
  txHash,
  privateKeyToAddress,
  recoverSender,
} from "./tx";
import { hexToBytes, bytesToHex, utf8ToBytes } from "@/lib/mpt/bytes";

function toHex32(n: bigint): `0x${string}` {
  return ("0x" + n.toString(16).padStart(64, "0")) as `0x${string}`;
}

/** Build matching field sets for our signer and for viem. */
function fixtures() {
  const priv = "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318";
  const account = privateKeyToAccount(priv);

  const cases: { name: string; ours: TxFields; viem: TransactionSerializableEIP1559 }[] = [
    {
      name: "simple ETH transfer",
      ours: {
        chainId: 1n,
        nonce: 0n,
        maxPriorityFeePerGas: 1_000_000_000n,
        maxFeePerGas: 30_000_000_000n,
        gasLimit: 21000n,
        to: hexToBytes("0x70997970C51812dc3A010C7d01b50e0d17dc79C8"),
        value: 1_000_000_000_000_000_000n, // 1 ETH
        data: new Uint8Array(0),
      },
      viem: {
        type: "eip1559",
        chainId: 1,
        nonce: 0,
        maxPriorityFeePerGas: 1_000_000_000n,
        maxFeePerGas: 30_000_000_000n,
        gas: 21000n,
        to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        value: 1_000_000_000_000_000_000n,
      },
    },
    {
      name: "high nonce + calldata",
      ours: {
        chainId: 1n,
        nonce: 42n,
        maxPriorityFeePerGas: 2_000_000_000n,
        maxFeePerGas: 50_000_000_000n,
        gasLimit: 90000n,
        to: hexToBytes("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"),
        value: 0n,
        data: utf8ToBytes("gm"),
      },
      viem: {
        type: "eip1559",
        chainId: 1,
        nonce: 42,
        maxPriorityFeePerGas: 2_000_000_000n,
        maxFeePerGas: 50_000_000_000n,
        gas: 90000n,
        to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        value: 0n,
        data: bytesToHex(utf8ToBytes("gm")) as `0x${string}`,
      },
    },
  ];
  return { priv, account, cases };
}

describe("address derivation", () => {
  it("priv=1 yields the canonical vector address", () => {
    const one = hexToBytes("0x" + "00".repeat(31) + "01");
    expect(privateKeyToAddress(one)).toBe("0x7e5f4552091a69125d5dfcb7b8c2659029395bdf");
  });
});

describe("intToBytes", () => {
  it("encodes zero as empty", () => {
    expect(intToBytes(0n).length).toBe(0);
  });
  it("is minimal big-endian", () => {
    expect(bytesToHex(intToBytes(0x0102n))).toBe("0x0102");
    expect(bytesToHex(intToBytes(255n))).toBe("0xff");
  });
});

describe("EIP-1559 signing — differential vs viem", () => {
  const { priv, account, cases } = fixtures();
  const privBytes = hexToBytes(priv);

  for (const c of cases) {
    it(`${c.name}: signing hash matches viem`, () => {
      const expected = viemKeccak(serializeTransaction(c.viem));
      expect(bytesToHex(signingHash(c.ours))).toBe(expected);
    });

    it(`${c.name}: tx hash matches viem`, () => {
      const sig = signTx(c.ours, privBytes);
      const expected = viemKeccak(
        serializeTransaction(c.viem, {
          r: toHex32(sig.r),
          s: toHex32(sig.s),
          yParity: sig.yParity,
        }),
      );
      expect(txHash(c.ours, sig)).toBe(expected);
    });

    it(`${c.name}: sender is recovered from the signature`, () => {
      const sig = signTx(c.ours, privBytes);
      expect(recoverSender(signingHash(c.ours), sig)).toBe(account.address.toLowerCase());
    });
  }

  it("tampering after signing recovers a different (wrong) sender", () => {
    const c = cases[0];
    const sig = signTx(c.ours, privBytes);
    const tampered = { ...c.ours, value: c.ours.value + 1n }; // change 1 wei
    const recovered = recoverSender(signingHash(tampered), sig);
    expect(recovered).not.toBe(account.address.toLowerCase());
  });
});
