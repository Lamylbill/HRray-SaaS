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
import { Badge } from "@/components/ui/badge";
import { getCurrentSubscription, refreshSubscriptionStatus, openCustomerPortal, startCheckout } from "@/utils/subscriptionUtils";

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
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  
  const [subscription, setSubscription] = useState<any | null>(null);
  const [subLoading, setSubLoading] = useState<boolean>(false);
  
  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setFullName(user.user_metadata?.full_name || '');
      
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
  
  useEffect(() => {
    const fetchSubscription = async () => {
      setSubLoading(true);
      const data = await getCurrentSubscription();
      setSubscription(data);
      setSubLoading(false);
    };
    fetchSubscription();
  }, [user]);
  
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      
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
      
      if (avatar) {
        const fileExt = avatar.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;
        
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
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);
    }
  };
  
  const handleNavigateBack = () => {
    navigate(returnTo);
  };
  
  const handleRefreshPlan = async () => {
    setSubLoading(true);
    const res = await refreshSubscriptionStatus();
    if (res.success) {
      toast({ title: "Subscription status refreshed!" });
      setSubscription(await getCurrentSubscription());
    } else {
      toast({ variant: "destructive", title: "Refresh failed", description: res.error });
    }
    setSubLoading(false);
  };
  
  const handleUpgrade = async () => {
    await startCheckout("pro", "monthly");
  };
  
  const handleManageSubscription = async () => {
    await openCustomerPortal();
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
        
        {/* My Plan Card */}
        <Card className="mb-0">
          <CardHeader>
            <CardTitle>My Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {subLoading ? (
              <div className="flex items-center py-8"><LoadingSpinner /> <span className="ml-3">Loading plan info...</span></div>
            ) : (
              <div className="md:flex md:items-center md:justify-between py-2">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold">
                      {subscription?.subscription_tier ? subscription.subscription_tier : "No Plan"}
                    </span>
                    {subscription?.subscribed && (
                      <Badge className="bg-green-500 text-white">Active</Badge>
                    )}
                    {!subscription?.subscribed && (
                      <Badge variant="outline" className="text-gray-700 border-gray-300">Inactive</Badge>
                    )}
                  </div>
                  <div className="text-blue-800 text-sm mt-2">
                    {subscription && subscription.subscription_end
                      ? (
                        <>Renews / Ends: {new Date(subscription.subscription_end).toLocaleDateString()}</>
                      )
                      : <>No subscription on file.</>
                    }
                  </div>
                </div>
                <div className="mt-4 md:mt-0 flex gap-3">
                  {!subscription?.subscribed && (
                    <Button onClick={handleUpgrade} className="bg-blue-600 text-white font-bold">
                      Upgrade to Pro
                    </Button>
                  )}
                  {subscription?.subscribed && (
                    <Button variant="outline" onClick={handleManageSubscription}>
                      Manage Subscription
                    </Button>
                  )}
                  <Button variant="secondary" onClick={handleRefreshPlan} disabled={subLoading}>
                    {subLoading ? <LoadingSpinner size="sm" /> : "Refresh"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Redesigned Settings Tabs - styled like navbar, below My Plan card */}
        <div className="w-full flex justify-center mt-8 mb-8">
          <div className="w-full max-w-2xl">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="w-full flex bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                <TabsTrigger 
                  value="profile" 
                  className="flex-1 text-base text-center px-5 py-3 font-semibold transition-all hover:bg-blue-50 data-[state=active]:bg-blue-700 data-[state=active]:text-white focus-visible:bg-blue-700 focus-visible:text-white"
                >
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="flex-1 text-base text-center px-5 py-3 font-semibold transition-all hover:bg-blue-50 data-[state=active]:bg-blue-700 data-[state=active]:text-white focus-visible:bg-blue-700 focus-visible:text-white"
                >
                  Security
                </TabsTrigger>
                <TabsTrigger 
                  value="preferences" 
                  className="flex-1 text-base text-center px-5 py-3 font-semibold transition-all hover:bg-blue-50 data-[state=active]:bg-blue-700 data-[state=active]:text-white focus-visible:bg-blue-700 focus-visible:text-white"
                >
                  Preferences
                </TabsTrigger>
              </TabsList>
              <div className="w-full mt-10">
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
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
