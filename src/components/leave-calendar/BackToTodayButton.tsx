
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
      className="fixed top-24 right-6 shadow-lg z-50 bg-blue-700 hover:bg-blue-800 text-white"
      size="sm"
    >
      <CalendarClock className="w-4 h-4 mr-2" />
      Back to Today
    </Button>
  );
};

export default BackToTodayButton;
