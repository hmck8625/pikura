import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = process.env.MICROCMS_WEBHOOK_SECRET;

  if (secret) {
    const signature = request.headers.get("x-microcms-signature");
    if (signature !== secret) {
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 401 },
      );
    }
  }

  let payload: { api?: string; id?: string; contents?: { new?: { slug?: string } } };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body" },
      { status: 400 },
    );
  }

  if (payload.api === "articles") {
    revalidatePath("/articles", "layout");
    revalidatePath("/", "layout");

    const slug = payload.contents?.new?.slug;
    if (slug) {
      revalidatePath(`/articles/${slug}`, "page");
    }
  }

  return NextResponse.json({ revalidated: true });
}
