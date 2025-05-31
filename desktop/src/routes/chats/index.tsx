import { ChatSearch } from '@/components/chat-search'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/chats/')({
  component: ChatSearch,
})