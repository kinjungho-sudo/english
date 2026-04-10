import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const { email, password } = await req.json()
  if (!email || !password) return Response.json({ ok: false })

  const admin = createAdminClient()

  // Find the user by email
  const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error || !users) return Response.json({ ok: false })

  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) return Response.json({ ok: false, reason: 'not_found' })

  // Set the derived password on the existing account
  const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, { password })
  if (updateErr) return Response.json({ ok: false, reason: updateErr.message })

  return Response.json({ ok: true })
}
