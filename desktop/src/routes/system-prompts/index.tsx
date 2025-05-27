import { SystemPrompts } from '@/components/system-prompts'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/system-prompts/')({
  component: SystemPrompts,
})