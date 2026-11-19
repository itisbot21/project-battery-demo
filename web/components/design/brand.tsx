import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return <Link className="brand" href={href} aria-label={href === "/" ? "Project Battery home" : "Project Battery operations"}>
    <span className="brand-mark" aria-hidden="true"><i /><i /></span>
    <span>Project<span className="brand-name-accent">Battery</span></span>
  </Link>;
}
