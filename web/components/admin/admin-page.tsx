import type { ReactNode } from "react";
import { OperationsNav } from "./operations-nav";

export function AdminPage({ title, description, actions, children }: {
  title: string; description?: string; actions?: ReactNode; children: ReactNode;
}) {
  return <main className="store-container store-section admin-screen">
    <OperationsNav />
    <div className="section-heading">
      <div className="page-intro"><h1>{title}</h1>{description && <p className="muted">{description}</p>}</div>
      {actions}
    </div>
    {children}
  </main>;
}

export function AdminStatus({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "critical" | "active" }) {
  return <span className="admin-status" data-tone={tone}>{children}</span>;
}

export function AdminTable({ caption, columns, rows, empty }: {
  caption: string; columns: string[]; rows: { id: number | string; cells: ReactNode[] }[]; empty: string;
}) {
  return <div className="panel admin-table-wrap">
    <table className="admin-table" role="table">
      <caption>{caption}</caption>
      <thead role="rowgroup"><tr role="row">{columns.map((label) => <th key={label} role="columnheader" scope="col">{label}</th>)}</tr></thead>
      <tbody role="rowgroup">
        {rows.map((row) => <tr role="row" key={row.id}>{row.cells.map((content, index) =>
          <td role="cell" key={columns[index]}><span className="admin-cell-label" aria-hidden="true">{columns[index]}</span><div>{content}</div></td>
        )}</tr>)}
        {!rows.length && <tr role="row"><td role="cell" colSpan={columns.length} data-empty>{empty}</td></tr>}
      </tbody>
    </table>
  </div>;
}
