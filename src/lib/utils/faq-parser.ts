/**
 * 記事HTMLからFAQセクションを自動検出・パースする。
 * <h2>よくある質問</h2> or <h2>FAQ</h2> セクション内の
 * <h3>質問</h3> + 続くテキストを Q&A ペアとして抽出。
 */
export function extractFAQFromHTML(
  html: string,
): { question: string; answer: string }[] | null {
  const faqHeaderRegex = /<h2[^>]*>([^<]*(?:よくある質問|FAQ)[^<]*)<\/h2>/i;
  const faqMatch = html.match(faqHeaderRegex);
  if (!faqMatch || faqMatch.index === undefined) return null;

  const faqStartIndex = faqMatch.index + faqMatch[0].length;

  // 次の<h2>までがFAQセクション
  const remainingHtml = html.slice(faqStartIndex);
  const nextH2Match = remainingHtml.match(/<h2[^>]*>/);
  const faqSectionHtml = nextH2Match
    ? remainingHtml.slice(0, nextH2Match.index)
    : remainingHtml;

  // <h3>タグで分割してQ&Aペアを抽出
  const parts = faqSectionHtml.split(/<h3[^>]*>/);
  const items: { question: string; answer: string }[] = [];

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const closingH3Index = part.indexOf("</h3>");
    if (closingH3Index === -1) continue;

    const question = part
      .slice(0, closingH3Index)
      .replace(/<[^>]*>/g, "")
      .trim();
    const answerHtml = part.slice(closingH3Index + 5);
    const answer = answerHtml.replace(/<[^>]*>/g, "").trim();

    if (question && answer) {
      items.push({ question, answer });
    }
  }

  return items.length >= 2 ? items : null;
}
