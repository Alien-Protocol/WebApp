export type ProtocolErrorCode =
  | "Invalid amount"
  | "Insufficient supply"
  | "Insufficient liquidity"
  | "Exceeds borrow limit"
  | "Below min collateral ratio"
  | "Not liquidatable"
  | "Insufficient wallet balance"
  | "Asset not supported"
  | "Oracle feed stale"
  | "Unauthorized"
  | "Network error";

export class ProtocolError extends Error {
  readonly code?: ProtocolErrorCode;
  readonly status?: number;

  constructor(message: string, opts?: { code?: ProtocolErrorCode; status?: number }) {
    super(message);
    this.name = "ProtocolError";
    this.code = opts?.code;
    this.status = opts?.status;
  }
}

export function isProtocolError(err: unknown): err is ProtocolError {
  return err instanceof ProtocolError;
}
