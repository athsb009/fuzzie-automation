'use client'

import React, { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { db } from '@/lib/db'

type BillingProviderProps = {
  credits: string
  tier: string
  setCredits: React.Dispatch<React.SetStateAction<string>>
  setTier: React.Dispatch<React.SetStateAction<string>>
}

const initialValues: BillingProviderProps = {
  credits: '',
  setCredits: () => undefined,
  tier: '',
  setTier: () => undefined,
}

type WithChildProps = {
  children: React.ReactNode
}

const context = React.createContext(initialValues)
const { Provider } = context

export const BillingProvider = ({ children }: WithChildProps) => {
  const { user } = useUser()
  const [credits, setCredits] = React.useState(initialValues.credits)
  const [tier, setTier] = React.useState(initialValues.tier)

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const response = await fetch(`/api/user/billing?userId=${user.id}`)
          if (response.ok) {
            const userData = await response.json()
            setCredits(userData.credits || '0')
            setTier(userData.tier || 'Free')
          }
        } catch (error) {
          console.error('Error fetching user billing data:', error)
          setCredits('0')
          setTier('Free')
        }
      }
    }

    fetchUserData()
  }, [user])

  const values = {
    credits,
    setCredits,
    tier,
    setTier,
  }

  return <Provider value={values}>{children}</Provider>
}

export const useBilling = () => {
  const state = React.useContext(context)
  return state
}