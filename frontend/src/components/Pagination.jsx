import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Reusable pagination bar.
 *
 * Usage:
 *   const { page, setPage, totalPages, paginated } = usePagination(filtered, {
 *     pageSize: 10,
 *     resetDeps: [search, semesterFilter],
 *   })
 *
 *   <Pagination
 *     page={page}
 *     totalPages={totalPages}
 *     onPageChange={setPage}
 *     totalItems={filtered.length}
 *     pageSize={pageSize}
 *   />
 */
export default function Pagination({ page, totalPages, onPageChange, totalItems, pageSize }) {
  if (totalItems === 0 || totalPages <= 1) {
    // Still show the count if there are items but only one page, hide entirely if empty
    if (totalItems === 0) return null
  }

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push(`ellipsis-${p}`)
      acc.push(p)
      return acc
    }, [])

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
      <span>
        Showing {start}–{end} of {totalItems}
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition"
          title="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {pageNumbers.map((p) =>
          typeof p === 'string' ? (
            <span key={p} className="px-2 text-gray-300">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[28px] h-7 px-2 rounded-md text-xs font-medium transition ${
                p === page
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-500 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition"
          title="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
