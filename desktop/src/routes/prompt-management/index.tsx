import { PromptManagement } from '@/components/prompt-management'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/prompt-management/')({
  component: PromptManagement,
})