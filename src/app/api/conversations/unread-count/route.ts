import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const count = await prisma.message.count({
    where: {
      readAt: null,
      senderId: { not: user.id },
      conversation: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    },
  });

  return NextResponse.json({ count });
}
