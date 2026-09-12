"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function AdminPasswordRecovery(){
  const[ready,setReady]=useState(false),[pending,setPending]=useState(false),[error,setError]=useState(""),[complete,setComplete]=useState(false);
  useEffect(()=>{
    const supabase=createClient();
    supabase.auth.getSession().then(({data})=>setReady(Boolean(data.session)));
    const{data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{if(event==="PASSWORD_RECOVERY"||session)setReady(true)});
    return()=>subscription.unsubscribe();
  },[]);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const form=event.currentTarget;const data=new FormData(form);const password=String(data.get("password")??""),confirmation=String(data.get("confirmation")??"");setError("");
    if(password.length<8)return setError("新しいパスワードは8文字以上で入力してください。");
    if(password!==confirmation)return setError("新しいパスワードが一致していません。");
    setPending(true);const supabase=createClient();const{error:updateError}=await supabase.auth.updateUser({password});setPending(false);
    if(updateError)return setError("再設定リンクが無効または期限切れです。ログイン画面から再度メールを送信してください。");
    await supabase.auth.signOut();form.reset();setComplete(true);
  }
  if(complete)return <main className="login-page"><section className="login-card"><div className="logo"><span>MICRO PIG CAFE</span>豚ですもん。</div><h1>変更しました</h1><p className="login-success">新しいパスワードを設定しました。</p><Link className="button full" href="/admin/login">ログイン画面へ</Link></section></main>;
  return <main className="login-page"><form className="login-card" onSubmit={submit}><div className="logo"><span>MICRO PIG CAFE</span>豚ですもん。</div><p>店舗管理画面</p><h1>新しいパスワード</h1>{ready?<><label>新しいパスワード<input name="password" type="password" minLength={8} autoComplete="new-password" required/></label><label>新しいパスワード（確認）<input name="confirmation" type="password" minLength={8} autoComplete="new-password" required/></label>{error&&<p className="error" role="alert">{error}</p>}<button className="button full" disabled={pending}>{pending?"変更中…":"パスワードを設定"}</button></>:<><p className="password-help">再設定メール内のリンクからこの画面を開いてください。リンクが期限切れの場合は、ログイン画面から再送できます。</p><Link href="/admin/login">ログイン画面へ戻る</Link></>}</form></main>;
}
