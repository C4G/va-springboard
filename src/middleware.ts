import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isReadOnly } from '@/utils/role';

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtectedApi =
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/auth/') &&
    pathname !== '/api/health';

  if (isProtectedApi && !req.auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (
    isProtectedApi &&
    WRITE_METHODS.includes(req.method) &&
    isReadOnly(req.auth?.user?.role)
  ) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/api/:path*'],
};
