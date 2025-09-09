import { auth } from "@/lib/better-auth";
import { toNextJsHandler } from "better-auth/next-js";

// Better Auth의 모든 인증 경로를 처리
const handler = toNextJsHandler(auth);

export const { GET, POST } = handler;