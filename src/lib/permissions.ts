export const permissionOptions = [
  ["reservations", "予約管理"],
  ["email", "メール設定"],
  ["site", "サイト編集・店内写真"],
  ["store", "店舗情報"],
  ["pricing", "ご利用料金"],
  ["pigs", "こぶた紹介"],
  ["faqs", "よくある質問"],
  ["media", "画像ライブラリ"],
  ["seo", "SEO設定"],
] as const;

export type PermissionKey = (typeof permissionOptions)[number][0];
export type StaffPermissions = Partial<Record<PermissionKey, boolean>>;
export type ManagementRole = "ADMIN" | "OWNER" | "STAFF";

export const menuPermission: Record<string, PermissionKey> = {
  "予約管理": "reservations",
  "メール設定": "email",
  "サイト編集": "site",
  "店舗情報": "store",
  "ご利用料金": "pricing",
  "こぶた紹介": "pigs",
  "よくある質問": "faqs",
  "画像ライブラリ": "media",
  "SEO設定": "seo",
};

export function canAccess(role: ManagementRole, permissions: StaffPermissions, key: PermissionKey) {
  return role === "ADMIN" || role === "OWNER" || permissions[key] === true;
}

export function managementRoleLabel(role: ManagementRole) {
  return role === "ADMIN" ? "管理者" : role === "OWNER" ? "オーナー" : "スタッフ";
}
