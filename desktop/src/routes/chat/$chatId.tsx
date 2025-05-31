import { ChatInterface } from '@/components/chat-interface'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/chat/$chatId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ChatInterface />
}
