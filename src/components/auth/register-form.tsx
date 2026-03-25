"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2, LockKeyhole, Mail, User } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <form className="space-y-5" onSubmit={handleSubmit}>
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
          <label className="text-sm font-medium text-slate-800">Senha</label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input autoComplete="new-password" type="password" placeholder="Mínimo de 8 caracteres" className="pl-11" value={values.password} onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800">Confirmar senha</label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input autoComplete="new-password" type="password" placeholder="Repita a senha" className="pl-11" value={values.confirmPassword} onChange={(event) => setValues((current) => ({ ...current, confirmPassword: event.target.value }))} />
          </div>
        </div>
      </div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

      <Button className="w-full justify-center" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        {loading ? "Criando conta..." : "Criar conta"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Já possui acesso?{" "}
        <Link className="font-medium text-slate-900 underline underline-offset-4" href="/login">
          Entrar
        </Link>
      </p>
    </form>
  );
}
