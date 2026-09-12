"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminPasswordSettings() {
  const [pending,setPending]=useState(false);
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=event.currentTarget;
    const data=new FormData(form);
    const currentPassword=String(data.get("current_password")??"");
    const newPassword=String(data.get("new_password")??"");
    const confirmation=String(data.get("password_confirmation")??"");
    setNotice("");setError("");
    if(newPassword.length<8)return setError("新しいパスワードは8文字以上で入力してください。");
    if(newPassword!==confirmation)return setError("新しいパスワードが一致していません。");
    if(currentPassword===newPassword)return setError("現在とは異なるパスワードを入力してください。");
    setPending(true);
    const supabase=createClient();
    const{data:{user}}=await supabase.auth.getUser();
    if(!user?.email){setPending(false);return setError("ログイン情報を確認できませんでした。再度ログインしてください。");}
    const{error:signInError}=await supabase.auth.signInWithPassword({email:user.email,password:currentPassword});
    if(signInError){setPending(false);return setError("現在のパスワードが正しくありません。");}
    const{error:updateError}=await supabase.auth.updateUser({password:newPassword});
    setPending(false);
    if(updateError)return setError("パスワードを変更できませんでした。時間をおいて再度お試しください。");
    form.reset();setNotice("パスワードを変更しました。次回から新しいパスワードでログインしてください。");
  }

  return <section className="admin-panel password-panel"><div className="panel-head"><div><h2>パスワード変更</h2><p>本人確認のため、現在のパスワードも入力してください。</p></div></div>{notice&&<p className="admin-notice" role="status">{notice}</p>}{error&&<p className="password-error" role="alert">{error}</p>}<form className="settings-fields" onSubmit={submit}><label className="wide">現在のパスワード<input name="current_password" type="password" autoComplete="current-password" required/></label><label>新しいパスワード<input name="new_password" type="password" minLength={8} autoComplete="new-password" required/><small>8文字以上で入力してください。</small></label><label>新しいパスワード（確認）<input name="password_confirmation" type="password" minLength={8} autoComplete="new-password" required/></label><button className="button" disabled={pending}>{pending?"変更中…":"パスワードを変更"}</button></form></section>;
}
