import { ConnectionTypes } from '@/lib/types'
import React from 'react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  type: ConnectionTypes
  icon: string
  title: ConnectionTypes
  description: string
  callback?: () => void
  connected: {} & any
}

const ConnectionCard = ({
  description,
  type,
  icon,
  title,
  connected,
}: Props) => {
  return (
    <Card className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-5 py-4 shadow-sm hover:bg-white/10 transition">
  {/* Left: Icon + Info */}
  <div className="flex items-center gap-4">
    <Image
      src={icon}
      alt={title}
      height={36}
      width={36}
      className="object-contain rounded-md border border-white/10 bg-white/10 p-1"
    />
    <div className="flex flex-col">
      <CardTitle className="text-sm font-semibold text-white">
        {title}
      </CardTitle>
      <CardDescription className="text-xs text-white/60 leading-snug">
        {description}
      </CardDescription>
    </div>
  </div>

  {/* Right: Connect Button */}
  <div className="shrink-0">
    {connected[type] ? (
      <div className="rounded-md border border-green-500 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
        Connected
      </div>
    ) : (
      <Link
        href={
          title === 'Discord'
            ? process.env.NEXT_PUBLIC_DISCORD_REDIRECT!
            : title === 'Notion'
            ? process.env.NEXT_PUBLIC_NOTION_AUTH_URL!
            : title === 'Slack'
            ? process.env.NEXT_PUBLIC_SLACK_REDIRECT!
            : '#'
        }
        className="rounded-md border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition"
      >
        Connect
      </Link>
    )}
  </div>
</Card>



  )
}

export default ConnectionCard