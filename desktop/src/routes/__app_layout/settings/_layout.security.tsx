import { AsyncSwitch } from "@/components/async-switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { use } from "@/hooks/use"
import { useSettings } from "@/hooks/use-settings"
import { createFileRoute } from '@tanstack/react-router'
import { Check, Edit, Eye, EyeOff, Trash2 } from "lucide-react"
import { useState } from "react"

export const Route = createFileRoute('/__app_layout/settings/_layout/security')({
  component: RouteComponent,
})

export function RouteComponent() {
  const {
    settings: [
      autoKeyRotation,
    ],
    setSetting,
    isLoading
  } = useSettings({
    keys: [
      "security.autoKeyRotation",
    ]
  })

  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editKeyValue, setEditKeyValue] = useState("")
  const [showEncryptionKey, setShowEncryptionKey] = useState(false)
  // Encryption is always enabled - this is the actual encryption key

  const handleEditKey = (key) => {
    setEditingKey(key.name)
    setEditKeyValue("")
  }

  const handleSaveKey = () => {
    if (editingKey !== null && editKeyValue.trim()) {
      window.electronAPI.key.set(editingKey, editKeyValue).then(() => {
        refetch();
      })
      setEditingKey(null)
      setEditKeyValue("")
    }
  }

  const handleCancelEdit = () => {
    setEditingKey(null)
    setEditKeyValue("")
  }

  const handleDeleteKey = (keyname: string) => {
    window.electronAPI.key.delete(keyname).then(() => {
      refetch();
    })
  }

  const { data: db_encryption } = use({
    fetcher: async () => (await window.electronAPI.db.encryption.get()) || null,
  })

  const { data: api_keys, refetch } = use({
    fetcher: async () => (await window.electronAPI.key.getAll())?.map(key => ({
      id: key.api_key.id,
      name: key.api_key.name,
      key: key.api_key.value.replace(/(.{4})(.*)(.{4})/, '$1•••••••••••$3'),
      lastUsed: key.api_key.last_used ? new Date(key.api_key.last_used).toLocaleString() : "Never",
      active: key.user_mcp?.is_active || false,
    }))
  })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">API Keys</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Manage API keys for MCP servers</p>
          </div>

          <div className="space-y-3">
            {(!api_keys || api_keys.length === 0) && (
              <div className="py-2 text-muted-foreground">
                <p className="text-sm">No API keys configured</p>
                <p className="text-xs mt-1">Keys will appear here when you add MCP servers that require them</p>
              </div>
            )}
            {api_keys?.map((key) => (
              <div key={key.id} className="border rounded-lg">
                {editingKey === key.name ? (
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label className="font-medium">{key.name}</Label>
                      <p className="text-sm text-muted-foreground">Update the API key value below</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`edit-key-${key.id}`}>New API Key Value</Label>
                      <Input
                        id={`edit-key-${key.id}`}
                        type="password"
                        value={editKeyValue}
                        onChange={(e) => setEditKeyValue(e.target.value)}
                        placeholder="Enter new API key value"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={handleSaveKey} disabled={!editKeyValue.trim()}>
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Label className="font-medium">{key.name}</Label>
                        <Badge variant={key.active ? "default" : "secondary"}>
                          {key.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {key.key} • Last used {key.lastUsed}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditKey(key)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete API Key</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete the "{key.name}" API key? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                              <Button variant="destructive" onClick={() => handleDeleteKey(key.name)}>
                                Delete
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Automatic Key Rotation</Label>
              <p className="text-sm text-muted-foreground">Automatically rotate API keys every 90 days</p>
            </div>
            <AsyncSwitch
              isLoading={isLoading}
              checked={autoKeyRotation}
              onCheckedChange={(checked) => setSetting("security.autoKeyRotation", checked)}
            />
          </div>
        </div>
      </div>
      <Separator />
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Label className="text-base font-medium">Data Encryption</Label>
            <Tooltip>
              <TooltipTrigger>
                <Check className="w-4 h-4 text-green-600" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Data encryption is always enabled</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
              {showEncryptionKey ? db_encryption : db_encryption?.replace(/(.{4})(.*)(.{4})/, '$1•••••••••••$3') || "•••••••••••"}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEncryptionKey(!showEncryptionKey)}
              className="h-6 w-6 p-0"
            >
              {showEncryptionKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
