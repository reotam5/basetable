import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Link } from "@tanstack/react-router"
import { Bot, Search } from "lucide-react"
import { useEffect, useState } from "react"

interface LibraryAgent {
  id: number
  name: string
  description: string
  capabilities: string[]
  author: string
  createdAt: string
}

// Mock data for demonstration
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

export function LibrarySearchPage() {
  const [searchQuery, setSearchQuery] = useState(() => {
    // Initialize from localStorage or URL params
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get('q') || localStorage.getItem('library-search-query') || ''
    }
    return ''
  })

  // Update localStorage and URL when search query changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (searchQuery) {
        localStorage.setItem('library-search-query', searchQuery)
        const url = new URL(window.location.href)
        url.searchParams.set('q', searchQuery)
        window.history.replaceState({}, '', url.toString())
      } else {
        localStorage.removeItem('library-search-query')
        const url = new URL(window.location.href)
        url.searchParams.delete('q')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [searchQuery])

  // Filter agents based on search query
  const filteredAgents = mockLibraryAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.capabilities.some(cap => cap.toLowerCase().includes(searchQuery.toLowerCase())) ||
      agent.author.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <div className="flex-1 space-y-6 p-6 mx-auto max-w-5xl w-full">
        {/* Header */}
        <div className="border-b pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Search className="h-8 w-8" />
            Discover Agents
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Find and install agents shared by the community to enhance your workflow.
          </p>
        </div>

        {/* Search */}
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agents..."
              className="pl-10"
            />
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground">
            {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAgents.map(agent => (
            <Link
              key={agent.id}
              to="/library/search/$lib_id"
              params={{ lib_id: agent.id.toString() }}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow h-64 flex flex-col cursor-pointer">
                <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">by {agent.author}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <CardDescription className="text-sm leading-relaxed line-clamp-3 flex-shrink-0">
                    {agent.description}
                  </CardDescription>

                  {/* Capabilities */}
                  <div className="flex flex-wrap gap-1 flex-shrink-0 min-h-[24px]">
                    {agent.capabilities.slice(0, 2).map(capability => (
                      <Badge key={capability} variant="outline" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                    {agent.capabilities.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{agent.capabilities.length - 2} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredAgents.length === 0 && (
          <div className="text-center py-12">
            <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No agents found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search query to find more agents.
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}