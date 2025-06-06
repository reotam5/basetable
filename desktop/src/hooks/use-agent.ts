import { useNavigate } from '@tanstack/react-router';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type IAgent = {
  id?: number;
  is_main?: boolean;
  name?: string;
  llmId?: number;
  instruction?: string;
  mcpIds?: number[];
  mcpTools?: { [serverId: number]: string[] }; // New field for tool-level selection
  styles?: number[];
}

type IUseAgent = {
  agent: IAgent | null;
  loading: boolean;
  error: string | null;
  updateAgent: (agent?: Partial<IAgent>) => Promise<void>;
  refetch: () => Promise<void>;
  createAgent: () => Promise<void>;
  deleteAgent: () => Promise<void>;
}

const useAgent = (id?: number): IUseAgent => {
  const [agent, setAgent] = useState<IAgent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const pendingUpdatesRef = useRef<Partial<IAgent>>({});
  const navigate = useNavigate();

  const fetchAgent = useCallback(async () => {
    try {
      if (!id) return;
      setLoading(true);
      setError(null);
      const agentData = await window.electronAPI.agent.get(id);

      // Process new mcpTools data structure
      agentData.mcpTools = {};
      if (agentData?.userMcps) {
        agentData.userMcps.forEach((mcp: any) => {
          const serverId = mcp.id
          const selectedTools = mcp.Agent_User_MCP?.selected_tools ?? []
          if (selectedTools.length > 0) {
            agentData.mcpTools[serverId] = selectedTools;
          }
        })
      }
      delete agentData.userMcps;

      agentData.styles = agentData?.styles?.map((style: { id: number }) => style.id) ?? [];
      setAgent(agentData);
    } catch (err) {
      console.error('Error fetching agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch agent');
      setAgent(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Create debounced API call function
  const debouncedApiCall = useMemo(
    () => debounce(async () => {
      try {
        const updatePayload: {
          name?: string;
          instruction?: string;
          llmId?: number;
          mcpIds?: number[];
          mcpTools?: { [serverId: number]: string[] };
          styles?: number[];
        } = {};

        const pendingUpdate = pendingUpdatesRef.current;

        if (pendingUpdate.name !== undefined) {
          updatePayload.name = pendingUpdate.name;
        }
        if (pendingUpdate.instruction !== undefined) {
          updatePayload.instruction = pendingUpdate.instruction;
        }
        if (pendingUpdate.llmId !== undefined) {
          updatePayload.llmId = pendingUpdate.llmId;
        }
        if (pendingUpdate.mcpIds !== undefined) {
          updatePayload.mcpIds = pendingUpdate.mcpIds;
        }
        if (pendingUpdate.mcpTools !== undefined) {
          updatePayload.mcpTools = pendingUpdate.mcpTools;
        }
        if (pendingUpdate.styles !== undefined) {
          updatePayload.styles = pendingUpdate.styles ?? [];
        }

        // Send update to server
        await window.electronAPI.agent.update(id!, updatePayload);

        // Clear pending updates after successful API call
        pendingUpdatesRef.current = {};

      } catch (err) {
        console.error('Error updating agent:', err);
        setError(err instanceof Error ? err.message : 'Failed to update agent');

        // Refetch to get the correct state from server on error
        await fetchAgent();
      }
    }, 500), // 500ms debounce delay
    [id, fetchAgent]
  );

  const updateAgent = useCallback(async (agentUpdate?: Partial<IAgent>) => {
    try {
      setError(null);

      // Optimistically update local state first
      setAgent(prevAgent => {
        return {
          ...(prevAgent ?? {}),
          ...agentUpdate
        };
      });

      // Accumulate pending updates
      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        ...agentUpdate
      };

      // Trigger debounced API call
      if (id) debouncedApiCall();

    } catch (err) {
      console.error('Error in updateAgent:', err);
      setError(err instanceof Error ? err.message : 'Failed to update agent');
      throw err;
    }
  }, [debouncedApiCall, id]);

  const refetch = useCallback(async () => {
    await fetchAgent();
  }, [fetchAgent]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  useEffect(() => {
    const onSidebarRefresh = () => refetch();
    window.addEventListener('sidebar.refresh', onSidebarRefresh);
    return () => {
      window.removeEventListener('sidebar.refresh', onSidebarRefresh);
    }
  }, [refetch])

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedApiCall.cancel();
    };
  }, [debouncedApiCall]);

  return {
    agent,
    loading,
    error,
    updateAgent,
    refetch,
    createAgent: async () => {
      const newAgent = await window.electronAPI.agent.create({
        instruction: pendingUpdatesRef.current.instruction!,
        llmId: pendingUpdatesRef.current.llmId!,
        mcpTools: pendingUpdatesRef.current.mcpTools,
        styles: pendingUpdatesRef.current.styles
      })
      window.dispatchEvent(new CustomEvent('sidebar.refresh'));
      navigate({ to: `/agent/${newAgent.id}`, replace: true });
    },
    deleteAgent: async () => {
      if (!id) return;
      await window.electronAPI.agent.delete(id);
      window.dispatchEvent(new CustomEvent('sidebar.refresh'));
      navigate({ to: `/agents` });
    }
  };
}

export default useAgent;
export { useAgent };
export type { IAgent, IUseAgent };

