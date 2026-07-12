import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Let authentication API calls through
  if (pathname.startsWith("/api/auth")) {
    return;
  }

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isDashboardPage = pathname.startsWith("/dashboard");
  const isServerAction = req.headers.has("Next-Action");

  if (isDashboardPage && !isLoggedIn) {
    if (isServerAction) {
      // Let the server action handle the auth failure natively instead of throwing an HTML redirect
      return; 
    }
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|static|.*\\..*|_next).*)", "/"],
};
