import crypto from "crypto";
import { promisify } from "util";

const scrypt = promisify(crypto.scrypt) as (
  password: crypto.BinaryLike,
  salt: crypto.BinaryLike,
  keylen: number,
  options: crypto.ScryptOptions,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const COST = 16384; // N

export const hashPassword = async (password: string): Promise<string> => {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, KEY_LENGTH, { N: COST });
  return `scrypt$${COST}$${salt.toString("hex")}$${key.toString("hex")}`;
};

export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const [scheme, costStr, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !costStr || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const key = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length, {
    N: Number(costStr),
  });
  return crypto.timingSafeEqual(key, expected);
};

export const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, tokenHash: hashResetToken(token) };
};

export const hashResetToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");
