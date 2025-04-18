import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { BlogPostFormData, BlogCategory } from '@/integrations/supabase/blog-types';
import { MultiSelect } from '@/components/ui/multi-select';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { blogService } from '@/services/blog.service';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { Editor } from '@/components/blog/Editor';
import { DatePicker } from 'react-datepicker';

interface BlogPostFormProps {
  initialData?: Partial<BlogPostFormData>;
  categories: BlogCategory[];
  postId?: string;
  onSuccess?: () => void;
}

export const BlogPostForm: React.FC<BlogPostFormProps> = ({
  initialData,
  categories,
  postId,
  onSuccess
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState<BlogPostFormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    excerpt: initialData?.excerpt || '',
    meta_description: initialData?.meta_description || '',
    cover_image: initialData?.cover_image,
    tags: initialData?.tags || [],
    category_ids: initialData?.category_ids || [],
    is_published: initialData?.is_published ?? false,
    publish_at: initialData?.publish_at || null,
  });
  
  const [tagInput, setTagInput] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, is_published: checked }));
  };
  
  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };
  
  const handleCategoryChange = (selectedIds: string[]) => {
    setFormData(prev => ({ ...prev, category_ids: selectedIds }));
  };
  
  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };
  
  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }));
  };
  
  const handlePublishAtChange = (date: Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      publish_at: date || null,
    }));
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setIsUploading(true);
    
    try {
      const imageUrl = await blogService.uploadImage(file, user.id);
      setFormData(prev => ({ ...prev, cover_image: imageUrl }));
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast({
        title: "Required fields missing",
        description: "Please provide a title for your post.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to publish a post.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (postId) {
        await blogService.updatePost(postId, formData);
        toast({
          title: "Post updated",
          description: "Your blog post has been updated successfully.",
        });
      } else {
        const newPostId = await blogService.createPost(formData, user.id);
        toast({
          title: "Post created",
          description: "Your blog post has been created successfully.",
        });
        
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(`/blog/post/${newPostId}`);
        }
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: "Error saving post",
        description: "There was an error saving your post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const categoryOptions = categories.map(category => ({
    label: category.name,
    value: category.id
  }));
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{postId ? 'Edit Post' : 'Create New Post'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter post title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Editor
              initialContent={formData.content}
              onChange={handleContentChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              placeholder="Brief summary of the post"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="meta_description">Meta Description (for SEO)</Label>
            <Textarea
              id="meta_description"
              name="meta_description"
              value={formData.meta_description}
              onChange={handleChange}
              placeholder="Description for search engines"
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cover_image">Cover Image</Label>
            <div className="flex flex-col gap-2">
              {formData.cover_image && (
                <div className="relative w-full h-40 bg-gray-100 rounded-md overflow-hidden">
                  <img
                    src={formData.cover_image}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setFormData(prev => ({ ...prev, cover_image: undefined }))}
                  >
                    Remove
                  </Button>
                </div>
              )}
              
              <Input
                id="cover_image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              
              {isUploading && (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm text-gray-500">Uploading image...</span>
                </div>
              )}
            </div>
          </div>
          
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label>Categories</Label>
              <MultiSelect
                options={categories.map(category => ({
                  label: category.name,
                  value: category.id
                }))}
                selected={formData.category_ids || []}
                onChange={handleCategoryChange}
                placeholder="Select categories"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags?.map(tag => (
                <div
                  key={tag}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    className="ml-1 text-blue-600 hover:text-blue-800"
                    onClick={() => removeTag(tag)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" onClick={addTag}>Add</Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="is_published">Publish immediately</Label>
            </div>
            
            {!formData.is_published && (
              <div className="space-y-2">
                <Label htmlFor="publish_at">Schedule publication</Label>
                <DatePicker
                  id="publish_at"
                  selected={formData.publish_at}
                  onChange={handlePublishAtChange}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  minDate={new Date()}
                  placeholderText="Select date and time"
                />
              </div>
            )}
          </div>
          
          <CardFooter className="px-0 pb-0 pt-4">
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {postId ? 'Updating...' : 'Publishing...'}
                </>
              ) : (
                postId ? 'Update Post' : 'Publish Post'
              )}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
};
