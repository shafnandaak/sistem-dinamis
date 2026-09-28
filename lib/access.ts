// Hak akses halaman khusus. Tambahkan email (huruf kecil) ke daftar untuk memberi akses.

/** Akun yang boleh membuka halaman Pengujian. */
export const PENGUJIAN_EMAILS = ["222212878@stis.ac.id"];

export const PENGUJIAN_PATH = "/pengujian";

export function canAccessPengujian(email: string | null | undefined): boolean {
  return !!email && PENGUJIAN_EMAILS.includes(email.trim().toLowerCase());
}
