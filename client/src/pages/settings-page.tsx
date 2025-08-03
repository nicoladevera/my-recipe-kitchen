import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const updateProfileSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  displayName: z.string().min(1, "Display name is required"),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UpdateProfileForm = z.infer<typeof updateProfileSchema>;
type UpdatePasswordForm = z.infer<typeof updatePasswordSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  if (!user) {
    setLocation("/auth");
    return null;
  }

  const profileForm = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: user.username,
      displayName: user.displayName || "",
    },
  });

  const passwordForm = useForm<UpdatePasswordForm>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onUpdateProfile = async (data: UpdateProfileForm) => {
    setIsUpdatingProfile(true);
    try {
      const response = await apiRequest("PATCH", "/api/user", data);
      const updatedUser = await response.json();
      
      // Update user data in cache
      queryClient.setQueryData(["/api/user"], updatedUser);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onUpdatePassword = async (data: UpdatePasswordForm) => {
    setIsUpdatingPassword(true);
    try {
      await apiRequest("PATCH", "/api/user/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      
      passwordForm.reset();
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Password update failed",
        description: "Failed to update password. Please check your current password.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-recipe-cream via-recipe-light to-white">
      <div className="recipe-header">
        <div className="recipe-container">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/${user.username}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Recipes
            </Button>
          </div>
          <h1>⚙️ Account Settings</h1>
          <p>Manage your account information and preferences</p>
        </div>
      </div>

      <div className="recipe-container">
        <div className="max-w-2xl mx-auto">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your public profile information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        {...profileForm.register("username")}
                        placeholder="Your username"
                      />
                      {profileForm.formState.errors.username && (
                        <p className="text-sm text-red-600 mt-1">
                          {profileForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        {...profileForm.register("displayName")}
                        placeholder="Your full name"
                      />
                      {profileForm.formState.errors.displayName && (
                        <p className="text-sm text-red-600 mt-1">
                          {profileForm.formState.errors.displayName.message}
                        </p>
                      )}
                    </div>



                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isUpdatingProfile}
                    >
                      {isUpdatingProfile && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update Profile
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your account password
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <PasswordInput
                        id="currentPassword"
                        {...passwordForm.register("currentPassword")}
                        placeholder="Enter your current password"
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-sm text-red-600 mt-1">
                          {passwordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <PasswordInput
                        id="newPassword"
                        {...passwordForm.register("newPassword")}
                        placeholder="Enter your new password"
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-sm text-red-600 mt-1">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <PasswordInput
                        id="confirmPassword"
                        {...passwordForm.register("confirmPassword")}
                        placeholder="Confirm your new password"
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-600 mt-1">
                          {passwordForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isUpdatingPassword}
                    >
                      {isUpdatingPassword && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update Password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}