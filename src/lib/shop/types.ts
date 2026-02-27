export type ProductCategory =
  | "humor"
  | "stylish"
  | "japanese"
  | "design"
  | "brand";

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  humor: "あるあるネタ",
  stylish: "スタイリッシュ",
  japanese: "日本語デザイン",
  design: "イラスト・アート",
  brand: "ピクラオリジナル",
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  category: ProductCategory;
  price: number;
  /** デザインに使われるメインテキスト */
  designText: string;
  /** デザインの説明（あるあるの解説など） */
  designConcept: string;
  /** 画像パス（public/images/shop/以下） */
  imagePath: string;
  /** BASE等の外部購入リンク（後で設定） */
  purchaseUrl: string | null;
  /** タグ（検索用） */
  tags: string[];
  /** 公開状態 */
  published: boolean;
};

export type ShopFilters = {
  category: ProductCategory | "all";
  search: string;
};

export const DEFAULT_SHOP_FILTERS: ShopFilters = {
  category: "all",
  search: "",
};
