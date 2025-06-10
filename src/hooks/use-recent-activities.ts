import { useState, useEffect } from 'react';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { RecentActivity, ActivityCategory } from '@/types/activityTypes';
import { useToast } from '@/hooks/use-toast';

export const useRecentActivities = (
  initialPage = 1,
  initialPageSize = 10,
  initialCategory: ActivityCategory = 'all'
) => {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);
  const [category, setCategory] = useState<ActivityCategory>(initialCategory);
  const { user } = useAuth();
  const { toast } = useToast();

  const totalPages = Math.ceil(totalCount / pageSize);

  const fetchActivities = async () => {
    if (!user) {
      setActivities([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getAuthorizedClient();

      // First get the count for pagination
      let countQuery = supabase
        .from('recent_activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (category !== 'all') {
        countQuery = countQuery.eq('category', category);
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      setTotalCount(count || 0);

      // Then fetch the actual data with pagination
      let query = supabase
        .from('recent_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error: fetchError } = await query.range(from, to);

      if (fetchError) throw fetchError;

      setActivities(data || []);
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      setError(err.message || 'Unknown error');
      toast({
        title: 'Error',
        description: 'Failed to load recent activities.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const nextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const changeCategory = (newCategory: ActivityCategory) => {
    setCategory(newCategory);
    setPage(1); // Reset to first page when changing category
  };

  useEffect(() => {
    fetchActivities();
    // Only fetch if user exists
    // (fetchActivities itself handles the "no user" scenario)
    // eslint-disable-next-line
  }, [user, page, category]);

  return {
    activities,
    loading,
    error,
    page,
    totalPages,
    nextPage,
    prevPage,
    category,
    changeCategory,
    fetchActivities,
  };
};
