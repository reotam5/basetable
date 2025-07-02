import { LibraryPublishPage } from '@/components/library-publish-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__app_layout/library/create')({
  component: LibraryPublishPage,
})
