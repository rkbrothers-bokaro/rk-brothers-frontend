import { useTranslation } from "react-i18next";

export default function Table({ columns = [], data = [], loading = false, emptyMessage }) {
  const { t } = useTranslation();

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-zinc-200">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-4 py-3 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {loading &&
            Array.from({ length: 5 }).map((_, rowIdx) => (
              <tr key={`skeleton-${rowIdx}`}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-zinc-200" />
                  </td>
                ))}
              </tr>
            ))}

          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-zinc-500">
                {emptyMessage || t("common.noData")}
              </td>
            </tr>
          )}

          {!loading &&
            data.map((row, rowIdx) => (
              <tr key={row.id ?? rowIdx} className="hover:bg-zinc-50">
                {columns.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-4 py-3 text-zinc-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
