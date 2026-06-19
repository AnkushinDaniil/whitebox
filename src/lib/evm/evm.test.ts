import { describe, expect, it } from "vitest";
import { run, parseBytecode, disassemble } from "./index";

function exec(hex: string, gas = 100000) {
  return run(parseBytecode(hex), gas);
}
const last = (r: ReturnType<typeof run>) => r.steps[r.steps.length - 1];

describe("arithmetic", () => {
  it("(2 + 3) * 4 = 20, left on the stack", () => {
    // PUSH1 2 PUSH1 3 ADD PUSH1 4 MUL
    const r = exec("0x6002600301600402");
    expect(last(r).stack).toEqual(["0x14"]); // 20
    expect(r.error).toBeNull();
  });

  it("SUB is top - next; 7 - 2 = 5", () => {
    // PUSH1 2 PUSH1 7 SUB  → stack: top=7, next=2 → 7-2
    const r = exec("0x6002600703");
    expect(last(r).stack).toEqual(["0x5"]);
  });

  it("EXP: 2 ** 8 = 256", () => {
    // PUSH1 8 PUSH1 2 EXP → top=2, exp=8 → 2**8
    const r = exec("0x600860020a");
    expect(last(r).stack).toEqual(["0x100"]);
  });

  it("DIV by zero yields zero (EVM convention)", () => {
    const r = exec("0x6000600304"); // 3 / 0
    expect(last(r).stack).toEqual(["0x0"]);
  });
});

describe("storage", () => {
  it("SSTORE then SLOAD round-trips a value", () => {
    // PUSH1 0x2a PUSH1 0x00 SSTORE  PUSH1 0x00 SLOAD
    const r = exec("0x602a600055600054");
    expect(last(r).stack).toEqual(["0x2a"]);
    expect(last(r).storage).toEqual([["0x0", "0x2a"]]);
  });
});

describe("memory + return", () => {
  it("MSTORE then RETURN returns the 32-byte word", () => {
    // PUSH1 0x42  PUSH1 0x00  MSTORE  PUSH1 0x20  PUSH1 0x00  RETURN
    const r = exec("0x604260005260206000f3");
    expect(r.returnValue).toBe("0x42");
  });

  it("MSTORE charges memory-expansion gas", () => {
    // expanding to 1 word (32 bytes) costs 3 gas on top of MSTORE's base 3
    const r = exec("0x6042600052");
    expect(r.gasUsed).toBe(3 + 3 + (3 + 3)); // PUSH + PUSH + (MSTORE base 3 + expand 3)
  });
});

describe("control flow", () => {
  it("JUMPI with a true condition skips the PUSH1 0xff", () => {
    // pc0 PUSH1 1 · pc2 PUSH1 7 · pc4 JUMPI · pc5 PUSH1 0xff (skipped) · pc7 JUMPDEST · pc8 PUSH1 7
    const r = exec("0x600160075760ff5b6007");
    expect(last(r).stack.includes("0xff")).toBe(false);
    expect(last(r).stack).toEqual(["0x7"]);
    expect(r.error).toBeNull();
  });

  it("rejects a jump to a non-JUMPDEST", () => {
    // PUSH1 0x03 JUMP (pc 3 is a STOP byte, not a JUMPDEST)
    const r = exec("0x6003560000");
    expect(r.error).toBe("invalid jump destination");
  });

  it("a countdown loop decrements storage from 3 to 0 (widget preset)", () => {
    const r = exec("0x60036000555b60005415601a57600054600190036000556005565b00");
    expect(r.error).toBeNull();
    expect(last(r).storage).toEqual([["0x0", "0x0"]]);
    expect(last(r).halted).toBe(true);
  });

  it("JUMPI that doesn't take the branch falls through and halts", () => {
    // JUMPDEST PUSH1 0 PUSH1 0 JUMPI (cond 0 → no jump) → run off the end
    const r = exec("0x5b6000600057");
    expect(r.error).toBeNull();
    expect(last(r).halted).toBe(true);
  });
});

describe("gas", () => {
  it("charges per-opcode gas and reports total used", () => {
    const r = exec("0x6002600301"); // PUSH1 PUSH1 ADD = 3+3+3
    expect(r.gasUsed).toBe(9);
  });

  it("halts with out-of-gas when the limit is too low", () => {
    const r = exec("0x6002600301", 5); // only 5 gas, needs 9
    expect(r.error).toBe("out of gas");
  });

  it("SSTORE is expensive (20000)", () => {
    const r = exec("0x602a600055"); // PUSH PUSH SSTORE
    expect(r.gasUsed).toBe(3 + 3 + 20000);
  });
});

describe("stack safety", () => {
  it("detects stack underflow", () => {
    const r = exec("0x01"); // ADD with empty stack
    expect(r.error).toBe("stack underflow");
  });
});

describe("disassemble", () => {
  it("inlines PUSH immediates", () => {
    const d = disassemble(parseBytecode("0x6002600301"));
    expect(d.map((i) => i.name)).toEqual(["PUSH1", "PUSH1", "ADD"]);
    expect(d[0].push).toBe("0x02");
  });
});
