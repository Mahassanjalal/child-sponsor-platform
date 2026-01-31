import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnimatedContainer } from "@/components/animated-container";
import {
  Heart,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Shield,
  Users,
  FileText,
  Mail,
  Lock,
  User,
} from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "register") {
      setIsLogin(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterFormData) => {
    registerMutation.mutate({ ...data, role: "sponsor" });
  };

  const features = [
    { icon: Heart, title: "Personal Connection", description: "Build a meaningful relationship with your sponsored child" },
    { icon: FileText, title: "Monthly Reports", description: "Receive detailed updates on your child's progress" },
    { icon: Shield, title: "100% Transparency", description: "Track every dollar and see the real impact" },
    { icon: Users, title: "Community", description: "Join thousands of sponsors making a difference" },
  ];

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent" />
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 0%, transparent 50%),
                             radial-gradient(circle at 80% 50%, white 0%, transparent 50%)`,
            backgroundSize: "100% 100%",
          }}
        />
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <AnimatedContainer delay={0.1}>
            <Link href="/">
              <div className="flex items-center gap-3 mb-12 cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">HopeConnect</span>
              </div>
            </Link>
          </AnimatedContainer>

          <AnimatedContainer delay={0.2}>
            <h1 className="text-4xl font-bold mb-4">
              Transform a Child's Future
            </h1>
            <p className="text-lg text-white/80 mb-12 max-w-md">
              Join our community of sponsors and make a lasting difference in a child's life through education, healthcare, and support.
            </p>
          </AnimatedContainer>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <AnimatedContainer key={feature.title} delay={0.3 + index * 0.1}>
                <motion.div
                  className="flex items-start gap-4"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-white/70">{feature.description}</p>
                  </div>
                </motion.div>
              </AnimatedContainer>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 lg:p-6">
          <Link href="/">
            <div className="lg:hidden flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">HopeConnect</span>
            </div>
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md">
            <AnimatedContainer>
              <Card className="border-border/50">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">
                    {isLogin ? "Welcome Back" : "Create Account"}
                  </CardTitle>
                  <CardDescription>
                    {isLogin
                      ? "Sign in to access your sponsor dashboard"
                      : "Start your journey as a sponsor today"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {isLogin ? (
                      <motion.div
                        key="login"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Form {...loginForm}>
                          <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                            <FormField
                              control={loginForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                      <Input
                                        {...field}
                                        type="email"
                                        placeholder="you@example.com"
                                        className="pl-10"
                                        data-testid="input-email"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={loginForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Password</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                      <Input
                                        {...field}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        className="pl-10 pr-10"
                                        data-testid="input-password"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        data-testid="button-toggle-password"
                                      >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                      </button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="submit"
                              className="w-full"
                              disabled={loginMutation.isPending}
                              data-testid="button-submit-login"
                            >
                              {loginMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Signing in...
                                </>
                              ) : (
                                <>
                                  Sign In
                                  <ArrowRight className="ml-2 w-4 h-4" />
                                </>
                              )}
                            </Button>
                          </form>
                        </Form>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="register"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Form {...registerForm}>
                          <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={registerForm.control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                          {...field}
                                          placeholder="John"
                                          className="pl-10"
                                          data-testid="input-first-name"
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={registerForm.control}
                                name="lastName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="Doe"
                                        data-testid="input-last-name"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={registerForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                      <Input
                                        {...field}
                                        type="email"
                                        placeholder="you@example.com"
                                        className="pl-10"
                                        data-testid="input-register-email"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={registerForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Password</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                      <Input
                                        {...field}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create a password"
                                        className="pl-10 pr-10"
                                        data-testid="input-register-password"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                      >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                      </button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="submit"
                              className="w-full"
                              disabled={registerMutation.isPending}
                              data-testid="button-submit-register"
                            >
                              {registerMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Creating account...
                                </>
                              ) : (
                                <>
                                  Create Account
                                  <ArrowRight className="ml-2 w-4 h-4" />
                                </>
                              )}
                            </Button>
                          </form>
                        </Form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-toggle-auth-mode"
                    >
                      {isLogin ? (
                        <>Don't have an account? <span className="text-primary font-medium">Sign up</span></>
                      ) : (
                        <>Already have an account? <span className="text-primary font-medium">Sign in</span></>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </AnimatedContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
