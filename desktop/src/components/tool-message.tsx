import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Play,
  Settings,
  Shield,
  X
} from "lucide-react";
import { FunctionComponent, useEffect, useMemo, useState } from "react";
import { UIMessage } from "./chat-interface";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Switch } from "./ui/switch";

import { use } from "@/hooks/use";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export type IToolMessageProps = {
  message: UIMessage['toolCalls'][number];
  sendToolCallConfirmation: ReturnType<typeof useChat>['sendToolCallConfirmation']
  setMcpToolKey: (key: number) => void;
  mcpToolKey?: number;
};

export const ToolMessage: FunctionComponent<IToolMessageProps> = ({ message, sendToolCallConfirmation, setMcpToolKey, mcpToolKey }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: isConfirmationBypassed, refetch } = use({ fetcher: async () => await window.electronAPI.mcp.getConfirmationBypass(message.mcp_server_id!, message.function_name), dependencies: [message.mcp_server_id] })

  const setConfirmationBypass = async (value: boolean) => {
    try {
      await window.electronAPI.mcp.setConfirmationBypass(message.mcp_server_id!, message.function_name, value);
      setMcpToolKey(Date.now());
    } catch (error) {
      console.error("Failed to set confirmation bypass:", error);
    }
  }

  useEffect(() => {
    refetch()
  }, [mcpToolKey, refetch])

  const functionName = message?.function_name;
  const functionArgs = useMemo(() => {
    try {
      return message?.function_args ? JSON.parse(message.function_args) : {};
    } catch {
      return message?.function_args;
    }
  }, [message?.function_args]);

  const functionReturn = useMemo(() => {
    try {
      return message?.function_return ? JSON.parse(message.function_return) : {};
    } catch {
      return message?.function_return;
    }
  }, [message?.function_return]);

  const status = message?.status || 'pending';

  const onConfirm = () => {
    sendToolCallConfirmation({
      ...message!,
      confirmed: true,
    })
  }

  const onReject = () => {
    sendToolCallConfirmation({
      ...message!,
      confirmed: false
    })
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'ready_to_be_executed':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          badge: <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300">Running</Badge>,
          title: 'Executing Tool',
          description: 'The tool is currently being executed',
          progress: 75,
          color: 'blue'
        };
      case 'pending_confirmation':
        return {
          icon: <Shield className="h-4 w-4" />,
          badge: <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300">Needs Approval</Badge>,
          title: 'Approval Required',
          description: 'This tool requires your permission to execute',
          progress: 50,
          color: 'purple'
        };
      case 'executed':
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          badge: <Badge variant="outline" className="text-xs border-green-200 text-green-700 dark:border-green-800 dark:text-green-300">Completed</Badge>,
          title: 'Tool Completed',
          description: 'The tool has finished executing successfully',
          progress: 100,
          color: 'green'
        };
      case 'rejected':
        return {
          icon: <X className="h-4 w-4" />,
          badge: <Badge variant="outline">Rejected</Badge>,
          title: 'Tool Rejected',
          description: 'You declined to execute this tool',
          progress: 0,
          color: 'red'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          badge: <Badge variant="outline" className="text-xs border-red-200 text-destructive dark:border-destructive dark:text-destructive">Error</Badge>,
          title: 'Tool Failed',
          description: 'An error occurred while executing the tool',
          progress: 100,
          color: 'red'
        };
      default:
        return {
          icon: <Settings className="h-4 w-4" />,
          badge: <Badge variant="outline" className="text-xs">Unknown</Badge>,
          title: 'Tool Call',
          description: 'Tool status unknown',
          progress: 0,
          color: 'gray'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const hasDetails = (functionReturn && Object.keys(functionReturn).length > 0) ||
    (functionArgs && Object.keys(functionArgs).length > 0) ||
    functionName;

  const getDisplayName = (name: string) => {
    // Convert snake_case to readable format
    return name.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <div className="group relative mt-5">
      {/* Main tool container */}
      <div className={cn(
        "relative border rounded-lg bg-card transition-all duration-200",
        status === 'pending_confirmation' && "ring-2 ring-purple-200 dark:ring-purple-800/50",
        status === 'executed' && "border-green-200 dark:border-green-800/50",
        status === 'error' && "border-red-200 dark:border-red-800/50"
      )}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">

            {/* Content */}
            <div className="flex-1 min-w-0 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-medium text-sm truncate">
                    {getDisplayName(functionName || 'Unknown Tool')}
                  </h3>
                  {statusConfig.badge}
                </div>

                <div className="flex items-center gap-2">
                  {hasDetails && (
                    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ChevronDown className={cn(
                            "h-3 w-3 transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )} />
                        </Button>
                      </CollapsibleTrigger>
                    </Collapsible>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                {statusConfig.description}
              </p>

              <div className="flex items-center justify-between">
                {/* Approval actions */}
                {status === 'pending_confirmation' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={onConfirm}
                      className="flex items-center gap-2 h-8"
                    >
                      <Play className="h-3 w-3" />
                      Allow
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onReject}
                      className="flex items-center gap-2 h-8"
                    >
                      <X className="h-3 w-3" />
                      Deny
                    </Button>
                  </div>
                )}
                {/* Confirmation bypass toggle - bottom right */}
                <div className="flex justify-end mt-3 absolute right-0 bottom-0">
                  <span className="text-xs text-muted-foreground">Auto-approve:</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={isConfirmationBypassed || false}
                          onCheckedChange={setConfirmationBypass}
                          className="scale-75"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">Auto-approve future calls to this tool</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

            </div>
          </div>

          {/* Expandable technical details */}
          {hasDetails && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleContent className="mt-4 pt-4 border-t">
                <div className="space-y-4">
                  {/* Technical info header */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Settings className="h-3 w-3" />
                    <span className="font-medium">Technical Details</span>
                  </div>

                  {/* Function name */}
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Function Name</h4>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <span className="text-xs font-mono">{functionName || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Function arguments */}
                  {functionArgs && Object.keys(functionArgs).length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        Input Parameters
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="h-3 w-3 rounded-full bg-muted flex items-center justify-center text-[10px]">?</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>The parameters passed to this tool</p>
                          </TooltipContent>
                        </Tooltip>
                      </h4>
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        {Object.entries(functionArgs).map(([key, value]) => (
                          <div key={key + message.id + 'mcp'} className="text-xs">
                            <span className="font-mono text-muted-foreground">{key}:</span>
                            <span className="ml-2 font-mono break-all">
                              {formatValue(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Function return value */}
                  {functionReturn && Object.keys(functionReturn).length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        Output Result
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="h-3 w-3 rounded-full bg-muted flex items-center justify-center text-[10px]">?</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>The data returned by this tool</p>
                          </TooltipContent>
                        </Tooltip>
                      </h4>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                          {typeof functionReturn === 'object'
                            ? JSON.stringify(functionReturn, null, 2)
                            : String(functionReturn)
                          }
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  {(status === 'executed' || status === 'error') && message?.execution_start_at && message?.execution_end_at && (
                    <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                      <div>Started: <span className="font-mono">{new Date(message.execution_start_at).toLocaleString()}</span></div>
                      <div>Completed: <span className="font-mono">{new Date(message.execution_end_at).toLocaleString()}</span></div>
                      <div>Duration: <span className="font-mono">
                        {Math.round(new Date(message.execution_end_at).getTime() - new Date(message.execution_start_at).getTime())}ms
                      </span></div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  )
}