import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { useAuth } from "@/contexts/auth-context"
import { createFileRoute } from '@tanstack/react-router'
import { CreditCard, Loader2 } from "lucide-react"
import { useState } from "react"

export const Route = createFileRoute('/__app_layout/settings/_layout/billing')({
  component: RouteComponent,
})

export function RouteComponent() {
  const [purchaseAmount, setPurchaseAmount] = useState([50])
  const [isPurchasing, setIsPurchasing] = useState(false)
  const { user } = useAuth();

  const handlePurchaseCredits = async () => {
    const amount = purchaseAmount[0]
    setIsPurchasing(true)
    try {
      await window.electronAPI.payment.purchase(amount)
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleSliderChange = (value: number[]) => {
    setPurchaseAmount(value)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Credits & Billing</h3>

        <div className="space-y-6">
          {/* Available Credits */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label className="text-base font-medium">Available Credits</Label>
                <p className="text-sm text-muted-foreground">Your current credit balance</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">${user?.credits?.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">USD</div>
              </div>
            </div>
          </div>

          <Separator />          {/* Add Credits */}
          <div>
            <Label className="text-base font-medium mb-4 block">Add Credits</Label>

            {/* Amount Controls */}
            <div className="flex items-center gap-4 mb-4">
              {/* Slider Section */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Amount - {purchaseAmount[0]}$</Label>
                  <span className="text-sm text-muted-foreground">$10 - $500</span>
                </div>
                <Slider
                  value={purchaseAmount}
                  onValueChange={handleSliderChange}
                  max={500}
                  min={10}
                  step={10}
                />
              </div>
            </div>

            <div className="flex items-center mt-6">
              <Button
                onClick={handlePurchaseCredits}
                disabled={isPurchasing}
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Continue payment in browser
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
