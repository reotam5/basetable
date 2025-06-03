import { AsyncSwitch } from "@/components/async-switch"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { useSettings } from "@/hooks/use-settings"
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings/_layout/account')({
  component: RouteComponent,
})

export function RouteComponent() {
  const { logout } = useAuth()
  const {
    settings: [
      mcpServerStatus,
      costAlert,
      weeklyReports,
      emailDelivery,
      inAppDelivery
    ],
    setSetting,
    isLoading
  } = useSettings({
    keys: [
      "account.notifications.category.mcpServerStatus",
      "account.notifications.category.costAlert",
      "account.notifications.category.weeklyReports",
      "account.notifications.delivery.email",
      "account.notifications.delivery.inApp"
    ]
  })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Notification Settings</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">MCP Server Status Changes</Label>
              <p className="text-sm text-muted-foreground">Get notified when MCP servers go online or offline</p>
            </div>
            <AsyncSwitch
              isLoading={isLoading}
              checked={mcpServerStatus}
              onCheckedChange={(checked) => setSetting("account.notifications.category.mcpServerStatus", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Cost Alerts</Label>
              <p className="text-sm text-muted-foreground">Receive alerts when approaching budget limits</p>
            </div>
            <AsyncSwitch
              isLoading={isLoading}
              checked={costAlert}
              onCheckedChange={(checked) => setSetting("account.notifications.category.costAlert", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">Weekly summary of usage and costs</p>
            </div>
            <AsyncSwitch
              isLoading={isLoading}
              checked={weeklyReports}
              onCheckedChange={(checked) => setSetting("account.notifications.category.weeklyReports", checked)}
            />
          </div>

          <Separator />

          <div>
            <Label className="text-base font-medium mb-3 block">Delivery Methods</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Email</Label>
                <AsyncSwitch
                  isLoading={isLoading}
                  checked={emailDelivery}
                  onCheckedChange={(checked) => setSetting("account.notifications.delivery.email", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>In-App</Label>
                <AsyncSwitch
                  isLoading={isLoading}
                  checked={inAppDelivery}
                  onCheckedChange={(checked) => setSetting("account.notifications.delivery.inApp", checked)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Logout</Label>
            <p className="text-sm text-muted-foreground">Sign out of your account</p>
          </div>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium text-destructive">Delete Account</Label>
            <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Account</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="destructive">Delete Account</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}

