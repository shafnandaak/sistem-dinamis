import { withAuth } from "next-auth/middleware";

const authSecret =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  process.env.GOOGLE_CLIENT_SECRET;

export default withAuth({
  pages: {
    signIn: "/login",
  },
  secret: authSecret,
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};