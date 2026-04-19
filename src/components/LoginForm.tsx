'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { User, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginForm() {
  const { login, setRememberMe, rememberMe, setIsLoading, isLoading } = useAppStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: 'Error',
        description: 'Por favor ingrese usuario y contraseña',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Error de inicio de sesión',
          description: data.error || 'Credenciales incorrectas',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      login(data.user);
      toast({
        title: 'Bienvenido',
        description: `Hola, ${data.user.name}`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Error de conexión al servidor',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5 dark:from-background dark:via-background dark:to-background p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-card shadow-lg shadow-primary/10 dark:shadow-none mb-4 overflow-hidden border border-border">
            <img
              src="/logo-company.png"
              alt="Electrónica Centeno"
              className="w-20 h-20 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Electrónica Centeno
          </h1>
          <p className="text-primary mt-1 text-sm font-medium">
            INICIO DE SESIÓN
          </p>
        </div>

        <Card className="border-border shadow-xl shadow-primary/5 dark:shadow-none dark:border-border">
          <CardHeader className="pb-2">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Acceda al sistema de mantenimiento preventivo
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Usuario
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Nombre de usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-12 border-border focus:border-primary focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 border-border focus:border-primary focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                  Guardar sesión
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg shadow-primary/20 dark:shadow-none transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} Electrónica Centeno — Sistema de Mantenimiento Preventivo
        </p>
      </div>
    </div>
  );
}
