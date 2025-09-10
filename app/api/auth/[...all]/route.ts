import { auth } from "@/lib/auth/server";
import { toNextJsHandler } from "better-auth/next-js";

// Better Auth catch-all 핸들러 - 모든 HTTP 메서드 지원
export const { GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS } = toNextJsHandler(auth);