
import React from 'react';
import { 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Info 
} from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { ComplianceCheck } from '@/hooks/use-compliance';
import { Card } from '@/components/ui/card';

interface LeavePolicyViolationsProps {
  data: ComplianceCheck[];
  onRefresh: () => void;
}

const LeavePolicyViolations: React.FC<LeavePolicyViolationsProps> = ({ data, onRefresh }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Leave Policy Violations</h3>
        <Button variant="outline" onClick={onRefresh} size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Check Leave Policies
        </Button>
      </div>

      <Card className="p-6">
        <div className="text-center py-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium mb-2">Leave Policy Compliance</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            This module monitors leave policy compliance including rest day requirements, 
            annual leave entitlements, and statutory leave provisions.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Statutory Leave Compliance</h4>
              <p className="text-sm text-gray-600 mb-3">
                Monitors compliance with statutory leave requirements
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Run Check
              </Button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Annual Leave Entitlements</h4>
              <p className="text-sm text-gray-600 mb-3">
                Verifies proper annual leave allocations
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Run Check
              </Button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Maternity & Paternity Leave</h4>
              <p className="text-sm text-gray-600 mb-3">
                Ensures correct handling of parental leave
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Run Check
              </Button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Rest Day Compliance</h4>
              <p className="text-sm text-gray-600 mb-3">
                Checks if employees are given mandatory rest days
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Run Check
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LeavePolicyViolations;
