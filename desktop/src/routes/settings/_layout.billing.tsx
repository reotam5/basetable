import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useSettings } from "@/hooks/use-settings"
import { createFileRoute } from '@tanstack/react-router'
import { Download } from "lucide-react"
import { useEffect, useState } from "react"

export const Route = createFileRoute('/settings/_layout/billing')({
  component: RouteComponent,
})

export function RouteComponent() {
  const { settings: [savedBudget], setSetting } = useSettings({ keys: ["billing.budget"] });
  const [currentUsage] = useState({ total: 23.47 })
  const [newBudget, setNewBudget] = useState<number | null>(null);

  useEffect(() => {
    setNewBudget(savedBudget)
  }, [savedBudget]);

  const handleSaveBudget = () => {
    setSetting("billing.budget", newBudget)
  }

  const handleCancelBudget = () => {
    setNewBudget(savedBudget)
  }

  const isBudgetValid = () => {
    if (newBudget === null || newBudget === undefined) return false;
    const budgetValue = parseFloat(String(newBudget));
    return !isNaN(budgetValue) && budgetValue > 0;
  }

  const getBudgetValue = () => {
    return newBudget || 0;
  }

  const hasBudgetChanged = () => {
    return newBudget !== savedBudget
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
                    `of $${getBudgetValue()} budget`
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
                  : (currentUsage.total / getBudgetValue()) * 100 > 80
                    ? 'bg-destructive'
                    : (currentUsage.total / getBudgetValue()) * 100 > 60
                      ? 'bg-yellow-500'
                      : 'bg-primary'
                  }`}
                style={{
                  width: isBudgetValid()
                    ? `${Math.min((currentUsage.total / getBudgetValue()) * 100, 100)}%`
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
                  value={newBudget || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewBudget(value === '' ? null : parseFloat(value));
                  }}
                  className="w-32"
                  placeholder="0.00"
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
