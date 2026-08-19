'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export function SessionStuff() {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      localStorage.removeItem('role');
      localStorage.removeItem('schoolId');
      localStorage.clear();
    }
  }, [status]);

  return null;
}
