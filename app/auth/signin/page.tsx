'use client';

import { SignIn } from '@stackframe/stack';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6">
        <SignIn 
          onSuccess={() => {
            router.push('/');
          }}
        />
      </div>
    </div>
  );
}