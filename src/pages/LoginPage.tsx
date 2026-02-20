import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Users } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@hrms.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const success = login(email, password);
      setLoading(false);
      if (success) {
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        toast.error('Invalid credentials');
      }
    }, 600);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <div className="text-center text-white max-w-md">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Users size={40} />
          </div>
          <h1 className="text-4xl font-bold mb-4">HRMS Portal</h1>
          <p className="text-lg opacity-90">
            Streamline your workforce management with our comprehensive Human Resource Management System.
          </p>
          <div className="mt-10 space-y-3 text-sm opacity-80">
            <p>🏢 Employee Management</p>
            <p>📊 Analytics & Reports</p>
            <p>🗓 Leave & Attendance</p>
            <p>💰 Payroll Processing</p>
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-white">
              <Users size={24} />
            </div>
            <span className="text-2xl font-bold">HRMS</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="rounded-lg border bg-muted/50 p-4 text-sm space-y-1">
            <p className="font-medium">Demo Accounts:</p>
            <p className="text-muted-foreground">admin@hrms.com / password</p>
            <p className="text-muted-foreground">manager@hrms.com / password</p>
            <p className="text-muted-foreground">employee@hrms.com / password</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
