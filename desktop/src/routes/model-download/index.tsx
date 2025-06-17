import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/auth-context';
import { use } from '@/hooks/use';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { createFileRoute } from '@tanstack/react-router';
import { Check, Download, LogOut, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/model-download/')({
  component: RouteComponent,
})


function RouteComponent() {
  const { user, logout } = useAuth()
  const { data: llms, refetch } = use({ fetcher: window.electronAPI.llm.getAllLocal })
  const startDownload = (llm: (NonNullable<typeof llms>)[number]) => window.electronAPI.llm.download(llm);
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
  const deleteModel = (llm: (NonNullable<typeof llms>)[number]) => {
    window.electronAPI.llm.delete(llm).then(() => {
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

  const handleContinue = () => window.electronAPI.window.screenChange('POST_MODEL_DOWNLOAD_LOADING' as any);
  const [downloadStatus, setDownloadStatus] = useState<Record<string, {
    progress: number;
    totalSize: number;
    downloadedSize: number;
    eta: number;
  }>>({});
  const hasActiveDownloads = downloadStatus && Object.keys(downloadStatus).length > 0;

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

  return (
    <div className="h-screen bg-muted">
      <div className="mx-auto flex flex-col h-full">
        <header className="flex sticky top-0 z-50 w-full items-center border-b bg-background" style={{ WebkitAppRegion: "drag" } as React.CSSProperties}>
          <div className="flex h-14 w-full items-center gap-2 px-4 justify-between">
            <Breadcrumb className={typeof navigator !== 'undefined' && /Mac/.test(navigator.platform) ? "pl-20" : undefined}>
              <BreadcrumbList>
                <BreadcrumbPage>Download local models</BreadcrumbPage>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-4" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full">
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage src={user?.picture} alt={user?.name} />
                    <AvatarFallback>
                      {user?.name ? user.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56" align="end" forceMount alignOffset={-20} sideOffset={13}>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <div className="p-5 pt-3">
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Download AI models to run locally on your device for enhanced privacy and offline capabilities. You can
            skip this step and use our cloud-based models, or download models later in settings.
          </p>
        </div>

        <div className='flex-1 min-h-0 scroll-auto overflow-scroll bg-background p-5 m-5 mt-0 border rounded-sm shadow-sm'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {llms?.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.display_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{model.provider}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm text-muted-foreground line-clamp-2">{model.description}</p>
                  </TableCell>
                  <TableCell>
                    {!model.is_downloaded && !downloadStatus[model.download_url || ""] && <Badge variant="secondary">Not Downloaded</Badge>}
                    {downloadStatus[model.download_url || ""] && (
                      <div className="space-y-2 min-w-48">
                        <div className="flex items-center gap-3">
                          <Progress value={downloadStatus[model.download_url!].progress * 100 || 0} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground min-w-12">
                            {Math.round(downloadStatus[model.download_url!].progress * 100 || 0)}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {(downloadStatus[model.download_url!].downloadedSize / 1024 / 1024).toFixed(1)} MB / {(downloadStatus[model.download_url!].totalSize / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    )}
                    {model.is_downloaded && !downloadStatus[model.download_url || ""] && (
                      <Badge variant="default">
                        <Check className="w-3 h-3 mr-1" />
                        Downloaded
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!model.is_downloaded && !downloadStatus[model.download_url || ""] && (
                      <Button size="sm" onClick={() => startDownload(model)} className="gap-2">
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    )}
                    {downloadStatus[model.download_url || ""] && (
                      <Button size="sm" variant="outline" onClick={() => cancelDownload(model)} className="gap-2">
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    )}
                    {model.is_downloaded && !downloadStatus[model.download_url || ""] && (
                      <Button size="sm" variant="outline" onClick={() => deleteModel(model)} className="gap-2">
                        <X className="w-4 h-4" />
                        Remove
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center mb-5 mr-5 mt-0">
          <div className="text-sm text-muted-foreground">
            {hasActiveDownloads && <p>Downloads will continue in the background after you continue.</p>}
          </div>
          <Button onClick={handleContinue} size="lg">
            Continue to App
          </Button>
        </div>
      </div>
    </div>
  )
}
