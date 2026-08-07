import { NextRequest, NextResponse } from "next/server";
import { put, list, del } from "@vercel/blob";
import { prisma } from "@/lib/db";

const BACKUP_PREFIX = "backups";
const RETENTION_WEEKS = 8;

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const folder = `${BACKUP_PREFIX}/${today}`;

  const [
    users,
    listings,
    listingImages,
    favorites,
    categories,
    categoryRequests,
    collectionPosts,
    collectionPostImages,
    postComments,
    postRatings,
    postReports,
    reviews,
    conversations,
    messages,
    siteStats,
    visitStats,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.listing.findMany(),
    prisma.listingImage.findMany(),
    prisma.favorite.findMany(),
    prisma.category.findMany(),
    prisma.categoryRequest.findMany(),
    prisma.collectionPost.findMany(),
    prisma.collectionPostImage.findMany(),
    prisma.postComment.findMany(),
    prisma.postRating.findMany(),
    prisma.postReport.findMany(),
    prisma.review.findMany(),
    prisma.conversation.findMany(),
    prisma.message.findMany(),
    prisma.siteStats.findMany(),
    prisma.visitStat.findMany(),
  ]);

  const database = {
    exportedAt: new Date().toISOString(),
    tables: {
      User: users,
      Listing: listings,
      ListingImage: listingImages,
      Favorite: favorites,
      Category: categories,
      CategoryRequest: categoryRequests,
      CollectionPost: collectionPosts,
      CollectionPostImage: collectionPostImages,
      PostComment: postComments,
      PostRating: postRatings,
      PostReport: postReports,
      Review: reviews,
      Conversation: conversations,
      Message: messages,
      SiteStats: siteStats,
      VisitStat: visitStats,
    },
  };

  await put(`${folder}/base-de-datos.json`, JSON.stringify(database, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });

  const allImages = [
    ...listingImages.map((img) => ({ id: img.id, url: img.url, kind: "listing" })),
    ...collectionPostImages.map((img) => ({ id: img.id, url: img.url, kind: "post" })),
  ];

  let imagesCopied = 0;
  let imagesFailed = 0;

  for (const img of allImages) {
    try {
      const res = await fetch(img.url);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const ext = img.url.split(".").pop()?.split("?")[0] || "jpg";
      await put(`${folder}/imagenes/${img.kind}-${img.id}.${ext}`, buffer, {
        access: "public",
        addRandomSuffix: false,
      });
      imagesCopied++;
    } catch {
      imagesFailed++;
    }
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_WEEKS * 7);

  const oldUrls: string[] = [];
  let cursor: string | undefined;
  do {
    const result = await list({ prefix: `${BACKUP_PREFIX}/`, cursor, limit: 1000 });
    for (const blob of result.blobs) {
      const match = blob.pathname.match(/^backups\/(\d{4}-\d{2}-\d{2})\//);
      if (match && new Date(match[1]) < cutoff) {
        oldUrls.push(blob.url);
      }
    }
    cursor = result.cursor;
  } while (cursor);

  if (oldUrls.length > 0) {
    await del(oldUrls);
  }

  return NextResponse.json({
    ok: true,
    folder,
    rowCounts: Object.fromEntries(Object.entries(database.tables).map(([k, v]) => [k, v.length])),
    images: { total: allImages.length, copied: imagesCopied, failed: imagesFailed },
    deletedOldBackupFiles: oldUrls.length,
  });
}
