"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck, User } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { label: "Baixa", width: 33, className: "bg-rose-500" };
  if (score <= 4) return { label: "Média", width: 66, className: "bg-amber-500" };
  return { label: "Alta", width: 100, className: "bg-emerald-500" };
}

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(values.password), [values.password]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
      confirmPassword: values.confirmPassword,
    };

    if (payload.name.length < 3) {
      setError("Informe um nome com pelo menos 3 caracteres.");
      return;
    }

    if (!isValidEmail(payload.email)) {
      setError("Informe um e-mail válido.");
      return;
    }

    if (payload.password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (payload.password !== payload.confirmPassword) {
      setError("A confirmação de senha não confere.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          full_name: payload.name,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    router.push("/login?confirm=1");
  }

  return (
    <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
      <div className="rounded-[22px] border border-slate-200/90 bg-slate-50/85 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.22)]">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Cadastro com leitura mais guiada</p>
            <p className="mt-1 text-sm text-slate-500">Os campos foram refinados para deixar senha, confirmação e qualidade do acesso mais claros.</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800">Nome</label>
        <div className="relative">
          <User className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input autoComplete="name" placeholder="Seu nome completo" className="pl-11" value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800">E-mail</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input autoComplete="email" type="email" placeholder="voce@empresa.com" className="pl-11" value={values.email} onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-slate-800">Senha</label>
            <span className="text-xs text-slate-400">Mín. 8 caracteres</span>
          </div>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input autoComplete="new-password" type={showPassword ? "text" : "password"} placeholder="Mínimo de 8 caracteres" className="pl-11 pr-11" value={values.password} onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))} />
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
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800">Confirmar senha</label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input autoComplete="new-password" type={showConfirmPassword ? "text" : "password"} placeholder="Repita a senha" className="pl-11 pr-11" value={values.confirmPassword} onChange={(event) => setValues((current) => ({ ...current, confirmPassword: event.target.value }))} />
            <button
              type="button"
              className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              onClick={() => setShowConfirmPassword((current) => !current)}
              aria-label={showConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-slate-50/85 px-4 py-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-slate-700">Força da senha</span>
          <span className="text-slate-500">{values.password ? passwordStrength.label : "Preencha a senha"}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className={cn("h-full rounded-full transition-all duration-300", values.password ? passwordStrength.className : "bg-slate-300")} style={{ width: `${values.password ? passwordStrength.width : 0}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-500">Combine letras maiúsculas, minúsculas, números e símbolos para um acesso mais forte.</p>
      </div>

      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50/95 px-4 py-3 text-sm text-rose-600">{error}</p> : null}

      <Button className="w-full justify-center" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        {loading ? "Criando conta..." : "Criar conta"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Já possui acesso? {" "}
        <Link className="font-medium text-slate-900 underline underline-offset-4" href="/login">
          Entrar
        </Link>
      </p>
    </form>
  );
}
