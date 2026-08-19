import { compare, genSalt, hash } from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  const salt = await genSalt(SALT_ROUNDS);
  return hash(plain, salt);
}

export async function verifyPassword(
  plain: string,
  hashValue: string
): Promise<boolean> {
  return compare(plain, hashValue);
}