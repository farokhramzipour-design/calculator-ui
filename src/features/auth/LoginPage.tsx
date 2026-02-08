import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authSchema, AuthForm } from "./authSchema";
import { useAuth } from "@/lib/auth/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function LoginPage() {
  const { login } = useAuth();
  const form = useForm<AuthForm>({ resolver: zodResolver(authSchema) });

  const onSubmit = async (values: AuthForm) => {
    await login(values.email, values.password);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <p className="text-sm text-slate-500">Access your trade intelligence and landed cost toolkit.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Email</label>
              <Input type="email" {...form.register("email")} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Password</label>
              <Input type="password" {...form.register("password")} />
            </div>
            <Button type="submit" className="w-full">Login</Button>
            <p className="text-xs text-slate-500">
              Need an account? <Link className="text-brand-600" to="/register">Register</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
