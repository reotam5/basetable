import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Bot, Download } from "lucide-react"

// Same interface and mock data as the search page
interface LibraryAgent {
  id: number
  name: string
  description: string
  capabilities: string[]
  author: string
  createdAt: string
}

const mockLibraryAgents: LibraryAgent[] = [
  {
    id: 1,
    name: "Development Team Assistant",
    description: "A comprehensive agent collection for software development teams. Includes code review, documentation generation, and project management capabilities.",
    capabilities: ["code review", "documentation", "project management", "git operations"],
    author: "DevTeam Pro",
    createdAt: "2024-01-15"
  },
  {
    id: 2,
    name: "Data Analysis Toolkit",
    description: "Powerful data analysis and visualization agents for data scientists and analysts. Includes statistical analysis, chart generation, and data cleaning tools.",
    capabilities: ["data analysis", "visualization", "statistics", "data cleaning"],
    author: "DataViz Studio",
    createdAt: "2024-02-03"
  },
  {
    id: 3,
    name: "Content Creator Suite",
    description: "AI-powered content creation agents for marketers and creators. Generate social media posts, blog articles, and marketing copy with ease.",
    capabilities: ["content generation", "social media", "copywriting", "seo optimization"],
    author: "Creative AI Labs",
    createdAt: "2024-01-28"
  },
  {
    id: 4,
    name: "Financial Advisor Pro",
    description: "Comprehensive financial analysis and advisory agents. Portfolio analysis, risk assessment, and investment recommendations.",
    capabilities: ["portfolio analysis", "risk assessment", "financial planning", "market research"],
    author: "FinTech Solutions",
    createdAt: "2024-02-12"
  },
  {
    id: 5,
    name: "Research Assistant",
    description: "Academic and business research agents with citation management, literature review, and report generation capabilities.",
    capabilities: ["literature review", "citation management", "report generation", "web research"],
    author: "Academic Tools Inc",
    createdAt: "2024-01-20"
  },
  {
    id: 6,
    name: "Customer Service Hub",
    description: "Complete customer service solution with ticket management, FAQ generation, and customer communication agents.",
    capabilities: ["ticket management", "faq generation", "customer communication", "sentiment analysis"],
    author: "ServicePro Team",
    createdAt: "2024-02-01"
  }
]

export const Route = createFileRoute('/__app_layout/library/search/$lib_id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { lib_id } = Route.useParams()
  const agent = mockLibraryAgents.find(a => a.id === parseInt(lib_id))

  if (!agent) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-64px)] items-center justify-center">
        <Bot className="w-16 h-16 mb-4 text-muted-foreground opacity-50" />
        <h1 className="text-2xl font-bold mb-2">Agent Not Found</h1>
        <p className="text-muted-foreground mb-4">The agent you're looking for doesn't exist.</p>
        <Link
          to="/library/search"
          search={{
            q: typeof window !== 'undefined' ? localStorage.getItem('library-search-query') || undefined : undefined
          }}
        >
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </Link>
      </div>
    )
  }

  const handleInstall = async () => {
    // Mock install functionality
    console.log(`Installing agent ${agent.id}`)
    // In real implementation, this would call the API
  }

  return (
    <div className="space-y-8 p-6 mx-auto max-w-5xl w-full">
      <div className="flex items-center gap-4">
        <Link
          to="/library/search"
          search={{
            q: typeof window !== 'undefined' ? localStorage.getItem('library-search-query') || undefined : undefined
          }}
        >
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="border-b pb-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {agent.name}
        </h1>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            {"Published by " + agent.author + " on " + new Date(agent.createdAt).toLocaleDateString() + "."}
          </p>
          <div>
            <Button size="lg" onClick={handleInstall}>
              <Download className="h-5 w-5 mr-2" />
              Install Agent
            </Button>
          </div>
        </div>
      </div>


      <div className="space-y-8">
        {/* Description */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Description</h3>
          <p>{agent.description}</p>
        </div>

        {/* Capabilities */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Capabilities</h3>
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.map(capability => (
              <Badge key={capability} variant="outline" className="text-sm py-1 px-3">
                {capability}
              </Badge>
            ))}
          </div>
        </div>
      </div>

    </div>
  )

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <div className="flex-1 p-6 mx-auto max-w-4xl w-full space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Link
            to="/library/search"
            search={{
              q: typeof window !== 'undefined' ? localStorage.getItem('library-search-query') || undefined : undefined
            }}
          >
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Library
            </Button>
          </Link>
        </div>

        {/* Agent Details */}
        <div>
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-2xl mb-2">{agent.name}</div>
                  <p className="text-muted-foreground">by {agent.author}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Published {new Date(agent.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <Button size="lg" onClick={handleInstall}>
                <Download className="h-5 w-5 mr-2" />
                Install Agent
              </Button>
            </div>
          </div>
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <div className="text-base leading-relaxed">
                {agent.description}
              </div>
            </div>

            {/* Capabilities */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Capabilities</h3>
              <div className="flex flex-wrap gap-2">
                {agent.capabilities.map(capability => (
                  <Badge key={capability} variant="outline" className="text-sm py-1 px-3">
                    {capability}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
