
import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  X,
  Camera,
  RotateCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase, AVATAR_BUCKET, ensureStorageBucket } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui-custom/Button';

interface ProfilePhotoUploaderProps {
  employeeId?: string;
  currentPhotoUrl?: string;
  disabled?: boolean;
}

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  employeeId,
  currentPhotoUrl,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentPhotoUrl);
  const [bucketError, setBucketError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const checkBucket = async () => {
      setBucketError(null);
      const bucketReady = await ensureStorageBucket(AVATAR_BUCKET);
      if (!bucketReady) {
        setBucketError('Profile photo storage is not properly configured. Please contact an administrator.');
      }
    };
    checkBucket();
  }, []);

  const uploadPhoto = async (file: File) => {
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to upload a profile photo.',
        variant: 'destructive',
      });
      return;
    }

    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select an image to upload.',
        variant: 'destructive',
      });
      return;
    }

    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a JPG or PNG image.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Profile photo must be less than 2MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      await ensureStorageBucket(AVATAR_BUCKET);

      const fileExt = file.name.split('.').pop();
      const tempId = employeeId || 'temp_' + Math.random().toString(36).substring(2, 11);
      const fileName = `${tempId}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Using supabase directly instead of getAuthorizedClient
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL after upload
      const { data: urlData } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(filePath);
      
      const publicUrl = urlData.publicUrl;
      setAvatarUrl(publicUrl);
      
      // If employeeId exists, update profile_picture in DB
      if (employeeId) {
        const { error: updateError } = await supabase
          .from('employees')
          .update({ profile_picture: publicUrl })
          .eq('id', employeeId);
      
        if (updateError) throw updateError;
      }
      
      toast({
        title: 'Photo Uploaded',
        description: 'Profile photo has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error uploading profile photo:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'An error occurred while uploading the profile photo.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadPhoto(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const initials = employeeId
    ? currentPhotoUrl
      ? ''
      : '?'
    : 'New';

  return (
    <div className="relative flex-shrink-0">
      <Avatar className="h-20 w-20 min-w-[80px] min-h-[80px] border-2 border-gray-200 overflow-hidden">
        <AvatarImage src={avatarUrl || currentPhotoUrl} width={80} height={80} />
        <AvatarFallback className="bg-hrflow-blue text-white text-xl">
          {initials}
        </AvatarFallback>
      </Avatar>

      {!disabled && (
        <div className="absolute -bottom-2 -right-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/jpeg,image/png,image/jpg"
          />
          <Button
            type="button"
            size="sm"
            variant="primary"
            className="rounded-full w-8 h-8 p-0"
            onClick={handleUploadClick}
            disabled={isUploading}
            aria-label="Upload profile photo"
          >
            {isUploading ? (
              <RotateCw className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {bucketError && (
        <div className="absolute -bottom-2 -right-2">
          <div className="bg-red-100 text-red-600 text-xs p-1 rounded">
            ⚠️
          </div>
        </div>
      )}
    </div>
  );
};
