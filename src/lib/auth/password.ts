import { z } from 'zod';

/**
 * Mirrors src/common/password.schema.ts on the API, which is the real gate —
 * this copy exists so the user is told in Vietnamese, immediately, instead of
 * round-tripping to read an English message. If the two ever disagree the API
 * wins, and the user sees its message.
 *
 * No upper/lower/digit/symbol requirements on purpose: asked for a capital and
 * a number, people write `Password1`, which ticks every box and is still among
 * the first guesses anyone makes. Length plus a blocklist of the passwords that
 * actually show up in breaches is what costs an attacker something, and it
 * keeps passphrases usable.
 */
const COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'password1',
  'password123',
  'qwertyuiop',
  'qwerty123',
  'iloveyou',
  'admin123',
  'letmein123',
  'welcome1',
  'abc12345',
  '11111111',
  '00000000',
  'sinhvien',
  'matkhau123',
  'probase123',
]);

export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu cần ít nhất 8 ký tự')
  .max(128, 'Mật khẩu tối đa 128 ký tự')
  .refine((value) => !COMMON_PASSWORDS.has(value.toLowerCase()), {
    message: 'Mật khẩu này quá phổ biến, hãy chọn mật khẩu khác',
  })
  .refine((value) => !/^(.)\1+$/.test(value), {
    message: 'Mật khẩu không thể chỉ gồm một ký tự lặp lại',
  });
