import { NewChat } from '@/components/new-chat'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: NewChat,
})