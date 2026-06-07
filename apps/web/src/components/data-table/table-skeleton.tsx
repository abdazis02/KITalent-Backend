/** Skeleton rows shown on first load (rule #2: skeleton loading). */
export function TableSkeleton({ columns, rows = 8 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-border">
          {Array.from({ length: columns }).map((__, c) => (
            <td key={c} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-muted" style={{ width: `${40 + ((r + c) % 5) * 12}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
