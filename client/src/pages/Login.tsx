import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Eye, EyeOff, Loader2, BarChart3, Shield, Zap } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const utils = trpc.useUtils();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo") || "/";
      navigate(returnTo);
    },
    onError: (err) => {
      setError(
        err.message === "Invalid email or password"
          ? language === "zh"
            ? "邮箱或密码错误"
            : "Invalid email or password"
          : err.message
      );
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      navigate("/onboarding");
    },
    onError: (err) => {
      setError(
        err.message === "An account with this email already exists"
          ? language === "zh"
            ? "该邮箱已被注册"
            : "An account with this email already exists"
          : err.message
      );
    },
  });

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isLogin) {
      loginMutation.mutate({ email, password });
    } else {
      if (!name.trim()) {
        setError(language === "zh" ? "请输入姓名" : "Name is required");
        return;
      }
      registerMutation.mutate({ email, password, name });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-slate-900 to-indigo-950 border-r border-slate-800/50 p-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white">Meridian</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight mb-6 text-white">
            {language === "zh" ? (
              <>
                AI 驱动的<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">销售智能</span>
                <br />
                平台
              </>
            ) : (
              <>
                Your AI-powered<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">deal intelligence</span>
                <br />
                layer.
              </>
            )}
          </h1>
          <div className="space-y-4">
            {[
              {
                icon: Shield,
                text: language === "zh"
                  ? "在走进会议室之前，了解每一位利益相关者"
                  : "Know every stakeholder before you walk in the room",
              },
              {
                icon: Zap,
                text: language === "zh"
                  ? "AI 秒级生成会前简报"
                  : "AI-generated pre-meeting briefs in seconds",
              },
              {
                icon: BarChart3,
                text: language === "zh"
                  ? "置信度评分告诉你交易的真实走向"
                  : "Confidence scoring that tells you where deals are really headed",
              },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-sm text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">
          &copy; {new Date().getFullYear()} Meridian Sales Intelligence
        </p>
      </div>

      {/* Right panel - auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-white">Meridian</span>
          </div>

          <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-sm shadow-2xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-white">
                {isLogin
                  ? language === "zh"
                    ? "登录"
                    : "Welcome back"
                  : language === "zh"
                    ? "创建账号"
                    : "Create Account"}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {isLogin
                  ? language === "zh"
                    ? "使用您的邮箱和密码登录"
                    : "Sign in with your email and password"
                  : language === "zh"
                    ? "注册一个新的 Meridian 账号"
                    : "Register a new Meridian account"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Name field (register only) */}
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">
                      {language === "zh" ? "姓名" : "Full Name"}
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder={
                        language === "zh" ? "输入您的姓名" : "Enter your name"
                      }
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                      disabled={isLoading}
                      autoComplete="name"
                    />
                  </div>
                )}

                {/* Email field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    {language === "zh" ? "邮箱" : "Email"}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                    disabled={isLoading}
                    autoComplete="email"
                    required
                  />
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">
                    {language === "zh" ? "密码" : "Password"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={
                        language === "zh"
                          ? "输入密码"
                          : isLogin
                            ? "Enter your password"
                            : "Min 6 characters"
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 pr-10"
                      disabled={isLoading}
                      autoComplete={
                        isLogin ? "current-password" : "new-password"
                      }
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isLogin
                    ? language === "zh"
                      ? "登录"
                      : "Sign In"
                    : language === "zh"
                      ? "创建账号"
                      : "Create Account"}
                </Button>
              </form>

              {/* Toggle login/register */}
              <div className="mt-6 text-center">
                <span className="text-slate-500 text-sm">
                  {isLogin
                    ? language === "zh"
                      ? "还没有账号？"
                      : "Don't have an account?"
                    : language === "zh"
                      ? "已有账号？"
                      : "Already have an account?"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                  }}
                  className="ml-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                >
                  {isLogin
                    ? language === "zh"
                      ? "注册"
                      : "Sign Up"
                    : language === "zh"
                      ? "登录"
                      : "Sign In"}
                </button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-slate-600 text-xs mt-6">
            Meridian Sales Intelligence &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
