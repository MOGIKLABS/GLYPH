import { createHash } from "crypto";
import { readFile } from "fs/promises";

export function sha256Hex(input: string | Buffer) {
  return createHash("sha256").update(input).digest("hex");
}

export async function sha256FileHex(path: string) {
  const buf = await readFile(path);
  return sha256Hex(buf);
}

