"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, Loader2, LockKeyhole, Mail } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [values, setValues] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const successMessage = useMemo(() => {
    if (searchParams.get("registered") === "1") {
      return "Conta criada. Faça login para acessar o painel.";
    }

    if (searchParams.get("confirm") === "1") {
      return "Conta criada. Verifique seu e-mail para confirmar o acesso antes de entrar.";
    }

    return null;
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const email = values.email.trim().toLowerCase();
    const password = values.password;

    if (!isValidEmail(email)) {
      setError("Informe um e-mail válido.");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError(signInError.message.includes("Email not confirmed") ? "Confirme seu e-mail antes de entrar." : "E-mail ou senha inválidos.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800">E-mail</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input autoComplete="email" type="email" placeholder="voce@empresa.com" className="pl-11" value={values.email} onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800">Senha</label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input autoComplete="current-password" type="password" placeholder="••••••••" className="pl-11" value={values.password} onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))} />
        </div>
      </div>

      {successMessage ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p> : null}
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

      <Button className="w-full justify-center" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        {loading ? "Entrando..." : "Entrar"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Ainda não tem acesso?{" "}
        <Link className="font-medium text-slate-900 underline underline-offset-4" href="/register">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
