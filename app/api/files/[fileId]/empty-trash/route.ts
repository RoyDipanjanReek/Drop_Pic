import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import ImageKit from "imagekit";
import { NextRequest, NextResponse } from "next/server";

//Image Kit Credentials are here----------
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
});
//Image Kit Credentials are here----------

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ fileId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //get all file from trash location
    const trashedFiles = await db
      .select()
      .from(files)
      .where(and(eq(files.userId, userId), eq(files.isTrash, true)));

    if (trashedFiles.length === 0) {
      return NextResponse.json(
        { message: "No files found in trash" },
        { status: 200 }
      );
    }

    const deletePromises = trashedFiles
      .filter((file) => !file.isFolder)
      .map(async (file) => {});
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete all trash files" },
      { status: 200 }
    );
  }
}
