import { ChatInterface } from '@/components/chat-interface'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: ChatInterface,
})