import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { motion } from 'framer-motion';
import { BarChart3, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Login() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-card border-r border-border/50 p-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">Meridian</span>
        </div>

        <div>
          <h1 className="font-display text-4xl font-bold leading-tight mb-6">
            Your AI-powered<br />
            <span className="text-primary">deal intelligence</span><br />
            layer.
          </h1>
          <div className="space-y-4">
            {[
              { icon: Shield, text: 'Know every stakeholder before you walk in the room' },
              { icon: Zap, text: 'AI-generated pre-meeting briefs in seconds' },
              { icon: BarChart3, text: 'Confidence scoring that tells you where deals are really headed' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground/50">
          © 2025 Meridian Sales Intelligence
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">Meridian</span>
          </div>

          <h2 className="font-display text-2xl font-bold mb-2">Welcome back</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Sign in to access your deal intelligence dashboard.
          </p>

          <Button
            onClick={handleLogin}
            className="w-full h-11 font-medium"
            size="lg"
          >
            Sign in with Manus
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
