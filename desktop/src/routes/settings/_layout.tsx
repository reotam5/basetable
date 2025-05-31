import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createFileRoute, Outlet, useMatches, useNavigate } from '@tanstack/react-router'
import { Database, DollarSign, FileText, Palette, Shield, User } from 'lucide-react'

export const Route = createFileRoute('/settings/_layout')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const matches = useMatches();
  const currentTab = matches[matches.length - 1]?.fullPath

  return (
    <div className="mx-auto p-6 max-w-5xl">
      <div className="border-b pb-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage your account settings and preferences</p>
      </div>

      <Tabs value={currentTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-0.5 h-auto p-0.5">
          <TabsTrigger value="/settings/appearance" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-8 px-1.5 sm:px-3" onClick={() => navigate({ to: '/settings/appearance' })}>
            <Palette className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Appearance</span>
            <span className="sm:hidden">Style</span>
          </TabsTrigger>
          <TabsTrigger value="/settings/account" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-8 px-1.5 sm:px-3" onClick={() => navigate({ to: '/settings/account' })}>
            <User className="w-3 h-3 sm:w-4 sm:h-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="/settings/security" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-8 px-1.5 sm:px-3" onClick={() => navigate({ to: '/settings/security' })}>
            <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="/settings/billing" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-8 px-1.5 sm:px-3" onClick={() => navigate({ to: '/settings/billing' })}>
            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="/settings/data" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-8 px-1.5 sm:px-3" onClick={() => navigate({ to: '/settings/data' })}>
            <Database className="w-3 h-3 sm:w-4 sm:h-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="/settings/privacy" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-8 px-1.5 sm:px-3" onClick={() => navigate({ to: '/settings/privacy' })}>
            <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <Outlet />
      </Tabs>
    </div>
  )
}
