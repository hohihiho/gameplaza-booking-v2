'use client';

import { StackProvider } from "@stackframe/stack";
import { stackApp } from "@/stack-client";

interface StackAuthProviderProps {
  children: React.ReactNode;
}

export function StackAuthProvider({ children }: StackAuthProviderProps) {
  return (
    <StackProvider app={stackApp}>
      {children}
    </StackProvider>
  );
}