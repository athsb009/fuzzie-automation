import React, { useMemo } from 'react'
import { Position, useNodeId } from 'reactflow'
import clsx from 'clsx'

import { EditorCanvasCardType } from '@/lib/types'
import { useEditor } from '@/providers/editor-provider'
import EditorCanvasIconHelper from './editor-canvas-card-icon-helper'
import CustomHandle from './custom-handle'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const EditorCanvasCardSingle = ({ data }: { data: EditorCanvasCardType }) => {
  const { dispatch, state } = useEditor()
  const nodeId = useNodeId()

  const logo = useMemo(() => <EditorCanvasIconHelper type={data.type} />, [data.type])

  // Determine health indicator color
  const statusColor = useMemo(() => {
    const rand = Math.random()
    if (rand < 0.6) return 'bg-green-500'
    if (rand < 0.8) return 'bg-orange-500'
    return 'bg-red-500'
  }, [])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const node = state.editor.elements.find((n) => n.id === nodeId)
    if (node) {
      dispatch({
        type: 'SELECTED_ELEMENT',
        payload: { element: node },
      })
    }
  }

  return (
    <>
      {data.type !== 'Trigger' && data.type !== 'Google Drive' && (
        <CustomHandle
          type="target"
          position={Position.Top}
          style={{ zIndex: 100 }}
        />
      )}

<Card
  onClick={handleClick}
  className="relative w-[300px] bg-white/5 border border-white/10 backdrop-blur-md p-3 rounded-xl shadow-md transition hover:bg-white/10 cursor-pointer"
>
  <CardHeader className="flex items-center gap-3 p-0">
    <div className="text-white">{logo}</div>
    <div className="flex flex-col">
      <CardTitle className="text-sm font-semibold text-white">
        {data.title}
      </CardTitle>
      <CardDescription className="text-xs text-white/60">
        <p className="truncate max-w-[250px]">
          <b className="text-white/80">ID:</b> {nodeId}
        </p>
        <p className="mt-1">{data.description}</p>
      </CardDescription>
    </div>
  </CardHeader>

  <Badge variant="secondary" className="absolute top-2 right-2">
    {data.type}
  </Badge>

  <div
    className={clsx(
      'absolute left-2 top-2 h-2 w-2 rounded-full',
      statusColor
    )}
  ></div>
</Card>

      <CustomHandle
        type="source"
        position={Position.Bottom}
        id="a"
      />
    </>
  )
}

export default EditorCanvasCardSingle
