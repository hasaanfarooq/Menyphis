import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const userUpdateSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  is_admin: z.boolean()
});

export async function PUT(request, { params }) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, is_admin } = parsed.data;

    // Check if user exists and if we are trying to update email to one that already exists
    const existingEmailCheck = await sql.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
    const duplicateEmail = Array.isArray(existingEmailCheck) ? existingEmailCheck : (existingEmailCheck.rows || existingEmailCheck);
    if (duplicateEmail.length > 0) {
      return NextResponse.json({ error: 'Email already in use by another user' }, { status: 400 });
    }

    const result = await sql.query(
      `UPDATE users SET name = $1, email = $2, is_admin = $3 WHERE id = $4 RETURNING id, name, email, avatar_url, is_admin, created_at`,
      [name, email, is_admin, id]
    );

    const updatedUser = Array.isArray(result) ? result : (result.rows || result);
    
    if (updatedUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser[0]);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // First handle related records to avoid foreign key constraints
    
    // 1. Delete wishlist items
    await sql.query('DELETE FROM wishlist WHERE user_id = $1', [id]);
    
    // 2. Delete reviews
    await sql.query('DELETE FROM reviews WHERE user_id = $1', [id]);
    
    // 3. Keep orders for history, but set user_id to NULL
    await sql.query('UPDATE orders SET user_id = NULL WHERE user_id = $1', [id]);
    
    // Now delete the user
    const result = await sql.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    const deletedUser = Array.isArray(result) ? result : (result.rows || result);
    
    if (deletedUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
