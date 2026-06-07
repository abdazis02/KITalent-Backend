'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

/** Entry point: send authenticated users to the dashboard, others to login. */
export default function Index() {
  const router = useRouter();
  useEffect(() => {
    router.replace(auth.isAuthenticated ? '/dashboard' : '/login');
  }, [router]);
  return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">…</div>;
}
