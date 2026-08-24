export function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return "";
  const domain = email.slice(atIndex);
  const local = email.slice(0, atIndex);
  if (local.length === 1) return `*${domain}`;
  if (local.length === 2) return `${local[0]}*${domain}`;
  return `${local[0]}${"*".repeat(local.length - 2)}${local[atIndex - 1]}${domain}`;
}
