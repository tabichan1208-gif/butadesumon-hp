"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => { window.removeEventListener("online", callback); window.removeEventListener("offline", callback); };
}
const getOnline = () => navigator.onLine;
const serverOnline = () => true;

export function AdminAppShell({ children }: { children: React.ReactNode }) {
  const online = useSyncExternalStore(subscribeOnline, getOnline, serverOnline);
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const available = (event: Event) => { event.preventDefault(); setInstall(event as InstallPrompt); };
    const installed = () => { setInstall(null); setMessage("ホーム画面に追加しました。"); };
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", installed);
    return () => { window.removeEventListener("beforeinstallprompt", available); window.removeEventListener("appinstalled", installed); };
  }, []);
  async function addApp() {
    if (!install) return;
    try { await install.prompt(); await install.userChoice; }
    catch { setMessage("ブラウザのメニューからホーム画面に追加してください。"); }
    finally { setInstall(null); }
  }
  return <div className="admin-app">
    <details className="app-install-help"><summary>ホーム画面に追加してアプリとして使う</summary>
      <p>iPhone・iPad：Safariでこの管理画面を開き「共有」→「ホーム画面に追加」。</p>
      <p>Android：Chromeのメニューから「アプリをインストール」または「ホーム画面に追加」。</p>
      <p>オンライン専用です。操作後は保存完了の表示を確認してください。</p>
      {install ? <button type="button" className="button" onClick={addApp}>アプリを追加</button> : null}
      {message ? <p role="status">{message}</p> : null}
    </details>
    {!online ? <div className="app-offline" role="alert"><strong>インターネットに接続されていません</strong><p>表示中の予約は最新とは限りません。接続を戻してから再読み込みしてください。</p><button type="button" onClick={()=>window.location.reload()}>再読み込み</button></div> : null}
    <div inert={!online}>{children}</div>
  </div>;
}
