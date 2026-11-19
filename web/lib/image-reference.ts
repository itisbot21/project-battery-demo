export function validImageReference(value: string) {
  if (value.length > 700 || /[\\\s]/.test(value)) return false;
  if (value.startsWith("/images/")) return !value.split("/").some((part) => part === "..");
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
