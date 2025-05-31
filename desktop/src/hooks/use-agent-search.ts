import { useEffect, useState } from 'react';

export interface Agent {
  id: string;
  title: string;
  description?: string;
  createdAt?: string;
}

// Dummy data to simulate API response
const DUMMY_AGENTS: Agent[] = [
  {
    id: '1',
    title: 'Code Assistant',
    description: 'Helps with code reviews and suggestions',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    title: 'Data Analyst',
    description: 'Analyzes data and creates reports',
    createdAt: '2024-01-14T14:22:00Z'
  },
  {
    id: '3',
    title: 'Content Writer',
    description: 'Creates engaging content and copy',
    createdAt: '2024-01-13T09:15:00Z'
  },
  {
    id: '4',
    title: 'Research Assistant',
    description: 'Conducts research and summarizes findings',
    createdAt: '2024-01-12T16:45:00Z'
  },
  {
    id: '5',
    title: 'Project Manager',
    description: 'Manages tasks and project workflows',
    createdAt: '2024-01-11T11:30:00Z'
  }
];

export function useAgentSearch() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate async API call
    const fetchAgents = async () => {
      setIsLoading(true);

      // Simulate network delay (1-2 seconds)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Simulate success response
      setAgents(DUMMY_AGENTS);
      setIsLoading(false);
    };

    fetchAgents();
  }, []);

  return {
    agents,
    isLoading,
  };
}