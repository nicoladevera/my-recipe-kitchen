import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";

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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Reset forms when switching tabs to clear validation errors
    loginForm.reset({
      username: "",
      password: ""
    });
    registerForm.reset({
      username: "",
      email: "",
      password: "",
      displayName: ""
    });
  };

  // Redirect if already logged in
  if (user) {
    setLocation(`/${user.username}`);
    return null;
  }

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(insertUserSchema),
    mode: "onSubmit",
    defaultValues: {
      username: "",
      email: "",
      password: "",
      displayName: "",
    },
  });

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data, {
      onSuccess: (user) => {
        loginForm.reset();
        setLocation(`/${user.username}`);
      },
    });
  };

  const onRegister = (data: RegisterForm) => {
    registerMutation.mutate(data, {
      onSuccess: (user) => {
        registerForm.reset();
        setLocation(`/${user.username}`);
      },
    });
  };

  return (
    <div className="min-h-screen">
      {/* Mobile layout - stacked vertically */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Auth section on top */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">My Recipe Kitchen</h1>
              <p className="text-gray-600 text-sm">Create and share your culinary adventures</p>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card>
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-lg">Welcome back</CardTitle>
                    <CardDescription className="text-sm">
                      Sign in to your recipe collection
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <div>
                        <Label htmlFor="login-username" className="text-sm">Username</Label>
                        <Input
                          id="login-username"
                          {...loginForm.register("username")}
                          placeholder="Enter your username"
                          className="mt-1"
                        />
                        {loginForm.formState.errors.username && (
                          <p className="text-xs text-red-600 mt-1">
                            {loginForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="login-password" className="text-sm">Password</Label>
                        <PasswordInput
                          id="login-password"
                          {...loginForm.register("password")}
                          placeholder="Enter your password"
                          className="mt-1"
                        />
                        {loginForm.formState.errors.password && (
                          <p className="text-xs text-red-600 mt-1">
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
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-lg">Create Account</CardTitle>
                    <CardDescription className="text-sm">
                      Join our recipe community
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <div>
                        <Label htmlFor="register-username" className="text-sm">Username</Label>
                        <Input
                          id="register-username"
                          {...registerForm.register("username")}
                          placeholder="Choose a username"
                          className="mt-1"
                        />
                        {registerForm.formState.errors.username && (
                          <p className="text-xs text-red-600 mt-1">
                            {registerForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="register-displayName" className="text-sm">Display Name</Label>
                        <Input
                          id="register-displayName"
                          {...registerForm.register("displayName")}
                          placeholder="Your full name"
                          className="mt-1"
                        />
                        {registerForm.formState.errors.displayName && (
                          <p className="text-xs text-red-600 mt-1">
                            {registerForm.formState.errors.displayName.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="register-email" className="text-sm">Email</Label>
                        <Input
                          id="register-email"
                          type="email"
                          {...registerForm.register("email")}
                          placeholder="your@email.com"
                          className="mt-1"
                        />
                        {registerForm.formState.errors.email && (
                          <p className="text-xs text-red-600 mt-1">
                            {registerForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="register-password" className="text-sm">Password</Label>
                        <PasswordInput
                          id="register-password"
                          {...registerForm.register("password")}
                          placeholder="Create a strong password"
                          className="mt-1"
                        />
                        {registerForm.formState.errors.password && (
                          <p className="text-xs text-red-600 mt-1">
                            {registerForm.formState.errors.password.message}
                          </p>
                        )}
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

        {/* Hero section below on mobile */}
        <div className="bg-gradient-to-br from-green-50 via-amber-50 to-orange-50 p-6">
          <div className="text-center max-w-sm mx-auto">
            <div className="text-4xl mb-4">🍳</div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              Your Personal Recipe Collection
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              Create, organize, and share your favorite recipes. Track your cooking sessions and build your culinary story.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
              <div className="flex items-center">
                <span className="text-green-600 mr-1">✓</span>
                Recipe Management
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-1">✓</span>
                Cooking Logs
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-1">✓</span>
                Photo Upload
              </div>
              <div className="flex items-center">
                <span className="text-green-600 mr-1">✓</span>
                Public Sharing
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop layout - side by side */}
      <div className="hidden md:flex min-h-screen">
        {/* Left side - Auth forms */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Recipe Kitchen</h1>
              <p className="text-gray-600">Create and share your culinary adventures</p>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange}>
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
                        <Label htmlFor="desktop-login-username">Username</Label>
                        <Input
                          id="desktop-login-username"
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
                        <Label htmlFor="desktop-login-password">Password</Label>
                        <PasswordInput
                          id="desktop-login-password"
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
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>
                      Join our recipe community
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <div>
                        <Label htmlFor="desktop-register-username">Username</Label>
                        <Input
                          id="desktop-register-username"
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
                        <Label htmlFor="desktop-register-displayName">Display Name</Label>
                        <Input
                          id="desktop-register-displayName"
                          {...registerForm.register("displayName")}
                          placeholder="Your full name"
                        />
                        {registerForm.formState.errors.displayName && (
                          <p className="text-sm text-red-600 mt-1">
                            {registerForm.formState.errors.displayName.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="desktop-register-email">Email</Label>
                        <Input
                          id="desktop-register-email"
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
                        <Label htmlFor="desktop-register-password">Password</Label>
                        <PasswordInput
                          id="desktop-register-password"
                          {...registerForm.register("password")}
                          placeholder="Create a strong password"
                        />
                        {registerForm.formState.errors.password && (
                          <p className="text-sm text-red-600 mt-1">
                            {registerForm.formState.errors.password.message}
                          </p>
                        )}
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
    </div>
  );
}