import { OPCODES, type OpInfo } from "./evm";

export { run, parseBytecode, OPCODES } from "./evm";
export type { EvmStep, RunResult, OpInfo } from "./evm";

export interface Instruction {
  pc: number;
  op: number;
  name: string;
  push?: string; // 0x-hex immediate for PUSH*
}

/** Turn bytecode into a readable instruction listing (PUSH immediates inlined). */
export function disassemble(code: Uint8Array): Instruction[] {
  const out: Instruction[] = [];
  for (let i = 0; i < code.length; ) {
    const op = code[i];
    const info: OpInfo | undefined = OPCODES[op];
    const name = info?.name ?? `INVALID(0x${op.toString(16).padStart(2, "0")})`;
    if (op >= 0x60 && op <= 0x7f) {
      const n = op - 0x5f;
      const data = code.slice(i + 1, i + 1 + n);
      out.push({
        pc: i,
        op,
        name,
        push: "0x" + [...data].map((b) => b.toString(16).padStart(2, "0")).join(""),
      });
      i += 1 + n;
    } else {
      out.push({ pc: i, op, name });
      i += 1;
    }
  }
  return out;
}
