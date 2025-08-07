'use client'
import React, { useEffect, useState } from 'react'
import Workflow from './workflow'
import { onGetWorkflows } from '../_actions/workflow-connection'
import MoreCredits from './more-credit'

type Props = {}

const Workflows = (props: Props) => {

  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const data = await onGetWorkflows()
        setWorkflows(data || [])
      } catch (error) {
        console.error('Error fetching workflows:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkflows()
  }, [])

  if (loading) {
    return (
      <div className="relative flex flex-col gap-4">
        <section className="flex flex-col m-2">
          <div className="mt-28 flex text-muted-foreground items-center justify-center">
            Loading workflows...
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col gap-4">
      <section className="flex flex-col m-2">
        <MoreCredits />
        {workflows?.length ? (
          workflows.map((flow) => (
            <Workflow
              key={flow.id}
              {...flow}
            />
          ))
        ) : (
          <div className="mt-28 flex text-muted-foreground items-center justify-center">
            No Workflows
          </div>
        )}
      </section>
    </div>
  )
}

export default Workflows