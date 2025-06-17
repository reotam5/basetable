import { ModelDownloadSplash } from '@/components/splash-variants'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/loading/model-download')({
  component: ModelDownloadSplash,
})
