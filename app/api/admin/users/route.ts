import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET: List all users with their profiles
export async function GET(request: NextRequest) {
  try {
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    if (authError) throw authError

    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
    if (profileError) throw profileError

    const usersWithProfiles = authUsers.users.map(user => {
      const profile = profiles?.find(p => p.id === user.id)
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed: !!user.email_confirmed_at,
        profile: profile || null,
      }
    })

    return NextResponse.json({ data: usersWithProfiles })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Change user password or update profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, newPassword, tokens, email } = body

    if (action === 'change_password') {
      if (!userId || !newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'Contraseña debe tener al menos 6 caracteres' }, { status: 400 })
      }
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
      })
      if (error) throw error
      return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente' })
    }

    if (action === 'update_tokens') {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ tokens })
        .eq('id', userId)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === 'send_reset_email') {
      const { error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
      })
      if (error) throw error
      return NextResponse.json({ success: true, message: 'Email de recuperación enviado' })
    }

    if (action === 'confirm_email') {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true
      })
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
