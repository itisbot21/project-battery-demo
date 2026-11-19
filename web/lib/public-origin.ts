export function publicOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol === "https:" || url.protocol === "http:") return new URL(url.origin);
    } catch {}
  }
  return new URL("https://project-battery-demo.vercel.app");
}
