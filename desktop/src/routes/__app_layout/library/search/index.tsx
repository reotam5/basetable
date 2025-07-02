import { LibrarySearchPage } from '@/components/library-search-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__app_layout/library/search/')({
  component: LibrarySearchPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: search.q as string | undefined,
  }),
})

