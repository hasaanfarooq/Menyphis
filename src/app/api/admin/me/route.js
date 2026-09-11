import { NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/auth';

export async function GET() {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      userId: adminCtx.userId,
      name: adminCtx.name,
      email: adminCtx.email,
      role: adminCtx.role,
      isSuperAdmin: adminCtx.isSuperAdmin,
      isStoreAdmin: adminCtx.isStoreAdmin,
      storeId: adminCtx.storeId,
      storeName: adminCtx.storeName,
      storeSlug: adminCtx.storeSlug,
      storeLogo: adminCtx.storeLogo,
    });
  } catch (error) {
    console.error('Error in /api/admin/me:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
