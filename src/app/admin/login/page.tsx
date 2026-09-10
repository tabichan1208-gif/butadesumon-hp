import { AdminLogin } from "@/components/admin-login";
const messages:Record<string,string>={
  setup:"サーバー設定を確認しています。管理者へお問い合わせください。",
  database:"権限情報を読み込めませんでした。管理者へお問い合わせください。",
  profile:"ログイン用アカウントに管理プロフィールが紐づいていません。",
  role:"このアカウントには管理画面を開く権限がありません。",
  permission:"このアカウントの権限を確認できませんでした。",
};
export default async function LoginPage({searchParams}:{searchParams:Promise<{error?:string}>}){
  const {error}=await searchParams;
  return <AdminLogin initialError={error?messages[error]??messages.permission:""}/>;
}
