"use client";

import { FormEvent, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";

type ApiResponse =
  | { ok: true; session: Session }
  | {
      ok: false;
      code?: "LOCKED" | "INVALID";
      message: string;
      remainingSec?: number;
      hint?: string;
    };

function now() {
  return new Date().toISOString();
}

function msSince(t0: number) {
  return Math.floor(performance.now() - t0);
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string) {
  return Promise.race<T>([
    p,
    new Promise<T>((_, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        reject(new Error(`[timeout] ${label} (${ms}ms)`));
      }, ms);
    }),
  ]);
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const t0 = performance.now();
    const tag = `[login ${Math.random().toString(16).slice(2, 8)}]`;

    const log = (...args: any[]) => console.log(tag, now(), `+${msSince(t0)}ms`, ...args);

    setError(null);
    setHint(null);
    setLoading(true);

    log("START", { userIdLen: userId.length });

    try {
      if (userId.includes("@")) {
        setError("ユーザーIDに「@」は使えません。");
        log("BLOCKED: contains @");
        return;
      }

      // ① API 呼び出し
      log("fetch /api/auth/login ...");
      const res = await withTimeout(
        fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, password }),
        }),
        15000,
        "fetch(/api/auth/login)"
      );
      log("fetch done", { status: res.status });

      // ② JSON パース
      log("res.json ...");
      const json = (await withTimeout(res.json(), 15000, "res.json()")) as ApiResponse;
      log("json parsed", json.ok ? { ok: true } : { ok: false, code: json.code });

      if (!json.ok) {
        setError(json.message);
        if (json.hint) setHint(json.hint);
        log("API returned not ok", json);
        return;
      }

      // ③ token の存在チェック（ここ重要）
      const at = json.session?.access_token;
      const rt = json.session?.refresh_token;
      log("tokens", { hasAccess: !!at, hasRefresh: !!rt });

      if (!at || !rt) {
        setError("ログイン情報が不完全です（token不足）。APIの返却を確認してください。");
        log("MISSING TOKEN", { access_token: !!at, refresh_token: !!rt, session: json.session });
        return;
      }

      // ④ setSession（ここで止まる可能性が一番高い）
      log("supabase.auth.setSession ...");
      const { error: setErr } = await withTimeout(
        supabase.auth.setSession({ access_token: at, refresh_token: rt }),
        10000,
        "supabase.auth.setSession"
      );
      log("setSession done", { hasError: !!setErr });

      if (setErr) {
        console.error(tag, "setSession error detail:", setErr);
        setError("セッションの保存に失敗しました。もう一度お試しください。");
        return;
      }

      // ⑤ 直後に getSession / getUser で確定（ここでズレると別タブ問題が出る）
      log("supabase.auth.getSession ...");
      const s = await withTimeout(supabase.auth.getSession(), 10000, "supabase.auth.getSession");
      log("getSession done", { hasSession: !!s.data.session });

      log("supabase.auth.getUser ...");
      const u = await withTimeout(supabase.auth.getUser(), 10000, "supabase.auth.getUser");
      log("getUser done", { hasUser: !!u.data.user });

      // ⑥ 画面遷移
      log("router.push /");
      router.push("/");
      router.refresh();
      setTimeout(() => window.dispatchEvent(new Event("auth:changed")), 0);
      log("DONE (routed)");
    } catch (err: any) {
      console.error(tag, "EXCEPTION", err);
      setError(err?.message ?? "ログインに失敗しました");
    } finally {
      setLoading(false);
      log("FINALLY (loading=false)");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6 text-center">ログイン</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-md md:text-xl font-medium">ユーザーID</label>
          <input
            className="border rounded w-full p-2"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            placeholder="登録したユーザーID"
          />
        </div>

        <div>
          <label className="block text-md md:text-xl font-medium">パスワード</label>
          <input
            className="border rounded w-full p-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {hint && <p className="text-blue-700 text-sm md:text-base">{hint}</p>}
        {error && <p className="text-red-500 text-md md:text-xl">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60 mt-2 md:mt-4 cursor-pointer"
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>

        <div className="flex justify-center">
          <Link
            href="/user/forgot-password"
            className="text-sm md:text-base text-blue-600 hover:underline mt-2"
          >
            パスワードを忘れた方はこちら
          </Link>
        </div>
      </form>
    </div>
  );
}
