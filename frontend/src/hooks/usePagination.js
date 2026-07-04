import { useEffect, useMemo, useState } from 'react'

/**
 * Reusable pagination hook.
 *
 * @param {Array} items - The full (already filtered) list of items to paginate.
 * @param {Object} options
 * @param {number} [options.pageSize=10] - Items per page.
 * @param {Array}  [options.resetDeps=[]] - When any of these values change, page resets to 1
 *                                          (pass your filter/search state here).
 *
 * @returns {{
 *   page: number,
 *   setPage: Function,
 *   totalPages: number,
 *   paginated: Array,
 *   pageSize: number,
 * }}
 */
export function usePagination(items, { pageSize = 10, resetDeps = [] } = {}) {
  const [page, setPage] = useState(1)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setPage(1)
  }, resetDeps)

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const paginated = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize]
  )

  return {
    page: currentPage,
    setPage,
    totalPages,
    paginated,
    pageSize,
  }
}
