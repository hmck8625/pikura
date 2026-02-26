import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");

  switch (type) {
    case "player":
      return renderPlayerOg(searchParams);
    case "article":
      return renderArticleOg(searchParams);
    default:
      return renderDefaultOg();
  }
}

function renderPlayerOg(searchParams: URLSearchParams) {
  const name = searchParams.get("name") ?? "選手";
  const rank = searchParams.get("rank") ?? "-";
  const points = searchParams.get("points") ?? "0";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0f172a",
          padding: "60px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 28, color: "#94a3b8", fontWeight: "bold" }}>
            pikura
          </div>
          <div style={{ fontSize: 20, color: "#64748b" }}>
            JPA公式ランキング
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "60px",
          }}
        >
          {/* Rank circle */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0EA5E9, #10B981)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 72,
                fontWeight: "bold",
                color: "#ffffff",
              }}
            >
              {rank}
            </div>
            <div
              style={{ fontSize: 20, color: "#94a3b8", marginTop: 12 }}
            >
              位
            </div>
          </div>

          {/* Player info */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 56,
                fontWeight: "bold",
                color: "#f8fafc",
                lineHeight: 1.2,
              }}
            >
              {name}
            </div>
            <div
              style={{
                fontSize: 32,
                color: "#94a3b8",
                marginTop: 16,
              }}
            >
              合計 {Number(points).toLocaleString()} pt
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize: 18, color: "#475569" }}>
          pikura.app — 日本最大のピックルボールプラットフォーム
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

function renderArticleOg(searchParams: URLSearchParams) {
  const title = searchParams.get("title") ?? "記事";

  // Truncate long titles
  const displayTitle = title.length > 40 ? title.slice(0, 40) + "…" : title;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          padding: "60px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: 28, color: "#0EA5E9", fontWeight: "bold" }}>
            pikura
          </div>
          <div
            style={{
              fontSize: 16,
              color: "#64748b",
              backgroundColor: "#f1f5f9",
              padding: "4px 12px",
              borderRadius: 6,
            }}
          >
            ARTICLE
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 52,
              fontWeight: "bold",
              color: "#0f172a",
              lineHeight: 1.3,
              maxWidth: "90%",
            }}
          >
            {displayTitle}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 18, color: "#94a3b8" }}>
            pikura.app
          </div>
          <div style={{ fontSize: 18, color: "#94a3b8" }}>
            日本最大のピックルボールプラットフォーム
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

function renderDefaultOg() {
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
          backgroundColor: "#0f172a",
          padding: "60px",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: "bold",
            color: "#f8fafc",
            marginBottom: 24,
          }}
        >
          pikura
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#94a3b8",
            textAlign: "center",
          }}
        >
          日本最大のピックルボールプラットフォーム
        </div>
        <div
          style={{
            fontSize: 20,
            color: "#64748b",
            marginTop: 32,
          }}
        >
          ランキング・記事・大会情報・ペア募集
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
