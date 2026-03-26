"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [values, setValues] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("confirm") === "1") {
      setSuccessMessage("Conta criada com sucesso. Se a confirmação de e-mail estiver ativa, valide seu acesso antes de entrar.");
    }
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload = {
      email: values.email.trim().toLowerCase(),
      password: values.password,
    };

    if (!isValidEmail(payload.email)) {
      setError("Informe um e-mail válido.");
      return;
    }

    if (payload.password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword(payload);
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
      <div className="rounded-[22px] border border-slate-200/90 bg-slate-50/85 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.22)]">
            <Sparkles className="size-4" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Acesso rápido e mais claro</p>
            <p className="mt-1 text-sm text-slate-500">Entrar no painel agora mostra feedbacks melhores, foco mais limpo e menos atrito no fluxo.</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800">E-mail</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input autoComplete="email" type="email" placeholder="voce@empresa.com" className="pl-11" value={values.email} onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))} />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium text-slate-800">Senha</label>
          <span className="text-xs text-slate-400">Mínimo de 8 caracteres</span>
        </div>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input autoComplete="current-password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-11 pr-11" value={values.password} onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))} />
          <button
            type="button"
            className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {successMessage ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50/95 px-4 py-3 text-sm text-emerald-700">{successMessage}</p> : null}
      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50/95 px-4 py-3 text-sm text-rose-600">{error}</p> : null}

      <Button className="w-full justify-center" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        {loading ? "Entrando..." : "Entrar no painel"}
      </Button>

      <div className="space-y-3 text-center text-sm text-slate-500">
        <p className="rounded-[20px] border border-slate-200/90 bg-slate-50/70 px-4 py-3">Esqueceu a senha? Ative a recuperação no Supabase Auth ou peça redefinição a um admin.</p>
        <p>
          Ainda não tem acesso? {" "}
          <Link className="font-medium text-slate-900 underline underline-offset-4" href="/register">
            Criar conta
          </Link>
        </p>
      </div>
    </form>
  );
}
