"use client"

import { useState } from "react"
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ChatInterface } from "@/components/chat-interface"
import { MCPServers } from "@/components/mcp-servers"
import { PromptManagement } from "@/components/prompt-management"
import { RoutingRules } from "@/components/routing-rules"
import { Dashboard } from "@/components/dashboard"
import { SystemPrompts } from "@/components/system-prompts"
import { Settings } from "@/components/settings"
import { Header } from "@/components/header"

function MainContent() {
  const [activeSection, setActiveSection] = useState("chat")
  const { setOpen } = useSidebar()

  const renderContent = () => {
    switch (activeSection) {
      case "chat":
        return <ChatInterface />
      case "dashboard":
        return <Dashboard />
      case "mcp-servers":
        return <MCPServers />
      case "prompt-management":
        return <PromptManagement />
      case "routing-rules":
        return <RoutingRules />
      case "system-prompts":
        return <SystemPrompts />
      case "settings":
        return <Settings />
      default:
        return <ChatInterface />
    }
  }

  return (
    <>
      
      <div className="fixed top-0 left-0 w-2 h-full z-50 hover:bg-blue-100/20" onMouseEnter={() => setOpen(true)} />
      <div className="fixed top-0 left-0 h-full z-40">
        <AppSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      </div>
      
      <div className="flex-1 flex flex-col w-full">
        <Header />
        <main className="flex-1 p-6 w-full">{renderContent()}</main>
      </div>
    </>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#fbf8f1" }}>
      <SidebarProvider defaultOpen={false}>
        <div className="relative flex min-h-screen w-full">
          <MainContent />
        </div>
      </SidebarProvider>
    </div>
  )
}
