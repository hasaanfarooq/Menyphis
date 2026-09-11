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

  const minimalUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    is_admin: user.is_admin ?? false,
    role: user.role || (user.is_admin ? 'super_admin' : 'customer'),
    store_id: user.store_id || null,
    store_name: user.store_name || null,
    store_slug: user.store_slug || null,
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

// Get rich admin context with store information directly verified from the DB
export async function getAdminContext() {
  const session = await getSession();
  if (!session || !session.user || !session.user.id) {
    return null;
  }

  try {
    const rows = await sql`
      SELECT u.id, u.name, u.email, u.is_admin, u.role, u.store_id,
             s.name as store_name, s.slug as store_slug, s.logo_url as store_logo
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id
      WHERE u.id = ${session.user.id} LIMIT 1
    `;
    if (!rows || rows.length === 0) return null;
    const u = rows[0];

    // Must be either an admin or store_admin
    if (!u.is_admin && u.role !== 'super_admin' && u.role !== 'store_admin') {
      return null;
    }

    const isSuperAdmin = u.role === 'super_admin' || (u.is_admin && !u.store_id);

    return {
      userId: u.id,
      name: u.name,
      email: u.email,
      is_admin: true,
      role: isSuperAdmin ? 'super_admin' : 'store_admin',
      isSuperAdmin,
      isStoreAdmin: !isSuperAdmin && !!u.store_id,
      storeId: u.store_id,
      storeName: u.store_name,
      storeSlug: u.store_slug,
      storeLogo: u.store_logo,
    };
  } catch {
    return null;
  }
}

// Check if user is either a Super Admin or Store Admin
export async function requireAdmin() {
  const ctx = await getAdminContext();
  return !!ctx;
}

// Check if user is specifically a Super Admin
export async function requireSuperAdmin() {
  const ctx = await getAdminContext();
  return ctx?.isSuperAdmin ? ctx : null;
}
