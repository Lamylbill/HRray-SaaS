
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface EditorProps {
  initialContent: string;
  onChange: (content: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ initialContent, onChange }) => {
  const [content, setContent] = useState(initialContent || '');

  useEffect(() => {
    setContent(initialContent || '');
  }, [initialContent]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onChange(e.target.value);
  };

  return (
    <Textarea
      value={content}
      onChange={handleChange}
      className="min-h-[300px]"
      placeholder="Write your blog post content here..."
    />
  );
};
