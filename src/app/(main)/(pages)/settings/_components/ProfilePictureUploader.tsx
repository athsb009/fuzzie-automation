// app/(main)/pages/settings/_components/ProfilePictureUploader.tsx
'use client'

import { useState } from 'react'
import SupabaseImageUploader from './SupabaseImageUploader'

interface Props {
  initialUrl: string
  onUpload: (url: string) => Promise<any>
  onDelete: () => Promise<any>
}

export default function ProfilePictureUploader({ initialUrl, onUpload, onDelete }: Props) {
  const [photo, setPhoto] = useState<string>(initialUrl)
  const [busy, setBusy] = useState(false)

  const handleUpload = async (url: string) => {
    setBusy(true)
    await onUpload(url)
    setPhoto(url)
    setBusy(false)
  }

  const handleRemove = async () => {
    setBusy(true)
    await onDelete()
    setPhoto('')
    setBusy(false)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-32 h-32 rounded-full overflow-hidden ring-2 ring-gray-200">
        {photo ? (
          <img src={photo} className="w-full h-full object-cover" alt="avatar" />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
      </div>

      <div className="flex gap-2">
        <SupabaseImageUploader onUpload={handleUpload} />
        {photo && (
          <button
            onClick={handleRemove}
            disabled={busy}
            className="px-3 py-1 rounded bg-red-500 text-white disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
