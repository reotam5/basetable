import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { use } from "@/hooks/use"
import { createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, Check, Download, HardDrive, Star, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/__app_layout/settings/_layout/llm')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: llms, refetch } = use({ fetcher: window.electronAPI.llm.getAllLocal })

  const [downloadStatus, setDownloadStatus] = useState<Record<string, {
    progress: number;
    totalSize: number;
    downloadedSize: number;
    eta: number;
  }>>({});

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const startDownload = (llm: (NonNullable<typeof llms>)[number]) => {
    window.electronAPI.llm.download(llm);
  };

  const cancelDownload = (llm: (NonNullable<typeof llms>)[number]) => {
    window.electronAPI.llm.cancelDownload(llm).then(() => {
      refetch();
      setDownloadStatus((prev) => ({
        ...Object.entries(prev ?? {}).reduce((acc, [key, value]) => {
          if (key !== llm.download_url) {
            acc[key] = value;
          }
          return acc;
        }, {}),
      }))
    });
  };

  const setAsDefault = (llm: (NonNullable<typeof llms>)[number], isDefault: boolean) => {
    if (isDefault) {
      window.electronAPI.llm.setDefault(llm.id).then(() => {
        refetch();
      })
    }
  }

  const deleteModel = (llm: (NonNullable<typeof llms>)[number]) => {
    setDeleteError(null); // Clear any previous errors
    window.electronAPI.llm.delete(llm).then((result) => {
      if (result.success) {
        refetch();
        setDownloadStatus((prev) => ({
          ...Object.entries(prev ?? {}).reduce((acc, [key, value]) => {
            if (key !== llm.download_url) {
              acc[key] = value;
            }
            return acc;
          }, {}),
        }))
      } else {
        setDeleteError(result.error || "Failed to delete the model.");
      }
    }).catch((error) => {
      setDeleteError("An unexpected error occurred while deleting the model.");
      console.error("Delete model error:", error);
    });
  };

  useEffect(() => {
    const cleanup = window.electronAPI.llm.onStatusUpdate((status) => {
      if (status.isComplete) {
        refetch()
        setDownloadStatus((prev) => ({
          ...Object.entries(prev ?? {}).reduce((acc, [key, value]) => {
            if (key !== status.url) {
              acc[key] = value;
            }
            return acc;
          }, {}),
        }))
      } else {
        setDownloadStatus((prev) => ({
          ...prev,
          [status.url]: {
            progress: status.progress,
            totalSize: status.totalSize,
            downloadedSize: status.downloadedSize,
            eta: status.eta,
          },
        }));
      }
    })
    return () => cleanup();
  }, [refetch])

  const downloadedModels = llms?.filter(model => model.is_downloaded) || []
  const availableModels = llms?.filter(model => !model.is_downloaded) || []

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {deleteError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 dark:text-red-200">{deleteError}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteError(null)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Downloaded Models Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <HardDrive className="w-5 h-5" />
          <h3 className="text-lg font-medium">Downloaded Models</h3>
          <Badge variant="secondary">{downloadedModels.length}</Badge>
        </div>

        {downloadedModels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <HardDrive className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No models downloaded yet</p>
            <p className="text-sm">Download models below to run them locally</p>
          </div>
        ) : (
          <div className="space-y-3">
            {downloadedModels.map((model) => (
              <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Label className="text-base font-medium">{model.display_name}</Label>
                    <Badge variant="outline">{model.provider}</Badge>
                    <Badge variant="default" className="gap-1">
                      <Check className="w-3 h-3" />
                      Downloaded
                    </Badge>
                    {model.is_default && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="default" className="gap-1 bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700">
                              <Star className="w-3 h-3" />
                              Default
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              This model will be used for miscellaneous tasks (eg. generating a title).
                              <br />
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{model.description}</p>
                </div>

                {/* Default Toggle */}
                <Button
                  variant="outline"
                  size={'sm'}
                  className="mr-2"
                  onClick={() => setAsDefault(model, true)}
                  disabled={model.is_default}
                >
                  <Star className="w-4 h-4" />
                  Set as Default
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={model.is_default}
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Remove Model</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to remove "{model.display_name}"? This will delete the model from your device and free up storage space.
                        {model.is_default && (
                          <span className="block mt-2 text-yellow-600 dark:text-yellow-400 font-medium">
                            Note: This model is currently set as default and cannot be removed. Please set another model as default first.
                          </span>
                        )}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={() => deleteModel(model)}
                        disabled={model.is_default}
                      >
                        Remove Model
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Available Models Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5" />
          <h3 className="text-lg font-medium">Available Models</h3>
          <Badge variant="secondary">{availableModels.length}</Badge>
        </div>

        {availableModels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Check className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>All available models are already downloaded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableModels.map((model) => {
              const downloadProgress = downloadStatus[model.download_url || ""];
              const isDownloading = !!downloadProgress;

              return (
                <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Label className="text-base font-medium">{model.display_name}</Label>
                      <Badge variant="outline">{model.provider}</Badge>
                      {isDownloading ? (
                        <Badge variant="default" className="gap-1">
                          <Download className="w-3 h-3" />
                          Downloading
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Not Downloaded</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{model.description}</p>

                    {isDownloading && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Progress value={downloadProgress.progress * 100} className="h-2 flex-1" />
                          <span className="text-sm text-muted-foreground min-w-12">
                            {Math.round(downloadProgress.progress * 100)}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {(downloadProgress.downloadedSize / 1024 / 1024).toFixed(1)} MB / {(downloadProgress.totalSize / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    )}
                  </div>

                  {isDownloading ? (
                    <Button variant="outline" size="sm" onClick={() => cancelDownload(model)} className="gap-2">
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => startDownload(model)} className="gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}
