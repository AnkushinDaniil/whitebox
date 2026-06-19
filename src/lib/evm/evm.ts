/**
 * A faithful subset of the Ethereum Virtual Machine: a 256-bit stack machine
 * with gas metering, expandable memory, persistent storage, and validated
 * jumps. It executes real bytecode and records the full machine state at every
 * step, so the visualizer can scrub the execution instruction by instruction.
 *
 * Scope: the core arithmetic/stack/memory/storage/control opcodes. Omitted for
 * the teaching model: external calls, signed ops, and the cold/warm (EIP-2929)
 * and refund nuances of SLOAD/SSTORE gas — those use simplified flat costs here
 * (called out in the UI).
 */

const N = 1n << 256n;
const u256 = (x: bigint): bigint => ((x % N) + N) % N;

function expmod(base: bigint, exp: bigint): bigint {
  let r = 1n;
  base = u256(base);
  while (exp > 0n) {
    if (exp & 1n) r = u256(r * base);
    base = u256(base * base);
    exp >>= 1n;
  }
  return r;
}

export interface OpInfo {
  name: string;
  gas: number; // static base cost (dynamic added at run time)
}

export interface EvmStep {
  pc: number;
  op: number;
  opName: string;
  /** stack BEFORE this op executes (top last), as 0x-hex strings */
  gasRemaining: number;
  gasCost: number;
  stack: string[];
  memory: string; // 0x-hex of all memory
  storage: [string, string][]; // slot -> value
  halted: boolean;
  error: string | null;
  returnValue: string | null;
}

interface Machine {
  code: Uint8Array;
  pc: number;
  stack: bigint[];
  memory: number[];
  storage: Map<bigint, bigint>;
  gas: number;
  halted: boolean;
  error: string | null;
  returnValue: bigint | null;
  jumpdests: Set<number>;
}

const GAS = {
  base: 2,
  verylow: 3,
  low: 5,
  mid: 8,
  high: 10,
  jumpdest: 1,
  sload: 2100, // simplified (cold)
  sstore: 20000, // simplified (set)
};

/** Per-opcode metadata for the disassembler / UI. */
export const OPCODES: Record<number, OpInfo> = {
  0x00: { name: "STOP", gas: 0 },
  0x01: { name: "ADD", gas: GAS.verylow },
  0x02: { name: "MUL", gas: GAS.low },
  0x03: { name: "SUB", gas: GAS.verylow },
  0x04: { name: "DIV", gas: GAS.low },
  0x06: { name: "MOD", gas: GAS.low },
  0x0a: { name: "EXP", gas: GAS.high },
  0x10: { name: "LT", gas: GAS.verylow },
  0x11: { name: "GT", gas: GAS.verylow },
  0x14: { name: "EQ", gas: GAS.verylow },
  0x15: { name: "ISZERO", gas: GAS.verylow },
  0x16: { name: "AND", gas: GAS.verylow },
  0x17: { name: "OR", gas: GAS.verylow },
  0x18: { name: "XOR", gas: GAS.verylow },
  0x19: { name: "NOT", gas: GAS.verylow },
  0x1b: { name: "SHL", gas: GAS.verylow },
  0x1c: { name: "SHR", gas: GAS.verylow },
  0x50: { name: "POP", gas: GAS.base },
  0x51: { name: "MLOAD", gas: GAS.verylow },
  0x52: { name: "MSTORE", gas: GAS.verylow },
  0x53: { name: "MSTORE8", gas: GAS.verylow },
  0x54: { name: "SLOAD", gas: GAS.sload },
  0x55: { name: "SSTORE", gas: GAS.sstore },
  0x56: { name: "JUMP", gas: GAS.mid },
  0x57: { name: "JUMPI", gas: GAS.high },
  0x58: { name: "PC", gas: GAS.base },
  0x59: { name: "MSIZE", gas: GAS.base },
  0x5a: { name: "GAS", gas: GAS.base },
  0x5b: { name: "JUMPDEST", gas: GAS.jumpdest },
  0xf3: { name: "RETURN", gas: 0 },
};
for (let n = 1; n <= 32; n++) OPCODES[0x5f + n] = { name: `PUSH${n}`, gas: GAS.verylow };
for (let n = 1; n <= 16; n++) OPCODES[0x7f + n] = { name: `DUP${n}`, gas: GAS.verylow };
for (let n = 1; n <= 16; n++) OPCODES[0x8f + n] = { name: `SWAP${n}`, gas: GAS.verylow };

const hex = (x: bigint): string => "0x" + x.toString(16);

function memoryGasCost(words: number): number {
  return 3 * words + Math.floor((words * words) / 512);
}

/** Ensure memory covers [offset, offset+size); return the expansion gas. */
function expandMemory(m: Machine, offset: number, size: number): number {
  if (size === 0) return 0;
  const need = offset + size;
  const oldWords = Math.ceil(m.memory.length / 32);
  if (need <= m.memory.length) return 0;
  const newLen = Math.ceil(need / 32) * 32;
  const newWords = newLen / 32;
  while (m.memory.length < newLen) m.memory.push(0);
  return memoryGasCost(newWords) - memoryGasCost(oldWords);
}

function findJumpdests(code: Uint8Array): Set<number> {
  const set = new Set<number>();
  for (let i = 0; i < code.length; i++) {
    const op = code[i];
    if (op === 0x5b) set.add(i);
    else if (op >= 0x60 && op <= 0x7f) i += op - 0x5f; // skip PUSH data
  }
  return set;
}

function snapshot(m: Machine, pc: number, op: number, gasCost: number): EvmStep {
  return {
    pc,
    op,
    opName: OPCODES[op]?.name ?? `UNKNOWN(0x${op.toString(16)})`,
    gasRemaining: m.gas,
    gasCost,
    stack: m.stack.map(hex),
    memory: "0x" + m.memory.map((b) => b.toString(16).padStart(2, "0")).join(""),
    storage: [...m.storage.entries()].map(([k, v]) => [hex(k), hex(v)]),
    halted: m.halted,
    error: m.error,
    returnValue: m.returnValue === null ? null : hex(m.returnValue),
  };
}

export interface RunResult {
  steps: EvmStep[];
  gasUsed: number;
  error: string | null;
  returnValue: string | null;
}

/** Parse "0x6003600402" or "6003600402" into bytecode. */
export function parseBytecode(input: string): Uint8Array {
  const h = input.trim().replace(/^0x/, "").replace(/\s+/g, "");
  if (h.length % 2 !== 0 || /[^0-9a-fA-F]/.test(h)) throw new Error("invalid bytecode hex");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** Execute bytecode and return the full per-instruction trace. */
export function run(code: Uint8Array, gasLimit = 100000, maxSteps = 5000): RunResult {
  const m: Machine = {
    code,
    pc: 0,
    stack: [],
    memory: [],
    storage: new Map(),
    gas: gasLimit,
    halted: false,
    error: null,
    returnValue: null,
    jumpdests: findJumpdests(code),
  };
  const steps: EvmStep[] = [];
  let count = 0;

  const pop = (): bigint => {
    const v = m.stack.pop();
    if (v === undefined) throw new Error("stack underflow");
    return v;
  };
  const push = (v: bigint) => {
    if (m.stack.length >= 1024) throw new Error("stack overflow");
    m.stack.push(u256(v));
  };

  while (!m.halted && m.pc < code.length && count++ < maxSteps) {
    const op = code[m.pc];
    const info = OPCODES[op];
    const startPc = m.pc;
    let gasCost = info ? info.gas : 0;
    try {
      if (!info) throw new Error(`invalid opcode 0x${op.toString(16)}`);

      // dynamic gas for memory ops is added before charging
      if (op === 0x51 || op === 0x52) {
        const off = Number(m.stack[m.stack.length - 1] ?? 0n);
        gasCost += expandMemory(m, off, 32);
      } else if (op === 0x53) {
        const off = Number(m.stack[m.stack.length - 1] ?? 0n);
        gasCost += expandMemory(m, off, 1);
      }

      if (m.gas < gasCost) throw new Error("out of gas");
      m.gas -= gasCost;

      let nextPc = m.pc + 1;

      if (op >= 0x60 && op <= 0x7f) {
        // PUSH1..32
        const n = op - 0x5f;
        let v = 0n;
        for (let i = 0; i < n; i++) v = (v << 8n) | BigInt(code[m.pc + 1 + i] ?? 0);
        push(v);
        nextPc = m.pc + 1 + n;
      } else if (op >= 0x80 && op <= 0x8f) {
        const n = op - 0x7f; // DUP n
        const v = m.stack[m.stack.length - n];
        if (v === undefined) throw new Error("stack underflow");
        push(v);
      } else if (op >= 0x90 && op <= 0x9f) {
        const n = op - 0x8f; // SWAP n
        const i = m.stack.length - 1;
        const j = m.stack.length - 1 - n;
        if (j < 0) throw new Error("stack underflow");
        [m.stack[i], m.stack[j]] = [m.stack[j], m.stack[i]];
      } else {
        switch (op) {
          case 0x00: m.halted = true; break;
          case 0x01: push(pop() + pop()); break;
          case 0x02: push(pop() * pop()); break;
          case 0x03: { const a = pop(), b = pop(); push(a - b); break; }
          case 0x04: { const a = pop(), b = pop(); push(b === 0n ? 0n : a / b); break; }
          case 0x06: { const a = pop(), b = pop(); push(b === 0n ? 0n : a % b); break; }
          case 0x0a: push(expmod(pop(), pop())); break;
          case 0x10: { const a = pop(), b = pop(); push(a < b ? 1n : 0n); break; }
          case 0x11: { const a = pop(), b = pop(); push(a > b ? 1n : 0n); break; }
          case 0x14: { const a = pop(), b = pop(); push(a === b ? 1n : 0n); break; }
          case 0x15: push(pop() === 0n ? 1n : 0n); break;
          case 0x16: push(pop() & pop()); break;
          case 0x17: push(pop() | pop()); break;
          case 0x18: push(pop() ^ pop()); break;
          case 0x19: push(~pop()); break;
          case 0x1b: { const sh = pop(), v = pop(); push(sh >= 256n ? 0n : v << sh); break; }
          case 0x1c: { const sh = pop(), v = pop(); push(sh >= 256n ? 0n : v >> sh); break; }
          case 0x50: pop(); break;
          case 0x51: { const off = Number(pop()); let v = 0n; for (let i = 0; i < 32; i++) v = (v << 8n) | BigInt(m.memory[off + i] ?? 0); push(v); break; }
          case 0x52: { const off = Number(pop()), v = pop(); for (let i = 0; i < 32; i++) m.memory[off + 31 - i] = Number((v >> BigInt(i * 8)) & 0xffn); break; }
          case 0x53: { const off = Number(pop()), v = pop(); m.memory[off] = Number(v & 0xffn); break; }
          case 0x54: { const k = pop(); push(m.storage.get(k) ?? 0n); break; }
          case 0x55: { const k = pop(), v = pop(); m.storage.set(k, v); break; }
          case 0x56: { const dest = Number(pop()); if (!m.jumpdests.has(dest)) throw new Error("invalid jump destination"); nextPc = dest; break; }
          case 0x57: { const dest = Number(pop()), cond = pop(); if (cond !== 0n) { if (!m.jumpdests.has(dest)) throw new Error("invalid jump destination"); nextPc = dest; } break; }
          case 0x58: push(BigInt(startPc)); break;
          case 0x59: push(BigInt(m.memory.length)); break;
          case 0x5a: push(BigInt(m.gas)); break;
          case 0x5b: break; // JUMPDEST
          case 0xf3: { const off = Number(pop()), size = Number(pop()); gasCost += expandMemory(m, off, size); let v = 0n; for (let i = 0; i < size; i++) v = (v << 8n) | BigInt(m.memory[off + i] ?? 0); m.returnValue = v; m.halted = true; break; }
          default: throw new Error(`unhandled opcode 0x${op.toString(16)}`);
        }
      }

      steps.push(snapshot(m, startPc, op, gasCost));
      m.pc = nextPc;
    } catch (e) {
      m.error = (e as Error).message;
      m.halted = true;
      steps.push(snapshot(m, startPc, op, gasCost));
      break;
    }
  }
  // Running off the end of the code is an implicit STOP (successful halt).
  if (!m.halted && !m.error && m.pc >= code.length) {
    m.halted = true;
    steps.push(snapshot(m, m.pc, 0x00, 0));
  }
  if (count >= maxSteps && !m.halted) m.error = "step limit reached";

  return {
    steps,
    gasUsed: gasLimit - m.gas,
    error: m.error,
    returnValue: m.returnValue === null ? null : hex(m.returnValue),
  };
}
