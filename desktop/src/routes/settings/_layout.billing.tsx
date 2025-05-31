import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { createFileRoute } from '@tanstack/react-router'
import { Download } from "lucide-react"
import { useState } from "react"

export const Route = createFileRoute('/settings/_layout/billing')({
  component: RouteComponent,
})

export function RouteComponent() {
  const [monthlyBudget, setMonthlyBudget] = useState("100")
  const [originalBudget, setOriginalBudget] = useState("100")
  const [currentUsage] = useState({
    total: 23.47,
    breakdown: [
      { service: "OpenAI GPT-4", amount: 15.32, usage: "1,234 tokens" },
      { service: "Claude 3", amount: 6.89, usage: "892 tokens" },
      { service: "Gemini Pro", amount: 1.26, usage: "456 tokens" }
    ]
  })

  const handleSaveBudget = () => {
    setOriginalBudget(monthlyBudget)
  }

  const handleCancelBudget = () => {
    setMonthlyBudget(originalBudget)
  }

  const isBudgetValid = () => {
    const budgetValue = parseFloat(monthlyBudget)
    return !isNaN(budgetValue) && budgetValue > 0
  }

  const hasBudgetChanged = () => {
    return monthlyBudget !== originalBudget
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Billing Settings</h3>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label className="text-base font-medium">Monthly Budget & Usage</Label>
                <p className="text-sm text-muted-foreground">Current usage for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">${currentUsage.total.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">
                  {isBudgetValid() ? (
                    `of $${monthlyBudget} budget`
                  ) : (
                    'Set budget limit'
                  )}
                </div>
              </div>
            </div>

            {/* Usage Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2 mb-4">
              <div
                className={`h-2 rounded-full transition-all ${!isBudgetValid()
                  ? 'bg-muted'
                  : (currentUsage.total / parseFloat(monthlyBudget)) * 100 > 80
                    ? 'bg-destructive'
                    : (currentUsage.total / parseFloat(monthlyBudget)) * 100 > 60
                      ? 'bg-yellow-500'
                      : 'bg-primary'
                  }`}
                style={{
                  width: isBudgetValid()
                    ? `${Math.min((currentUsage.total / parseFloat(monthlyBudget)) * 100, 100)}%`
                    : '0%'
                }}
              ></div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Budget Limit</Label>
              <div className="flex items-center gap-2">
                <span className="text-2xl">$</span>
                <Input
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">per month</span>
                {hasBudgetChanged() && (
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" onClick={handleSaveBudget}>Save</Button>
                    <Button variant="outline" size="sm" onClick={handleCancelBudget}>Cancel</Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Payment Information</Label>
              <p className="text-sm text-muted-foreground">Manage your payment methods</p>
            </div>
            <Button variant="outline">Update Payment Info</Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Download Invoices</Label>
              <p className="text-sm text-muted-foreground">Download your billing history</p>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
