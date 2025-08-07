// app/(main)/pages/settings/_components/SupabaseImageUploader.tsx
'use client'

import { useState, ChangeEvent } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

interface SupabaseImageUploaderProps {
  onUpload: (url: string) => void
}

export default function SupabaseImageUploader({ onUpload }: SupabaseImageUploaderProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show local preview
    const previewUrl = URL.createObjectURL(file)
    setLocalPreview(previewUrl)
    setError(null)
    setLoading(true)

    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`

    try {
      // 1️⃣ Upload the file
      const { error: uploadError } = await supabase
        .storage
        .from('avatar')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      // 2️⃣ Get the public URL
      const { data } = supabase
        .storage
        .from('avatar')
        .getPublicUrl(fileName)

      if (data?.publicUrl) {
        onUpload(data.publicUrl)
      } else {
        throw new Error('Failed to retrieve public URL')
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message ?? 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Choose an avatar
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={loading}
        className="block w-full text-sm text-gray-600
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0
                   file:text-sm file:font-semibold
                   file:bg-blue-50 file:text-blue-700
                   hover:file:bg-blue-100
                   disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {loading && <p className="text-sm text-blue-500">Uploading…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {localPreview && (
  <>
    <div className="w-32 h-32 relative rounded-full overflow-hidden mt-2 ring-2 ring-gray-200">
      <Image
        src={localPreview}
        alt="Local preview"
        fill
        className="object-cover"
      />
    </div>
    <div className="w-32 h-32 rounded-full overflow-hidden mt-2 ring-2 ring-gray-200">
      <img src={localPreview} alt="Local preview" className="object-cover w-full h-full"/>
    </div>
  </>
)}
    </div>
  )
}
