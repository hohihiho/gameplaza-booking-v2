'use client';

import { SignUp } from '@stackframe/stack';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6">
        <SignUp 
          onSuccess={() => {
            router.push('/');
          }}
        />
      </div>
    </div>
  );
}