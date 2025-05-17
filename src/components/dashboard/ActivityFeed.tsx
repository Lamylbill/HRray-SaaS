
import React from 'react';
import { Link } from 'react-router-dom';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { useRecentActivities } from '@/hooks/use-recent-activities';
import { ActivityCategory } from '@/types/activityTypes';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';

// Format date based on how recent it is
const formatActivityDate = (dateString: string): string => {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return `Today, ${format(date, 'h:mm a')}`;
  } else if (isYesterday(date)) {
    return `Yesterday, ${format(date, 'h:mm a')}`;
  } else if (date.getFullYear() === new Date().getFullYear()) {
    return format(date, 'dd MMM, h:mm a');
  } else {
    return format(date, 'dd MMM yyyy, h:mm a');
  }
};

// Get relative time for tooltip
const getRelativeTime = (dateString: string): string => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
};

// Get color for category badge
const getCategoryColor = (category?: string): string => {
  switch (category) {
    case 'leave':
      return 'bg-blue-100 text-blue-800';
    case 'employee':
      return 'bg-green-100 text-green-800';
    case 'document':
      return 'bg-amber-100 text-amber-800';
    case 'payroll':
      return 'bg-purple-100 text-purple-800';
    case 'compliance':
      return 'bg-red-100 text-red-800';
    case 'system':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const ActivityItem: React.FC<{ 
  message: string; 
  date: string; 
  category?: string;
  targetUrl?: string;
}> = ({ message, date, category, targetUrl }) => {
  const formattedDate = formatActivityDate(date);
  const relativeTime = getRelativeTime(date);
  
  const content = (
    <div className="border-b border-gray-100 px-4 py-3 hover:bg-gray-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {category && (
            <Badge variant="outline" className={`mb-1 ${getCategoryColor(category)}`}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Badge>
          )}
          <p className="text-sm text-gray-700">{message}</p>
        </div>
        <time className="text-xs text-gray-500 whitespace-nowrap ml-2" title={relativeTime}>
          {formattedDate}
        </time>
      </div>
    </div>
  );
  
  if (targetUrl) {
    return <Link to={targetUrl} className="block">{content}</Link>;
  }
  
  return <div>{content}</div>;
};

interface ActivityFeedProps {
  initialCategory?: ActivityCategory;
  initialPageSize?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  initialCategory = 'all',
  initialPageSize = 10
}) => {
  const {
    activities,
    loading,
    error,
    page,
    totalPages,
    nextPage,
    prevPage,
    category,
    changeCategory,
  } = useRecentActivities(1, initialPageSize, initialCategory);
  
  const categories: Array<{ value: ActivityCategory; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'employee', label: 'Employees' },
    { value: 'leave', label: 'Leave' },
    { value: 'document', label: 'Documents' },
    { value: 'payroll', label: 'Payroll' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'system', label: 'System' },
  ];
  
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Failed to load activities. Please try again later.
      </div>
    );
  }
  
  if (activities.length === 0) {
    return (
      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge
              key={cat.value}
              variant={category === cat.value ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => changeCategory(cat.value)}
            >
              {cat.label}
            </Badge>
          ))}
        </div>
        <div className="p-10 text-center text-gray-500">
          No activities found. Check back later!
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Badge
            key={cat.value}
            variant={category === cat.value ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => changeCategory(cat.value)}
          >
            {cat.label}
          </Badge>
        ))}
      </div>
      
      <div className="bg-white rounded-lg border">
        <div className="divide-y divide-gray-100">
          {activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              message={activity.message}
              date={activity.created_at}
              category={activity.category}
              targetUrl={activity.target_url}
            />
          ))}
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={prevPage} 
                    className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} 
                  />
                </PaginationItem>
                <span className="text-sm text-gray-500 mx-2">Page {page} of {totalPages}</span>
                <PaginationItem>
                  <PaginationNext 
                    onClick={nextPage} 
                    className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} 
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
