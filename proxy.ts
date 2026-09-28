import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import { PENGUJIAN_PATH, canAccessPengujian } from "@/lib/access";

const authSecret =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  process.env.GOOGLE_CLIENT_SECRET ||
  "sd-model-web-temporary-secret-change-in-vercel";

export default withAuth(
  function proxy(req) {
    // Halaman Pengujian hanya untuk akun tertentu; akun lain diarahkan ke Dashboard.
    const path = req.nextUrl.pathname;
    if ((path === PENGUJIAN_PATH || path.startsWith(`${PENGUJIAN_PATH}/`)) && !canAccessPengujian(req.nextauth.token?.email)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
    secret: authSecret,
  },
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
