"use client";
import { StackClientApp } from "@stackframe/stack";

export const stackApp = new StackClientApp({
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
});