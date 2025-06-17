import { ChatSearch } from '@/components/chat-search'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__app_layout/chats/search')({
  component: ChatSearch
})
