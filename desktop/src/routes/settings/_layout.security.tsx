import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { createFileRoute } from '@tanstack/react-router'
import { Edit, Trash2 } from "lucide-react"
import { useState } from "react"

export const Route = createFileRoute('/settings/_layout/security')({
  component: RouteComponent,
})

export function RouteComponent() {
  const [apiKeys, setApiKeys] = useState([
    { id: 1, name: "Gmail API", key: "gm_••••••••••••1234", active: true, lastUsed: "2 hours ago" },
    { id: 2, name: "Slack API", key: "sk_••••••••••••5678", active: false, lastUsed: "1 day ago" },
    { id: 3, name: "GitHub API", key: "gh_••••••••••••9012", active: true, lastUsed: "5 minutes ago" }
  ])

  const [editingKey, setEditingKey] = useState<number | null>(null)
  const [editKeyValue, setEditKeyValue] = useState("")
  const [autoKeyRotation, setAutoKeyRotation] = useState(true)
  const [dataEncryption, setDataEncryption] = useState(false)
  const [encryptionKey, setEncryptionKey] = useState("")
  const [storedEncryptionKey, setStoredEncryptionKey] = useState("")
  const [showEnableEncryptionDialog, setShowEnableEncryptionDialog] = useState(false)
  const [showDisableEncryptionDialog, setShowDisableEncryptionDialog] = useState(false)
  const [verificationKey, setVerificationKey] = useState("")

  const handleEditKey = (key: typeof apiKeys[0]) => {
    setEditingKey(key.id)
    setEditKeyValue("")
  }

  const handleSaveKey = () => {
    if (editingKey !== null && editKeyValue.trim()) {
      setApiKeys(keys => keys.map(key =>
        key.id === editingKey
          ? { ...key, key: editKeyValue }
          : key
      ))
      setEditingKey(null)
      setEditKeyValue("")
    }
  }

  const handleCancelEdit = () => {
    setEditingKey(null)
    setEditKeyValue("")
  }

  const handleDeleteKey = (keyId: number) => {
    setApiKeys(keys => keys.filter(key => key.id !== keyId))
  }

  const handleEncryptionToggle = (checked: boolean) => {
    if (checked) {
      // Enabling encryption - show dialog to set key
      setShowEnableEncryptionDialog(true)
    } else {
      // Disabling encryption - show dialog to verify key
      setShowDisableEncryptionDialog(true)
    }
  }

  const handleEnableEncryption = () => {
    if (encryptionKey.trim()) {
      setStoredEncryptionKey(encryptionKey)
      setDataEncryption(true)
      setShowEnableEncryptionDialog(false)
      setEncryptionKey("")
    }
  }

  const handleDisableEncryption = () => {
    if (verificationKey === storedEncryptionKey) {
      setDataEncryption(false)
      setStoredEncryptionKey("")
      setShowDisableEncryptionDialog(false)
      setVerificationKey("")
    }
  }

  const handleCancelEnableEncryption = () => {
    setShowEnableEncryptionDialog(false)
    setEncryptionKey("")
  }

  const handleCancelDisableEncryption = () => {
    setShowDisableEncryptionDialog(false)
    setVerificationKey("")
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">API Keys</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Manage API keys for MCP servers</p>
          </div>

          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div key={key.id} className="border rounded-lg">
                {editingKey === key.id ? (
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
                              <Button variant="destructive" onClick={() => handleDeleteKey(key.id)}>
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
            <Switch
              checked={autoKeyRotation}
              onCheckedChange={setAutoKeyRotation}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Data Encryption</Label>
            <p className="text-sm text-muted-foreground">Enable encryption for your local data</p>
          </div>
          <Switch
            checked={dataEncryption}
            onCheckedChange={handleEncryptionToggle}
          />
        </div>
      </div>

      {/* Enable Encryption Dialog */}
      <Dialog open={showEnableEncryptionDialog} onOpenChange={setShowEnableEncryptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Data Encryption</DialogTitle>
            <DialogDescription>
              Enter a secret key to encrypt your data. Keep this key safe - you'll need it to decrypt your data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="encryption-key">Encryption Key</Label>
              <Input
                id="encryption-key"
                type="password"
                value={encryptionKey}
                onChange={(e) => setEncryptionKey(e.target.value)}
                placeholder="Enter a strong encryption key"
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEnableEncryption}>Cancel</Button>
            <Button
              onClick={handleEnableEncryption}
              disabled={!encryptionKey.trim()}
            >
              Enable Encryption
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Encryption Dialog */}
      <Dialog open={showDisableEncryptionDialog} onOpenChange={setShowDisableEncryptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Data Encryption</DialogTitle>
            <DialogDescription>
              Enter your encryption key to verify and disable data encryption.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="verification-key">Encryption Key</Label>
              <Input
                id="verification-key"
                type="password"
                value={verificationKey}
                onChange={(e) => setVerificationKey(e.target.value)}
                placeholder="Enter your encryption key"
                className="mt-2"
              />
              {verificationKey && verificationKey !== storedEncryptionKey && (
                <p className="text-sm text-destructive mt-1">Incorrect encryption key</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDisableEncryption}>Cancel</Button>
            <Button
              onClick={handleDisableEncryption}
              disabled={!verificationKey.trim() || verificationKey !== storedEncryptionKey}
              variant="destructive"
            >
              Disable Encryption
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
