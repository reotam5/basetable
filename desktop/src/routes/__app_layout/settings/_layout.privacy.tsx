import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { createFileRoute } from '@tanstack/react-router'
import { FileText } from "lucide-react"

export const Route = createFileRoute('/__app_layout/settings/_layout/privacy')({
  component: RouteComponent,
})

export function RouteComponent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Privacy Statement</h3>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-medium mb-2">How We Protect Your Data</h4>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• All data is encrypted in transit using TLS 1.3</p>
                <p>• Data at rest is encrypted using AES-256 encryption</p>
                <p>• We use industry-standard security practices and regular audits</p>
                <p>• Access to your data is strictly limited and logged</p>
                <p>• Optional end-to-end encryption for sensitive data</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-base font-medium mb-2">How We Use Your Data</h4>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Conversation data is used to provide AI responses and improve service quality</p>
                <p>• Usage analytics help us optimize performance and features</p>
                <p>• We never sell your personal data to third parties</p>
                <p>• Data is only shared with your explicit consent or legal requirement</p>
                <p>• You can request data deletion at any time</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-4">
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Full Privacy Policy
              </Button>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Terms of Service
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
