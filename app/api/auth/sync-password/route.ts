import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const { email, password } = await req.json()
  if (!email || !password) return Response.json({ ok: false, reason: 'missing_fields' })

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ ok: false, reason: 'no_service_role_key' })
  }

  const admin = createAdminClient()

  // Find the user by email
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) return Response.json({ ok: false, reason: error.message })

  const user = data?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) return Response.json({ ok: false, reason: 'not_found' })

  // Set the derived password on the existing account
  const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, { password })
  if (updateErr) return Response.json({ ok: false, reason: updateErr.message })

  return Response.json({ ok: true })
}
