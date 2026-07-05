import { useEffect, useMemo, useState } from 'react'

export function usePagination(items, { pageSize = 10, resetDeps = [] } = {}) {
  const [page, setPage] = useState(1)

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
