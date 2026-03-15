import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Users, UserPlus, ClipboardList, CalendarCheck, DollarSign, BarChart2, Star, BookOpen, Target, Award, Smile } from 'lucide-react';

/* ── Inline SVG Illustration ─────────────────────────────────────── */
const HandshakeIllustration: React.FC = () => (
  <svg viewBox="0 0 520 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-sm drop-shadow-2xl">
    {/* Background glow blob */}
    <ellipse cx="260" cy="220" rx="200" ry="130" fill="white" fillOpacity="0.07" />

    {/* ── Left person ── */}
    {/* Head */}
    <circle cx="130" cy="68" r="34" fill="white" fillOpacity="0.92" />
    {/* Face */}
    <circle cx="120" cy="63" r="4" fill="#6366f1" />
    <circle cx="140" cy="63" r="4" fill="#6366f1" />
    <path d="M120 76 Q130 84 140 76" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Hair */}
    <path d="M96 62 Q96 34 130 34 Q164 34 164 62" fill="#4f46e5" fillOpacity="0.85" />
    {/* Body / suit */}
    <path d="M88 170 Q88 120 130 112 Q172 120 172 170 L172 260 L88 260 Z" fill="white" fillOpacity="0.88" />
    {/* Tie */}
    <polygon points="130,115 124,145 130,155 136,145" fill="#6366f1" fillOpacity="0.9" />
    {/* Left arm extended right */}
    <path d="M172 145 Q210 145 240 185" stroke="white" strokeOpacity="0.88" strokeWidth="22" strokeLinecap="round" />
    {/* Shirt sleeve detail */}
    <path d="M172 145 Q210 145 240 185" stroke="#e0e7ff" strokeWidth="3" strokeLinecap="round" strokeDasharray="0 24 100" />
    {/* Legs */}
    <rect x="100" y="258" width="22" height="70" rx="10" fill="white" fillOpacity="0.75" />
    <rect x="138" y="258" width="22" height="70" rx="10" fill="white" fillOpacity="0.75" />
    {/* Shoes */}
    <ellipse cx="111" cy="330" rx="17" ry="9" fill="#4f46e5" fillOpacity="0.8" />
    <ellipse cx="149" cy="330" rx="17" ry="9" fill="#4f46e5" fillOpacity="0.8" />

    {/* ── Right person ── */}
    {/* Head */}
    <circle cx="390" cy="68" r="34" fill="white" fillOpacity="0.92" />
    {/* Face */}
    <circle cx="380" cy="63" r="4" fill="#8b5cf6" />
    <circle cx="400" cy="63" r="4" fill="#8b5cf6" />
    <path d="M380 76 Q390 84 400 76" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Hair (bun / longer) */}
    <path d="M356 60 Q356 30 390 30 Q424 30 424 60" fill="#7c3aed" fillOpacity="0.85" />
    <ellipse cx="390" cy="30" rx="12" ry="10" fill="#7c3aed" fillOpacity="0.9" />
    {/* Body / blazer */}
    <path d="M348 170 Q348 120 390 112 Q432 120 432 170 L432 260 L348 260 Z" fill="white" fillOpacity="0.88" />
    {/* Scarf / accent */}
    <path d="M376 114 Q390 128 404 114" stroke="#a78bfa" strokeWidth="8" strokeLinecap="round" fill="none" />
    {/* Right arm extended left */}
    <path d="M348 145 Q310 145 280 185" stroke="white" strokeOpacity="0.88" strokeWidth="22" strokeLinecap="round" />
    {/* Legs */}
    <rect x="360" y="258" width="22" height="70" rx="10" fill="white" fillOpacity="0.75" />
    <rect x="398" y="258" width="22" height="70" rx="10" fill="white" fillOpacity="0.75" />
    {/* Shoes */}
    <ellipse cx="371" cy="330" rx="17" ry="9" fill="#7c3aed" fillOpacity="0.8" />
    <ellipse cx="409" cy="330" rx="17" ry="9" fill="#7c3aed" fillOpacity="0.8" />

    {/* ── Handshake (centre) ── */}
    {/* Two clasped hands */}
    <ellipse cx="260" cy="192" rx="38" ry="22" fill="white" fillOpacity="0.95" />
    {/* Thumb left */}
    <ellipse cx="232" cy="178" rx="10" ry="7" fill="white" fillOpacity="0.95" transform="rotate(-30 232 178)" />
    {/* Thumb right */}
    <ellipse cx="288" cy="178" rx="10" ry="7" fill="white" fillOpacity="0.95" transform="rotate(30 288 178)" />
    {/* Finger details */}
    <path d="M240 202 Q250 215 260 202 Q270 215 280 202" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Sparkle / glow ring */}
    <circle cx="260" cy="192" r="46" stroke="white" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="6 4" />

    {/* ── Floating particles ── */}
    <circle cx="195" cy="42" r="5" fill="white" fillOpacity="0.5" />
    <circle cx="330" cy="28" r="3.5" fill="white" fillOpacity="0.45" />
    <circle cx="445" cy="110" r="4" fill="white" fillOpacity="0.4" />
    <circle cx="75"  cy="140" r="3" fill="white" fillOpacity="0.4" />
    <circle cx="260" cy="350" r="5" fill="white" fillOpacity="0.35" />

    {/* ── Star sparks around handshake ── */}
    <path d="M215 158 L217 152 L219 158 L225 160 L219 162 L217 168 L215 162 L209 160 Z" fill="white" fillOpacity="0.75" />
    <path d="M301 158 L303 152 L305 158 L311 160 L305 162 L303 168 L301 162 L295 160 Z" fill="white" fillOpacity="0.75" />
    <path d="M258 135 L260 129 L262 135 L268 137 L262 139 L260 145 L258 139 L252 137 Z" fill="white" fillOpacity="0.6" />
  </svg>
);

/* ── Floating HRMS Tag Notes ─────────────────────────────────────── */
const TAGS = [
  { label: 'Hiring',       icon: UserPlus,      bg: 'bg-pink-500',    delay: '0s',    top: '6%',   left: '4%'  },
  { label: 'Onboarding',   icon: ClipboardList, bg: 'bg-amber-500',   delay: '0.4s',  top: '12%',  right: '5%' },
  { label: 'Attendance',   icon: CalendarCheck, bg: 'bg-emerald-500', delay: '0.8s',  top: '38%',  left: '2%'  },
  { label: 'Payroll',      icon: DollarSign,    bg: 'bg-blue-500',    delay: '1.2s',  top: '42%',  right: '3%' },
  { label: 'Performance',  icon: BarChart2,     bg: 'bg-violet-500',  delay: '1.6s',  bottom: '28%', left: '3%' },
  { label: 'Appraisals',   icon: Star,          bg: 'bg-orange-500',  delay: '2s',    bottom: '22%', right: '4%' },
  { label: 'Training',     icon: BookOpen,      bg: 'bg-cyan-500',    delay: '2.4s',  bottom: '8%',  left: '8%'  },
  { label: 'Goals',        icon: Target,        bg: 'bg-rose-500',    delay: '2.8s',  bottom: '6%',  right: '7%' },
  { label: 'Recognition',  icon: Award,         bg: 'bg-teal-500',    delay: '3.2s',  top: '22%',  left: '6%'  },
  { label: 'Engagement',   icon: Smile,         bg: 'bg-fuchsia-500', delay: '3.6s',  top: '18%',  right: '6%' },
];

const FloatingTags: React.FC = () => (
  <>
    <style>{`
      @keyframes floatTag {
        0%   { transform: translateY(0px) rotate(var(--r)); }
        50%  { transform: translateY(-10px) rotate(var(--r)); }
        100% { transform: translateY(0px) rotate(var(--r)); }
      }
      .float-tag { animation: floatTag 4s ease-in-out infinite; }
    `}</style>
    {TAGS.map(({ label, icon: Icon, bg, delay, ...pos }) => (
      <div
        key={label}
        className="float-tag absolute flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-white text-xs font-semibold shadow-lg backdrop-blur-sm cursor-default select-none"
        style={{
          ...pos as React.CSSProperties,
          animationDelay: delay,
          ['--r' as string]: `${Math.random() * 6 - 3}deg`,
          background: 'rgba(255,255,255,0.18)',
          border: '1px solid rgba(255,255,255,0.3)',
        }}
      >
        <span className={`flex h-5 w-5 items-center justify-center rounded-md ${bg} shadow`}>
          <Icon size={11} />
        </span>
        {label}
      </div>
    ))}
  </>
);

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@hrms.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    const success = await login(email, password);
    if (success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    }
  } catch (err) {
    toast.error('Invalid credentials');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="flex min-h-screen">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-[55%] gradient-primary relative overflow-hidden items-center justify-center p-12">
        {/* Decorative background circles */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-white/5" />

        {/* Floating HRMS tags */}
        <FloatingTags />

        <div className="relative z-10 text-center text-white max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Users size={26} />
            </div>
            <span className="text-2xl font-bold tracking-wide">HR Compass</span>
          </div>

          {/* Illustration */}
          <div className="flex justify-center px-4">
            <div className="w-64">
              <HandshakeIllustration />
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
              People First,<br />Always.
            </h1>
            <p className="text-sm opacity-80 leading-relaxed">
              Empowering teams through smarter workforce management — from hire to retire.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { value: '10k+', label: 'Employees' },
              { value: '98%', label: 'Satisfaction' },
              { value: '24/7', label: 'Support' },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl bg-white/15 backdrop-blur-sm py-3 px-2 shadow">
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs opacity-75 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            {['Employee Management', 'Leave & Attendance', 'Payroll Processing', 'Analytics & Reports'].map(f => (
              <span key={f} className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 font-medium">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex w-full lg:w-[45%] items-center justify-center p-8 bg-background">
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

          {/* <div className="rounded-lg border bg-muted/50 p-4 text-sm space-y-1">
            <p className="font-medium">Demo Accounts:</p>
            <p className="text-muted-foreground">admin@hrms.com / password</p>
            <p className="text-muted-foreground">manager@hrms.com / password</p>
            <p className="text-muted-foreground">employee@hrms.com / password</p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
