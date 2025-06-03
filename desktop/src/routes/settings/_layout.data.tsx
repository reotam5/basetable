import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { createFileRoute } from '@tanstack/react-router'
import { Download, Upload } from "lucide-react"
import { useState } from "react"

export const Route = createFileRoute('/settings/_layout/data')({
  component: RouteComponent,
})

export function RouteComponent() {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [importStatus, setImportStatus] = useState<string>('')
  const [showDeleteConversationsDialog, setShowDeleteConversationsDialog] = useState(false)
  const [showDeleteAgentsDialog, setShowDeleteAgentsDialog] = useState(false)
  const [showDeleteSettingsDialog, setShowDeleteSettingsDialog] = useState(false)

  // Danger zone handlers
  const handleDeleteConversations = () => {
    // Implement conversation deletion logic here
    alert('will be implemented after chat db design')
    setShowDeleteConversationsDialog(false)
    // Show success message or refresh data
  }

  const handleDeleteAgents = () => {
    // Implement agent deletion logic here
    alert('will be implemented after agent db design')
    setShowDeleteAgentsDialog(false)
    // Show success message or refresh data
  }

  const handleDeleteSettings = () => {
    window.electronAPI.db.reset.applicationSettings()
    setShowDeleteSettingsDialog(false)
    // Reset all settings to default values
  }

  // Import data handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
    setImportStatus('')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (files.length > 1) {
        setImportStatus('Please drop only one file at a time.')
        return
      }
      handleFileSelection(file)
    }
  }

  const handleFileSelection = (file: File) => {
    // Validate file type
    const validTypes = ['.json']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

    if (!validTypes.some(type => fileExtension.endsWith(type.replace('.', '')))) {
      setImportStatus('Please select a valid backup file (.json)')
      alert('Please select a valid backup file (.json)')
      return
    }

    // Validate file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setImportStatus('File is too large. Maximum file size is 10MB.')
      alert('File is too large. Maximum file size is 10MB.')
      return
    }

    setSelectedFile(file)
    setImportStatus('')
    handleFileUpload(file)
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setImportStatus('Reading file...')

    try {
      // Read the file content
      setImportStatus('Parsing file content...')
      const fileContent = await file.text()
      let importData

      try {
        importData = JSON.parse(fileContent)
      } catch {
        throw new Error('Invalid JSON file. Please select a valid backup file.')
      }

      // Validate the data structure
      setImportStatus('Validating data format...')
      if (!importData || !importData.data || !importData.version || !importData.type) {
        throw new Error('Invalid backup file format. Expected structure with data, version, and type.')
      }

      // Import the data using Electron API
      setImportStatus('Importing data...')
      await window.electronAPI.db.import(importData)
      setImportStatus('Import completed successfully!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error importing file. Please try again.'
      setImportStatus(`Import failed: ${errorMessage}`)
      alert(errorMessage)
    } finally {
      setIsUploading(false)
      setSelectedFile(null)
      // Clear status after a delay
      setTimeout(() => setImportStatus(''), 3000)
    }
  }

  const handleChooseFile = () => {
    setImportStatus('')
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleFileSelection(file)
      }
    }
    input.click()
  }

  const handleExportApplicationSettings = async () => {
    try {
      const data = await window.electronAPI.db.export.applicationSettings()
      downloadJSON(data, 'application-settings-export.json')
    } catch {
      alert('Failed to export application settings. Please try again.')
    }
  }


  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Export Data</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Conversations</Label>
              <p className="text-sm text-muted-foreground">Download all your chat history</p>
            </div>
            <Button variant="outline" onClick={() => alert('will be implemented after chat db design')}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Agent Settings</Label>
              <p className="text-sm text-muted-foreground">Download your agent configurations</p>
            </div>
            <Button variant="outline" onClick={() => alert('will be implemented after agent db design')}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Application Settings</Label>
              <p className="text-sm text-muted-foreground">Download your preferences and settings</p>
            </div>
            <Button variant="outline" onClick={handleExportApplicationSettings}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">All Data</Label>
              <p className="text-sm text-muted-foreground">Download a complete backup of all your data</p>
            </div>
            <Button variant="outline" onClick={() => alert('will be implemented after db design')}>
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Import Data</h3>

        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400'
              } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={!isUploading ? handleChooseFile : undefined}
          >
            <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {isUploading ? importStatus || 'Processing...' : 'Import Backup File'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isUploading
                  ? 'Please wait while we process your file'
                  : 'Drag and drop a backup file here, or click to select'
                }
              </p>
              {selectedFile && !isUploading && (
                <p className="text-xs text-primary">
                  Selected: {selectedFile.name}
                </p>
              )}
              {importStatus && !isUploading && (
                <p className={`text-xs ${importStatus.includes('failed') || importStatus.includes('error')
                  ? 'text-destructive'
                  : importStatus.includes('success')
                    ? 'text-green-600'
                    : 'text-muted-foreground'}`}>
                  {importStatus}
                </p>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p className="mb-1">Supported formats:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Application Settings (.json) - Your preferences and configurations</li>
              <li>Maximum file size: 10MB</li>
            </ul>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Danger Zone</h3>

        <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Delete Conversation History</Label>
                <p className="text-sm text-muted-foreground">Remove all chat history and conversations</p>
              </div>
              <Dialog open={showDeleteConversationsDialog} onOpenChange={setShowDeleteConversationsDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">Delete</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Conversation History</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete all your chat history and conversation data.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleDeleteConversations}>
                      Delete All Conversations
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Separator className="bg-destructive/10" />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Delete Agent Settings</Label>
                <p className="text-sm text-muted-foreground">Remove all agent configurations</p>
              </div>
              <Dialog open={showDeleteAgentsDialog} onOpenChange={setShowDeleteAgentsDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">Delete</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Agent Settings</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete all your agent configurations and custom settings.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleDeleteAgents}>
                      Delete All Agents
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Separator className="bg-destructive/10" />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Delete Settings and Preferences</Label>
                <p className="text-sm text-muted-foreground">Reset all settings to default</p>
              </div>
              <Dialog open={showDeleteSettingsDialog} onOpenChange={setShowDeleteSettingsDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">Delete</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Settings and Preferences</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will reset all your application settings, preferences, and configurations to their default values.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleDeleteSettings}>
                      Reset to Default
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
