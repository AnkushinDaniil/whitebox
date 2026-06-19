/**
 * A real EIP-1559 transaction signer — sign, recover sender, hash — verifiable
 * against a live wallet. The visualizer is one consumer of this API.
 */
export {
  type TxFields,
  type Signature,
  intToBytes,
  signingPayload,
  signingHash,
  signTx,
  serializeSigned,
  txHash,
  privateKeyToAddress,
  recoverSender,
} from "./tx";
export { hexToBytes, bytesToHex, utf8ToBytes, type Bytes } from "@/lib/mpt/bytes";
export { keccak256 } from "@/lib/mpt/hash";
