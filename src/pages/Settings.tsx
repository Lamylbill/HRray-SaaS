import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Camera, ArrowLeft } from "lucide-react";
import { LoadingSpinner } from "@/components/ui-custom/LoadingSpinner";
import { useNavigate } from 'react-router-dom';

interface SettingsProps {
  returnTo?: string;
}

const Settings = ({ returnTo = '/dashboard' }: SettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  
  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setFullName(user.user_metadata?.full_name || '');
      
      // Fetch user avatar if available
      const fetchAvatar = async () => {
        try {
          if (user.id) {
            const { data, error } = await supabase
              .storage
              .from('avatars')
              .list(user.id, {
                limit: 1,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
              });
            
            if (error) {
              console.error('Error fetching avatar:', error);
              return;
            }
            
            if (data && data.length > 0) {
              const { data: avatarData } = supabase
                .storage
                .from('avatars')
                .getPublicUrl(`${user.id}/${data[0].name}`);
                
              setAvatarUrl(avatarData.publicUrl);
            }
          }
        } catch (error) {
          console.error('Error fetching avatar:', error);
        }
      };
      
      fetchAvatar();
    }
  }, [user]);
  
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      
      // Update profile data first
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });
      
      if (updateError) {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: updateError.message,
        });
        return;
      }
      
      // Handle avatar upload if available
      if (avatar) {
        const fileExt = avatar.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;
        
        // Upload the new avatar
        const { error: uploadError } = await supabase
          .storage
          .from('avatars')
          .upload(filePath, avatar, {
            upsert: true
          });
          
        if (uploadError) {
          toast({
            variant: "destructive",
            title: "Avatar upload failed",
            description: uploadError.message,
          });
          return;
        }
        
        // Get the public URL for the avatar
        const { data } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        setAvatarUrl(data.publicUrl);
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update profile",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSavePassword = async () => {
    try {
      setIsSaving(true);
      
      if (newPassword !== confirmPassword) {
        toast({
          variant: "destructive",
          title: "Passwords don't match",
          description: "New password and confirmation password do not match.",
        });
        return;
      }
      
      // Call Supabase auth API to update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: error.message,
        });
        return;
      }
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update password",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      // Preview the selected image
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);
    }
  };
  
  const handleNavigateBack = () => {
    navigate(returnTo);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            className="mr-4"
            onClick={handleNavigateBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Account Settings</h1>
        </div>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          
          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your profile information and avatar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Profile" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500 bg-gray-100">
                          {user?.user_metadata?.full_name ? 
                            user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() :
                            user?.email?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <Label 
                      htmlFor="avatar-upload" 
                      className="absolute bottom-0 right-0 bg-hrflow-blue text-white rounded-full p-2 cursor-pointer shadow-md hover:bg-blue-700 transition-colors"
                    >
                      <Camera className="h-4 w-4" />
                    </Label>
                    <Input 
                      type="file" 
                      id="avatar-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        value={email} 
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-sm text-gray-500">Email cannot be changed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleSaveProfile} 
                  className="bg-hrflow-blue text-white hover:bg-blue-700"
                  disabled={isSaving}
                >
                  {isSaving ? <LoadingSpinner size="sm" color="white" /> : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your password and authentication settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input 
                    id="currentPassword" 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter a new password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleSavePassword} 
                  className="bg-hrflow-blue text-white hover:bg-blue-700"
                  disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
                >
                  {isSaving ? <LoadingSpinner size="sm" color="white" /> : "Change Password"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Preferences Settings */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates and alerts via email</p>
                  </div>
                  <Switch 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates and alerts via SMS</p>
                  </div>
                  <Switch 
                    checked={smsNotifications} 
                    onCheckedChange={setSmsNotifications}
                    className="data-[state=checked]:bg-blue-600" 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates and alerts via push notifications</p>
                  </div>
                  <Switch 
                    checked={pushNotifications} 
                    onCheckedChange={setPushNotifications}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  className="bg-blue-600 text-white hover:bg-blue-700 font-bold"
                >
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
