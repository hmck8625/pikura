import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const title = getTitle(type, searchParams);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          padding: "40px",
        }}
      >
        <div
          style={{
            fontSize: 24,
            color: "#666666",
            marginBottom: 20,
          }}
        >
          pikura
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: "bold",
            color: "#111111",
            textAlign: "center",
            maxWidth: "80%",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 20,
            color: "#888888",
            marginTop: 20,
          }}
        >
          日本最大のピックルボールプラットフォーム
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

function getTitle(
  type: string | null,
  searchParams: URLSearchParams
): string {
  switch (type) {
    case "player": {
      const username = searchParams.get("username") ?? "";
      return `${username} - 選手ページ`;
    }
    case "article": {
      const slug = searchParams.get("slug") ?? "";
      return slug;
    }
    case "event": {
      const id = searchParams.get("id") ?? "";
      return `イベント #${id}`;
    }
    default:
      return "ピクラ - 日本最大のピックルボールプラットフォーム";
  }
}
