import { PostLoginLoadingSplash } from '@/components/splash-variants'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/loading/post-login')({
  component: PostLoginLoadingSplash,
})
