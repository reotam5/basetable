import { NewChat } from '@/components/new-chat'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__app_layout/chats/')({
  component: NewChat,
})