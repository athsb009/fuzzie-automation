// app/(main)/pages/settings/actions.ts
'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'

export async function uploadProfileImage(imageUrl: string) {
  const authUser = await currentUser()
  if (!authUser) throw new Error('Not authenticated')
  return db.user.update({
    where: { clerkId: authUser.id },
    data: { profileImage: imageUrl },
  })
}

export async function removeProfileImage() {
  const authUser = await currentUser()
  if (!authUser) throw new Error('Not authenticated')
  return db.user.update({
    where: { clerkId: authUser.id },
    data: { profileImage: '' },
  })
}

export async function updateUserInfo(name: string) {
  const authUser = await currentUser()
  if (!authUser) throw new Error('Not authenticated')
  return db.user.update({
    where: { clerkId: authUser.id },
    data: { name },
  })
}
