import type { JpaRankingEntry, PlayerSummary } from "./types";

// JPA公式ランキング 2026年1月データ
// Source: https://japanpickleball.org/news/information-other/detail5576/
const RAW_DATA: JpaRankingEntry[] = [
  // 男子シングルス 19+
  { category: "男子シングルス", ageGroup: "19+", rank: 1, playerName: "東村 大祐", points: 68, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 2, playerName: "Hiroki Tanimura", points: 61, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 3, playerName: "Koya Nakaema", points: 38, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 4, playerName: "雅登 野崎", points: 34, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 4, playerName: "裕規 藤井", points: 34, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 6, playerName: "Yui Akimoto", points: 28, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 7, playerName: "Yuichiro Aoki", points: 23, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 8, playerName: "Katayama Hayato", points: 19, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 9, playerName: "Naruki Ohara", points: 9, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 9, playerName: "Yoshikuni Okumura", points: 9, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 9, playerName: "Yuki Karasawa", points: 9, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 9, playerName: "Yuto Sakurai", points: 9, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 9, playerName: "潤 登内", points: 9, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 9, playerName: "田中 健貴", points: 9, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 9, playerName: "茂樹 岩田", points: 9, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 16, playerName: "Koki Naruyama", points: 4, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 16, playerName: "Masamichi Yoshii", points: 4, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 16, playerName: "Takeo Inoue", points: 4, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 16, playerName: "Tatsuya Igai", points: 4, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 16, playerName: "Yuki Akimoto", points: 4, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 16, playerName: "Yuki Emura", points: 4, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 16, playerName: "信大 田坂", points: 4, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 16, playerName: "哲也 中見", points: 4, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "19+", rank: 16, playerName: "涼 中西", points: 4, period: "2026-01" },
  // 男子シングルス 35+
  { category: "男子シングルス", ageGroup: "35+", rank: 1, playerName: "Yohei Koide", points: 38, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "35+", rank: 2, playerName: "裕規 藤井", points: 28, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "35+", rank: 3, playerName: "Akira Okubo", points: 19, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "35+", rank: 3, playerName: "Omi Taka", points: 19, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "35+", rank: 5, playerName: "Hideaki Sakakura", points: 9, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "35+", rank: 5, playerName: "東房 聡史", points: 9, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "35+", rank: 5, playerName: "Yuuki Watanabe", points: 9, period: "2026-01" },
  // 男子シングルス 50+
  { category: "男子シングルス", ageGroup: "50+", rank: 1, playerName: "Yoshikuni Okumura", points: 38, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "50+", rank: 2, playerName: "真寛 小手川", points: 28, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "50+", rank: 3, playerName: "Shintaro Kuroiwa", points: 19, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "50+", rank: 3, playerName: "Taro Akiyama", points: 19, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "50+", rank: 5, playerName: "中村 哲二", points: 9, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "50+", rank: 5, playerName: "Shikama Koji", points: 9, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "50+", rank: 5, playerName: "Takahiro Shimokawa", points: 9, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "50+", rank: 5, playerName: "Takashi Higuchi", points: 9, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "50+", rank: 9, playerName: "Osamu Watanabe", points: 4, period: "2026-01" },
  { category: "男子シングルス", ageGroup: "50+", rank: 9, playerName: "マーク和夫 西山", points: 4, period: "2026-01" },
  // 男子ダブルス 19+
  { category: "男子ダブルス", ageGroup: "19+", rank: 1, playerName: "Tomoki Kajiyama", points: 270, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 2, playerName: "Taichi Makino", points: 176, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 2, playerName: "泰雅 毛利", points: 176, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 4, playerName: "Yuki Sugiyama", points: 169, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 5, playerName: "英司 山内", points: 163, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 6, playerName: "Akihiko Nishimura", points: 159, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 7, playerName: "Yuta Yoshida", points: 150, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 8, playerName: "聖 宮本", points: 126, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 9, playerName: "黒澤 陸人", points: 125, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 9, playerName: "津島 巧", points: 125, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 11, playerName: "Koya Nakaema", points: 115, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 12, playerName: "Masato Hira", points: 94, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 12, playerName: "Nasa Hatakeyama", points: 94, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 14, playerName: "Yusuke Yoshitani", points: 91, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 15, playerName: "Daisuke Araki", points: 82, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 15, playerName: "大前 倭生", points: 82, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 17, playerName: "潤 登内", points: 75, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 18, playerName: "允彦 村川", points: 69, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 19, playerName: "Shoki Mori", points: 65, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 20, playerName: "Kouta Kagawa", points: 63, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 20, playerName: "Kyou Inomata", points: 63, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 20, playerName: "Matsuo Yudai", points: 63, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "19+", rank: 20, playerName: "Ogino Sho", points: 63, period: "2026-01" },
  // 男子ダブルス 35+
  { category: "男子ダブルス", ageGroup: "35+", rank: 1, playerName: "Hiroki Tanimura", points: 87, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "35+", rank: 2, playerName: "Akio Hidaka", points: 68, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "35+", rank: 3, playerName: "Akira Ogawa", points: 52, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "35+", rank: 3, playerName: "涼平 山谷", points: 52, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "35+", rank: 5, playerName: "東房 聡史", points: 47, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "35+", rank: 5, playerName: "裕規 藤井", points: 47, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "35+", rank: 7, playerName: "Daisuke Yamashita", points: 34, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "35+", rank: 7, playerName: "Jumpei Kawamoto", points: 34, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "35+", rank: 7, playerName: "将人 馬島", points: 34, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "35+", rank: 7, playerName: "博文 赤松", points: 34, period: "2026-01" },
  // 男子ダブルス 50+
  { category: "男子ダブルス", ageGroup: "50+", rank: 1, playerName: "Yoshikuni Okumura", points: 76, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "50+", rank: 2, playerName: "Shintaro Kuroiwa", points: 38, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "50+", rank: 2, playerName: "真寛 小手川", points: 38, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "50+", rank: 4, playerName: "Kevin Truong", points: 28, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "50+", rank: 4, playerName: "Tadahiko Hora", points: 28, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "50+", rank: 4, playerName: "Takahiro Shimokawa", points: 28, period: "2026-01" },
  { category: "男子ダブルス", ageGroup: "50+", rank: 4, playerName: "小野 亮二", points: 28, period: "2026-01" },
  // 女子シングルス 19+
  { category: "女子シングルス", ageGroup: "19+", rank: 1, playerName: "Akane Hikawa", points: 38, period: "2026-01" },
  { category: "女子シングルス", ageGroup: "19+", rank: 1, playerName: "福原 麻尋", points: 38, period: "2026-01" },
  { category: "女子シングルス", ageGroup: "19+", rank: 3, playerName: "莉菜 上田", points: 28, period: "2026-01" },
  { category: "女子シングルス", ageGroup: "19+", rank: 3, playerName: "Megumu Higashi", points: 28, period: "2026-01" },
  { category: "女子シングルス", ageGroup: "19+", rank: 5, playerName: "Miho Imada", points: 19, period: "2026-01" },
  { category: "女子シングルス", ageGroup: "19+", rank: 5, playerName: "聖沙 山田", points: 19, period: "2026-01" },
  { category: "女子シングルス", ageGroup: "19+", rank: 5, playerName: "Sayaka Yamamoto", points: 19, period: "2026-01" },
  { category: "女子シングルス", ageGroup: "19+", rank: 8, playerName: "Yurin Kinoshita", points: 9, period: "2026-01" },
  // 女子シングルス 50+
  { category: "女子シングルス", ageGroup: "50+", rank: 1, playerName: "Mika Ueda", points: 38, period: "2026-01" },
  { category: "女子シングルス", ageGroup: "50+", rank: 2, playerName: "Yukie Mori", points: 28, period: "2026-01" },
  { category: "女子シングルス", ageGroup: "50+", rank: 3, playerName: "Ai Terada", points: 19, period: "2026-01" },
  { category: "女子シングルス", ageGroup: "50+", rank: 3, playerName: "Kiriko Ota", points: 19, period: "2026-01" },
  { category: "女子シングルス", ageGroup: "50+", rank: 5, playerName: "さおり 中村", points: 9, period: "2026-01" },
  { category: "女子シングルス", ageGroup: "50+", rank: 5, playerName: "Keiko Tajima", points: 9, period: "2026-01" },
  { category: "女子シングルス", ageGroup: "50+", rank: 5, playerName: "Hirono Arihama", points: 9, period: "2026-01" },
  // 女子ダブルス 19+
  { category: "女子ダブルス", ageGroup: "19+", rank: 1, playerName: "Kanako Tsujimaru", points: 188, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "19+", rank: 2, playerName: "Haruna Masuda", points: 183, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "19+", rank: 2, playerName: "Misato Koroyasu", points: 183, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "19+", rank: 4, playerName: "Mayumi Yamamoto", points: 156, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "19+", rank: 5, playerName: "Yako Ohno", points: 131, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "19+", rank: 6, playerName: "大森 万由", points: 125, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "19+", rank: 6, playerName: "福原 麻尋", points: 125, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "19+", rank: 8, playerName: "後藤 由希", points: 104, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "19+", rank: 9, playerName: "Fukunaga Hinano", points: 100, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "19+", rank: 9, playerName: "Seina Shima", points: 100, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "19+", rank: 9, playerName: "野口 怜莉", points: 100, period: "2026-01" },
  // 女子ダブルス 35+
  { category: "女子ダブルス", ageGroup: "35+", rank: 1, playerName: "Maya Goto", points: 38, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "35+", rank: 1, playerName: "Haruka Gomi", points: 38, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "35+", rank: 3, playerName: "Yumiko Sakai", points: 28, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "35+", rank: 3, playerName: "Lin Lin Wang", points: 28, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "35+", rank: 5, playerName: "Ayako Gushi", points: 19, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "35+", rank: 5, playerName: "Sayuri Sato", points: 19, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "35+", rank: 5, playerName: "Ryoko Yamasaki", points: 19, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "35+", rank: 5, playerName: "Asano Yamakawa", points: 19, period: "2026-01" },
  // 女子ダブルス 50+
  { category: "女子ダブルス", ageGroup: "50+", rank: 1, playerName: "Hitomi Matsuo", points: 66, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "50+", rank: 1, playerName: "Maki Yamasaki", points: 66, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "50+", rank: 1, playerName: "Yoko Yamamoto", points: 66, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "50+", rank: 1, playerName: "麻里子 渡部", points: 66, period: "2026-01" },
  { category: "女子ダブルス", ageGroup: "50+", rank: 5, playerName: "Keiko Tajima", points: 38, period: "2026-01" },
  // 混合ダブルス(男性) 19+
  { category: "混合ダブルス(男性)", ageGroup: "19+", rank: 1, playerName: "Yuki Sugiyama", points: 244, period: "2026-01" },
  { category: "混合ダブルス(男性)", ageGroup: "19+", rank: 2, playerName: "晴暉 加藤", points: 206, period: "2026-01" },
  { category: "混合ダブルス(男性)", ageGroup: "19+", rank: 3, playerName: "Tomoki Kajiyama", points: 154, period: "2026-01" },
  { category: "混合ダブルス(男性)", ageGroup: "19+", rank: 4, playerName: "允彦 村川", points: 138, period: "2026-01" },
  { category: "混合ダブルス(男性)", ageGroup: "19+", rank: 4, playerName: "英司 山内", points: 138, period: "2026-01" },
  { category: "混合ダブルス(男性)", ageGroup: "19+", rank: 6, playerName: "Nasa Hatakeyama", points: 125, period: "2026-01" },
  { category: "混合ダブルス(男性)", ageGroup: "19+", rank: 7, playerName: "Takuma Tsukimura", points: 115, period: "2026-01" },
  { category: "混合ダブルス(男性)", ageGroup: "19+", rank: 8, playerName: "Taichi Makino", points: 101, period: "2026-01" },
  { category: "混合ダブルス(男性)", ageGroup: "19+", rank: 9, playerName: "Ogino Sho", points: 78, period: "2026-01" },
  { category: "混合ダブルス(男性)", ageGroup: "19+", rank: 9, playerName: "Yusuke Yoshitani", points: 78, period: "2026-01" },
  // 混合ダブルス(女性) 19+
  { category: "混合ダブルス(女性)", ageGroup: "19+", rank: 1, playerName: "Fukunaga Hinano", points: 244, period: "2026-01" },
  { category: "混合ダブルス(女性)", ageGroup: "19+", rank: 2, playerName: "福原 麻尋", points: 188, period: "2026-01" },
  { category: "混合ダブルス(女性)", ageGroup: "19+", rank: 3, playerName: "Haruna Masuda", points: 179, period: "2026-01" },
  { category: "混合ダブルス(女性)", ageGroup: "19+", rank: 4, playerName: "Misato Koroyasu", points: 173, period: "2026-01" },
  { category: "混合ダブルス(女性)", ageGroup: "19+", rank: 5, playerName: "まほ ひらた", points: 151, period: "2026-01" },
  { category: "混合ダブルス(女性)", ageGroup: "19+", rank: 6, playerName: "Rika Fujiwara", points: 125, period: "2026-01" },
  { category: "混合ダブルス(女性)", ageGroup: "19+", rank: 7, playerName: "Seina Shima", points: 113, period: "2026-01" },
  { category: "混合ダブルス(女性)", ageGroup: "19+", rank: 8, playerName: "野口 怜莉", points: 101, period: "2026-01" },
  { category: "混合ダブルス(女性)", ageGroup: "19+", rank: 9, playerName: "池添 愛里", points: 96, period: "2026-01" },
  { category: "混合ダブルス(女性)", ageGroup: "19+", rank: 10, playerName: "Yako Ohno", points: 78, period: "2026-01" },
  // 混合ダブルス(男性) 50+
  { category: "混合ダブルス(男性)", ageGroup: "50+", rank: 1, playerName: "岳二 岡田", points: 38, period: "2026-01" },
  { category: "混合ダブルス(男性)", ageGroup: "50+", rank: 1, playerName: "勉 中村", points: 38, period: "2026-01" },
  { category: "混合ダブルス(男性)", ageGroup: "50+", rank: 3, playerName: "健弥 渡邉", points: 28, period: "2026-01" },
  { category: "混合ダブルス(男性)", ageGroup: "50+", rank: 3, playerName: "真寛 小手川", points: 28, period: "2026-01" },
  { category: "混合ダブルス(男性)", ageGroup: "50+", rank: 5, playerName: "Atsushi Takimoto", points: 19, period: "2026-01" },
  { category: "混合ダブルス(男性)", ageGroup: "50+", rank: 5, playerName: "Hiroshi Mano", points: 19, period: "2026-01" },
  { category: "混合ダブルス(男性)", ageGroup: "50+", rank: 5, playerName: "John Howrey", points: 19, period: "2026-01" },
  { category: "混合ダブルス(男性)", ageGroup: "50+", rank: 5, playerName: "Shintaro Kuroiwa", points: 19, period: "2026-01" },
  // 混合ダブルス(女性) 50+
  { category: "混合ダブルス(女性)", ageGroup: "50+", rank: 1, playerName: "美弥 岡田", points: 38, period: "2026-01" },
  { category: "混合ダブルス(女性)", ageGroup: "50+", rank: 1, playerName: "Yoshiko Mano", points: 38, period: "2026-01" },
  { category: "混合ダブルス(女性)", ageGroup: "50+", rank: 3, playerName: "麻里子 渡部", points: 28, period: "2026-01" },
  { category: "混合ダブルス(女性)", ageGroup: "50+", rank: 3, playerName: "ひとみ 渡邉", points: 28, period: "2026-01" },
  { category: "混合ダブルス(女性)", ageGroup: "50+", rank: 5, playerName: "Kiyoko Inayama", points: 19, period: "2026-01" },
  { category: "混合ダブルス(女性)", ageGroup: "50+", rank: 5, playerName: "Ai Terada", points: 19, period: "2026-01" },
  { category: "混合ダブルス(女性)", ageGroup: "50+", rank: 5, playerName: "Michiyo Nakayama", points: 19, period: "2026-01" },
  { category: "混合ダブルス(女性)", ageGroup: "50+", rank: 5, playerName: "Tomoko Takimoto", points: 19, period: "2026-01" },
];

// 名前の正規化（名寄せ用）
function normalizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// スラグ生成
function generateSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[()（）]/g, "");
}

// 全ランキングエントリ（正規化済み）
function getNormalizedData(): JpaRankingEntry[] {
  return RAW_DATA.map((entry) => ({
    ...entry,
    playerName: normalizeName(entry.playerName),
  }));
}

// カテゴリ + 年齢グループでフィルターしたランキングを取得
export function getRankings(
  category?: string,
  ageGroup?: string
): JpaRankingEntry[] {
  let data = getNormalizedData();
  if (category) {
    data = data.filter((d) => d.category === category);
  }
  if (ageGroup) {
    data = data.filter((d) => d.ageGroup === ageGroup);
  }
  return data.sort((a, b) => a.rank - b.rank);
}

// 利用可能なカテゴリ+年齢グループの組み合わせ一覧
export function getAvailableFilters(): {
  category: string;
  ageGroup: string;
  count: number;
}[] {
  const data = getNormalizedData();
  const map = new Map<string, number>();
  for (const entry of data) {
    const key = `${entry.category}|${entry.ageGroup}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([key, count]) => {
    const [category, ageGroup] = key.split("|");
    return { category, ageGroup, count };
  });
}

// 全選手のサマリーリストを取得
export function getAllPlayers(): PlayerSummary[] {
  const data = getNormalizedData();
  const playerMap = new Map<string, PlayerSummary>();

  for (const entry of data) {
    const slug = generateSlug(entry.playerName);
    const existing = playerMap.get(slug);

    if (existing) {
      existing.rankings.push({
        category: entry.category,
        ageGroup: entry.ageGroup,
        rank: entry.rank,
        points: entry.points,
      });
      existing.totalPoints += entry.points;
      if (entry.rank < existing.bestRank) {
        existing.bestRank = entry.rank;
        existing.bestCategory = entry.category;
        existing.bestAgeGroup = entry.ageGroup;
      }
    } else {
      playerMap.set(slug, {
        slug,
        name: entry.playerName,
        rankings: [
          {
            category: entry.category,
            ageGroup: entry.ageGroup,
            rank: entry.rank,
            points: entry.points,
          },
        ],
        totalPoints: entry.points,
        bestRank: entry.rank,
        bestCategory: entry.category,
        bestAgeGroup: entry.ageGroup,
      });
    }
  }

  return Array.from(playerMap.values()).sort(
    (a, b) => b.totalPoints - a.totalPoints
  );
}

// スラグから選手情報を取得
export function getPlayerBySlug(slug: string): PlayerSummary | undefined {
  return getAllPlayers().find((p) => p.slug === slug);
}

// 全スラグ一覧（generateStaticParams用）
export function getAllPlayerSlugs(): string[] {
  return getAllPlayers().map((p) => p.slug);
}

// ランキングの総エントリ数
export function getTotalEntries(): number {
  return RAW_DATA.length;
}

// ユニーク選手数
export function getUniquePlayerCount(): number {
  return getAllPlayers().length;
}

// トップページ用: 男子ダブルス19+ のTop 3
export function getTopRankingsPreview(): JpaRankingEntry[] {
  return getRankings("男子ダブルス", "19+").slice(0, 5);
}
