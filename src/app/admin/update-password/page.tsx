import type { Metadata } from "next";
import { AdminPasswordRecovery } from "@/components/admin-password-recovery";

export const metadata:Metadata={title:"パスワード再設定｜豚ですもん。管理",robots:{index:false,follow:false}};
export default function UpdatePasswordPage(){return <AdminPasswordRecovery/>;}
