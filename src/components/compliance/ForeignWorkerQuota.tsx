import React, { useState } from 'react';
import { 
  Users, 
  Edit, 
  Save, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ForeignWorkerQuota as ForeignWorkerQuotaType } from '@/hooks/use-compliance';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ForeignWorkerQuotaProps {
  data: ForeignWorkerQuotaType | null;
  onRefresh: () => void;
}

const SECTOR_QUOTA_PERCENTAGES: { [key: string]: number } = {
  'Services': 35,
  'Construction': 87.5,
  'Process': 87.5,
  'Manufacturing': 60,
  'Marine Shipyard': 77.8
};

const ForeignWorkerQuota: React.FC<ForeignWorkerQuotaProps> = ({ data, onRefresh }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [sector, setSector] = useState(data?.industrySector || 'Services');
  const [localHeadcount, setLocalHeadcount] = useState(data?.localHeadcount || 0);
  const [foreignHeadcount, setForeignHeadcount] = useState(data?.foreignHeadcount || 0);
  
  const quotaPercentage = SECTOR_QUOTA_PERCENTAGES[sector];
  const maxForeignAllowed = Math.floor(localHeadcount * (quotaPercentage / (100 - quotaPercentage)));
  const quotaUsage = maxForeignAllowed > 0 ? Math.min(100, (foreignHeadcount / maxForeignAllowed) * 100) : 0;
  
  const getQuotaStatusColor = () => {
    if (foreignHeadcount > maxForeignAllowed) return 'text-red-600';
    if (quotaUsage > 90) return 'text-yellow-600';
    return 'text-green-600';
  };
  
  const getProgressColor = () => {
    if (foreignHeadcount > maxForeignAllowed) return 'bg-red-500';
    if (quotaUsage > 90) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const handleSave = async () => {
    if (!user) return;
    
    try {
      const payload = {
        user_id: user.id,
        industry_sector: sector,
        quota_percentage: quotaPercentage,
        local_headcount: localHeadcount,
        foreign_headcount: foreignHeadcount,
        max_foreign_allowed: maxForeignAllowed
      };
      
      if (data?.id) {
        // Update existing record
        await supabase
          .from('foreign_worker_quota')
          .update(payload)
          .eq('id', data.id);
      } else {
        // Insert new record
        await supabase
          .from('foreign_worker_quota')
          .insert(payload);
      }
      
      setIsEditing(false);
      onRefresh();
      
      toast({
        title: 'Foreign worker quota updated',
        description: 'Your changes have been saved successfully.'
      });
    } catch (error) {
      console.error('Error saving foreign worker quota:', error);
      toast({
        title: 'Error saving data',
        description: 'Failed to update foreign worker quota information.',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Foreign Worker Quota Tracker</h3>
        {isEditing ? (
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSave} size="sm">
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(true)} size="sm">
            <Edit className="h-4 w-4 mr-1" />
            Edit Quota
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Foreign Worker Dependency Ratio</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="sector">Industry Sector</Label>
                <Select 
                  value={sector} 
                  onValueChange={(value) => setSector(value)}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Construction">Construction</SelectItem>
                    <SelectItem value="Process">Process</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Marine Shipyard">Marine Shipyard</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Foreign worker quota for {sector}: {quotaPercentage}%
                </p>
              </div>
              
              <div>
                <Label htmlFor="local-headcount">Local Employee Headcount</Label>
                <Input
                  id="local-headcount"
                  type="number"
                  min="0"
                  value={localHeadcount}
                  onChange={(e) => setLocalHeadcount(parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="foreign-headcount">Foreign Worker Headcount</Label>
                <Input
                  id="foreign-headcount"
                  type="number"
                  min="0"
                  value={foreignHeadcount}
                  onChange={(e) => setForeignHeadcount(parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Industry Sector</p>
                  <p className="font-medium">{sector || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dependency Ceiling</p>
                  <p className="font-medium">{quotaPercentage}%</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Local Employees</p>
                  <p className="font-medium">{localHeadcount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Foreign Workers</p>
                  <p className="font-medium">{foreignHeadcount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Maximum Allowed</p>
                  <p className="font-medium">{maxForeignAllowed}</p>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium">Foreign Worker Quota Usage</p>
                  <span className={`text-sm font-medium ${getQuotaStatusColor()}`}>
                    {foreignHeadcount} / {maxForeignAllowed}
                  </span>
                </div>
                <div className="relative">
                  <Progress value={quotaUsage} className="h-2" indicatorColor={getProgressColor()} />
                </div>
                {foreignHeadcount > maxForeignAllowed ? (
                  <p className="text-red-600 text-xs mt-1">
                    Quota exceeded by {foreignHeadcount - maxForeignAllowed} workers
                  </p>
                ) : (
                  <p className={`text-xs mt-1 ${getQuotaStatusColor()}`}>
                    {Math.max(0, maxForeignAllowed - foreignHeadcount)} additional foreign workers allowed
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForeignWorkerQuota;
