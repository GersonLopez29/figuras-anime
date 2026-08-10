import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const OLD_HOST = "figuras-anime.vercel.app";
const NEW_HOST = "gerstore.club";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  if (host === OLD_HOST) {
    const url = new URL(request.url);
    url.host = NEW_HOST;
    url.protocol = "https";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
