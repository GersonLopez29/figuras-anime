import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { deleteUploadedImage } from "@/lib/uploads";

const patchSchema = z
  .object({
    isBlocked: z.boolean().optional(),
    emailVerified: z.boolean().optional(),
  })
  .refine((data) => data.isBlocked !== undefined || data.emailVerified !== undefined, {
    message: "No hay cambios para aplicar",
  });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!isAdmin(currentUser)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (id === currentUser!.id) {
    return NextResponse.json(
      { error: "No puedes bloquear tu propia cuenta" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(parsed.data.isBlocked !== undefined && { isBlocked: parsed.data.isBlocked }),
      ...(parsed.data.emailVerified !== undefined && {
        emailVerified: parsed.data.emailVerified,
        ...(parsed.data.emailVerified && { verificationToken: null, verificationTokenExpiresAt: null }),
      }),
    },
    select: { id: true, isBlocked: true, emailVerified: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!isAdmin(currentUser)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (id === currentUser!.id) {
    return NextResponse.json(
      { error: "No puedes eliminar tu propia cuenta" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    include: { listings: { include: { images: true } } },
  });
  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const images = target.listings.flatMap((listing) => listing.images);

  await prisma.user.delete({ where: { id } });
  await Promise.all(images.map((img) => deleteUploadedImage(img.url)));

  return NextResponse.json({ ok: true });
}
