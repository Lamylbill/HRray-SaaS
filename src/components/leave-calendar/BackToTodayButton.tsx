
import React from 'react';
import { Button } from '@/components/ui/button';
import { CalendarClock } from 'lucide-react';

interface BackToTodayButtonProps {
  onClick: () => void;
  isVisible: boolean;
}

const BackToTodayButton: React.FC<BackToTodayButtonProps> = ({ onClick, isVisible }) => {
  if (!isVisible) return null;

  return (
    <Button
      onClick={onClick}
      className="fixed top-24 right-6 shadow-lg z-50 bg-white text-gray-800 hover:bg-gray-100"
      size="sm"
    >
      <CalendarClock className="w-4 h-4 mr-2" />
      Back to Today
    </Button>
  );
};

export default BackToTodayButton;
