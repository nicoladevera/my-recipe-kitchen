import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof insertUserSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("login");

  // Redirect if already logged in
  if (user) {
    setLocation(`/${user.username}`);
    return null;
  }

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      displayName: "",
      bio: "",
    },
  });

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data, {
      onSuccess: (user) => {
        setLocation(`/${user.username}`);
      },
    });
  };

  const onRegister = (data: RegisterForm) => {
    registerMutation.mutate(data, {
      onSuccess: (user) => {
        setLocation(`/${user.username}`);
      },
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Recipe Kitchen</h1>
            <p className="text-gray-600">Create and share your culinary adventures</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>
                    Sign in to your recipe collection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div>
                      <Label htmlFor="login-username">Username</Label>
                      <Input
                        id="login-username"
                        {...loginForm.register("username")}
                        placeholder="Enter your username"
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-sm text-red-600 mt-1">
                          {loginForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        {...loginForm.register("password")}
                        placeholder="Enter your password"
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-600 mt-1">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Sign In
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create account</CardTitle>
                  <CardDescription>
                    Start your recipe journey today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="register-username">Username</Label>
                        <Input
                          id="register-username"
                          {...registerForm.register("username")}
                          placeholder="Choose a username"
                        />
                        {registerForm.formState.errors.username && (
                          <p className="text-sm text-red-600 mt-1">
                            {registerForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="register-displayName">Display Name</Label>
                        <Input
                          id="register-displayName"
                          {...registerForm.register("displayName")}
                          placeholder="Your full name"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        {...registerForm.register("email")}
                        placeholder="your@email.com"
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        {...registerForm.register("password")}
                        placeholder="Create a strong password"
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="register-bio">Bio (optional)</Label>
                      <Input
                        id="register-bio"
                        {...registerForm.register("bio")}
                        placeholder="Tell us about your cooking style"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Account
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="flex-1 bg-gradient-to-br from-green-50 via-amber-50 to-orange-50 flex items-center justify-center p-8">
        <div className="text-center max-w-lg">
          <div className="text-6xl mb-6">🍳</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Your Personal Recipe Collection
          </h2>
          <p className="text-lg text-gray-700 mb-6">
            Create, organize, and share your favorite recipes. Track your cooking sessions, 
            rate your dishes, and build your culinary story.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Recipe Management
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Cooking Logs
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Photo Upload
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Public Sharing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}