import { auth } from "@newt-app-ssl-auth-example/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
