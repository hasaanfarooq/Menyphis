import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';

function getKey() {
  const secretKey = process.env.JWT_SECRET || 'menyphis_default_jwt_secret_key_32bytes_min_length!';
  return new TextEncoder().encode(secretKey);
}

export async function encrypt(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getKey());
}

export async function decrypt(input) {
  try {
    const { payload } = await jwtVerify(input, getKey(), {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function setAuthCookie(user) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // #9 FIX: Only store the minimum needed fields in the JWT — never the full user row
  const minimalUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    is_admin: user.is_admin ?? false,
  };

  const session = await encrypt({ user: minimalUser, expires });

  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set('session', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}

// #7 FIX: Always verify admin status against the DB, not just the JWT claim
export async function requireAdmin() {
  const session = await getSession();
  if (!session || !session.user || !session.user.id) {
    return false;
  }

  try {
    const rows = await sql`SELECT is_admin FROM users WHERE id = ${session.user.id} LIMIT 1`;
    if (!rows || rows.length === 0) return false;
    return rows[0].is_admin === true;
  } catch {
    return false;
  }
}
