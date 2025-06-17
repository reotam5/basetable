import { ChatInterface } from '@/components/chat-interface'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__app_layout/chat/$chatId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ChatInterface />
}
