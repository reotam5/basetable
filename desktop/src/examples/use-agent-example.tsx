// Example usage of the useAgent hook
import { useAgent } from '../hooks/use-agent';

interface AgentExampleProps {
  agentId: number;
}

export function AgentExample({ agentId }: AgentExampleProps) {
  const { agent, loading, error, updateAgent, refetch } = useAgent(agentId);

  if (loading) {
    return <div>Loading agent...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  if (!agent) {
    return <div>Agent not found</div>;
  }

  const handleUpdateInstruction = async () => {
    try {
      await updateAgent({
        instruction: "Updated instruction for the agent"
      });
      console.log('Agent instruction updated successfully');
    } catch (err) {
      console.error('Failed to update agent:', err);
    }
  };

  const handleUpdateLLM = async () => {
    try {
      await updateAgent({
        llmId: 2 // Switch to a different LLM
      });
      console.log('Agent LLM updated successfully');
    } catch (err) {
      console.error('Failed to update agent LLM:', err);
    }
  };

  const handleUpdateMCPs = async () => {
    try {
      await updateAgent({
        mcpIds: [1, 2, 3] // Update associated MCP servers
      });
      console.log('Agent MCPs updated successfully');
    } catch (err) {
      console.error('Failed to update agent MCPs:', err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Agent: {agent.name}</h2>
      <p><strong>ID:</strong> {agent.id}</p>
      <p><strong>Is Main:</strong> {agent.is_main ? 'Yes' : 'No'}</p>
      <p><strong>LLM ID:</strong> {agent.llmId}</p>
      <p><strong>Instruction:</strong> {agent.instruction || 'No instruction set'}</p>

      <h3>Associated MCPs:</h3>
      {agent.Users_MCPs && agent.Users_MCPs.length > 0 ? (
        <ul>
          {agent.Users_MCPs.map((userMcp) => (
            <li key={userMcp.id}>
              {userMcp.MCP?.name || `MCP ${userMcp.id}`}
              {userMcp.is_active ? ' (Active)' : ' (Inactive)'}
            </li>
          ))}
        </ul>
      ) : (
        <p>No MCPs associated</p>
      )}

      <h3>Styles:</h3>
      {agent.styles && agent.styles.length > 0 ? (
        <ul>
          {agent.styles.map((style) => (
            <li key={style.id}>
              <strong>{style.name}</strong> ({style.type}): {style.description}
            </li>
          ))}
        </ul>
      ) : (
        <p>No styles configured</p>
      )}

      <div style={{ marginTop: '20px' }}>
        <h3>Actions:</h3>
        <button onClick={handleUpdateInstruction} style={{ marginRight: '10px' }}>
          Update Instruction
        </button>
        <button onClick={handleUpdateLLM} style={{ marginRight: '10px' }}>
          Update LLM
        </button>
        <button onClick={handleUpdateMCPs} style={{ marginRight: '10px' }}>
          Update MCPs
        </button>
        <button onClick={refetch}>
          Refresh Data
        </button>
      </div>
    </div>
  );
}

export default AgentExample;
