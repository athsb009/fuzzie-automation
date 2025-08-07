import React from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardTitle } from '@/components/ui/card'

type Props = {
  credits: number
  tier: string
}

const CreditTracker = ({ credits, tier }: Props) => {
  // Get max credits for each tier
  const getMaxCredits = (tier: string) => {
    switch (tier) {
      case 'Hobby':
        return 10
      case 'Pro Plan':
        return 100
      case 'Unlimited':
        return 'Unlimited'
      default:
        return 10
    }
  }

  const maxCredits = getMaxCredits(tier)
  const currentCredits = tier === 'Unlimited' ? 'Unlimited' : credits
  const progressValue = tier === 'Unlimited' ? 100 : (credits / (typeof maxCredits === 'number' ? maxCredits : 10)) * 100

  return (
    <div className="p-6">
      <Card className="p-6">
        <CardContent className="flex flex-col gap-6">
          <CardTitle className="font-light">Credit Tracker</CardTitle>
          <Progress
            value={progressValue}
            className="w-full"
          />
          <div className="flex justify-end">
            <p>
              {currentCredits}/{maxCredits}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreditTracker