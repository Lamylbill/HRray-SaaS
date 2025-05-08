
import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Info 
} from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { ComplianceCheck } from '@/hooks/use-compliance';
import { Card } from '@/components/ui/card';

interface OvertimeBreachesProps {
  data: ComplianceCheck[];
  onRefresh: () => void;
}

const OvertimeBreaches: React.FC<OvertimeBreachesProps> = ({ data, onRefresh }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Overtime & Rest Day Breach Alerts</h3>
        <Button variant="outline" onClick={onRefresh} size="sm">
          <Clock className="h-4 w-4 mr-2" />
          Check Overtime Compliance
        </Button>
      </div>

      <Card className="p-6">
        <div className="text-center py-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium mb-2">Overtime & Hours Compliance</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            This module monitors working hour regulations and overtime limits to ensure compliance with MOM guidelines.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Overtime Hours Compliance</h4>
              <p className="text-sm text-gray-600 mb-3">
                Checks if overtime hours are within legal limits
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Run Check
              </Button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Rest Day Work Compliance</h4>
              <p className="text-sm text-gray-600 mb-3">
                Monitors rest day work and compensation
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Run Check
              </Button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Working Hours Limits</h4>
              <p className="text-sm text-gray-600 mb-3">
                Checks for excessive working hours
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Run Check
              </Button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Part-Time Employee Hours</h4>
              <p className="text-sm text-gray-600 mb-3">
                Ensures part-time employee hour compliance
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

export default OvertimeBreaches;
