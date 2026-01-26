import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hotel, Eye, EyeOff, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, getRoleDashboard } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Auth() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [waitingForRoles, setWaitingForRoles] = useState(false);
  const { signIn, user, roles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in with roles loaded
  useEffect(() => {
    if (user && !waitingForRoles) {
      // If we have roles, redirect based on them
      if (roles.length > 0) {
        const dashboard = getRoleDashboard(roles);
        navigate(dashboard);
      }
    }
  }, [user, roles, waitingForRoles, navigate]);

  // Handle role-based redirect after login
  useEffect(() => {
    if (waitingForRoles && roles.length > 0) {
      setWaitingForRoles(false);
      const dashboard = getRoleDashboard(roles);
      navigate(dashboard);
    }
  }, [waitingForRoles, roles, navigate]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.username, data.password);
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message === 'Invalid login credentials'
          ? 'Invalid username or password. Please try again.'
          : error.message,
      });
    } else {
      // Wait for roles to load before redirecting
      setWaitingForRoles(true);
      toast({
        title: 'Login Successful',
        description: 'Redirecting to your dashboard...',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Hotel className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Cloud Hotel PMS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Multi-Tenant Property Management</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username or Email</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  {...loginForm.register('username')}
                  className="h-10"
                />
                {loginForm.formState.errors.username && (
                  <p className="text-xs text-destructive">
                    {loginForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...loginForm.register('password')}
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Demo credentials: admin@demo.com / demo123
        </p>
      </div>
    </div>
  );
}
