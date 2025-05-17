
import { getAuthorizedClient } from '@/integrations/supabase/client';
import type { ActivityCategory } from '@/types/activityTypes';

interface CreateActivityParams {
  userId: string;
  employeeId?: string;
  activityType: string;
  message: string;
  category?: ActivityCategory;
  targetUrl?: string;
}

/**
 * Create a manual activity log entry
 */
export const createActivity = async ({
  userId,
  employeeId,
  activityType,
  message,
  category,
  targetUrl
}: CreateActivityParams) => {
  try {
    const supabase = getAuthorizedClient();
    
    const { data, error } = await supabase
      .from('recent_activities')
      .insert({
        user_id: userId,
        employee_id: employeeId,
        activity_type: activityType,
        message,
        category,
        target_url: targetUrl
      });
      
    if (error) {
      console.error('Error creating activity:', error);
      return { error };
    }
    
    return { data };
  } catch (err) {
    console.error('Unexpected error creating activity:', err);
    return { error: err };
  }
};
