// app/(main)/pages/settings/page.tsx
import React from 'react'
import ProfileForm from '@/components/forms/profile-form'
import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import ProfilePictureUploader from './_components/ProfilePictureUploader'
import {
  uploadProfileImage,
  removeProfileImage,
  updateUserInfo,
} from './action'

export default async function SettingsPage() {
  const authUser = await currentUser()
  if (!authUser) return null

  const user = await db.user.findUnique({
    where: { clerkId: authUser.id },
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
        Settings
      </h1>

      <div className="flex flex-col gap-10 p-6">
        <section>
          <h2 className="text-2xl font-bold">User Profile</h2>
          <p className="text-base text-white/50">
            Add or update your information
          </p>
        </section>

        {/* ← Here’s our supabase‐based uploader */}
        <ProfilePictureUploader
          initialUrl={user?.profileImage ?? ''}
          onUpload={uploadProfileImage}
          onDelete={removeProfileImage}
        />

        {/* Your existing ProfileForm hooked to the server action */}
        <ProfileForm
          user={user}
          onUpdate={updateUserInfo}
        />
      </div>
    </div>
  )
}
