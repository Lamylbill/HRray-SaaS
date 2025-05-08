
import React from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { ComplianceCheck } from '@/hooks/use-compliance';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface WorkPassExpiryProps {
  data: ComplianceCheck[];
  onRefresh: () => void;
}

const WorkPassExpiry: React.FC<WorkPassExpiryProps> = ({ data, onRefresh }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Work Pass Expiry Monitoring</h3>
        <Button variant="outline" onClick={onRefresh} size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Check Expiry Dates
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">No work pass expiry checks found. Run a check to see results.</p>
        </div>
      ) : (
        <div className="mb-4">
          <Accordion type="single" collapsible>
            {data.map((check) => (
              <AccordionItem key={check.id} value={check.id}>
                <AccordionTrigger className="py-3 px-4 bg-gray-50 rounded-t-md hover:bg-gray-100">
                  <div className="flex items-center space-x-3 w-full">
                    <div>{getStatusIcon(check.status)}</div>
                    <div className="flex-1 text-left">
                      <span className="font-medium">Work Pass Expiry Check</span>
                      <div className="text-xs text-gray-500">
                        {new Date(check.checkDate).toLocaleDateString()} {new Date(check.checkDate).toLocaleTimeString()}
                      </div>
                    </div>
                    <Badge className={getStatusClass(check.status)}>
                      {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border border-t-0 border-gray-200 rounded-b-md p-4">
                  {check.details?.expired?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-red-600 mb-2 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Expired Work Passes
                      </h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee Name</TableHead>
                            <TableHead>Work Pass Type</TableHead>
                            <TableHead>Work Pass Number</TableHead>
                            <TableHead>Expiry Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {check.details.expired.map((emp: any) => (
                            <TableRow key={emp.id}>
                              <TableCell>{emp.full_name}</TableCell>
                              <TableCell>{emp.work_pass_type}</TableCell>
                              <TableCell>{emp.work_pass_number}</TableCell>
                              <TableCell className="text-red-600">
                                {new Date(emp.work_pass_expiry).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {check.details?.expiring_soon?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-yellow-600 mb-2 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Work Passes Expiring Soon
                      </h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee Name</TableHead>
                            <TableHead>Work Pass Type</TableHead>
                            <TableHead>Work Pass Number</TableHead>
                            <TableHead>Expiry Date</TableHead>
                            <TableHead>Days Remaining</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {check.details.expiring_soon.map((emp: any) => {
                            const expiryDate = new Date(emp.work_pass_expiry);
                            const today = new Date();
                            const daysRemaining = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            
                            return (
                              <TableRow key={emp.id}>
                                <TableCell>{emp.full_name}</TableCell>
                                <TableCell>{emp.work_pass_type}</TableCell>
                                <TableCell>{emp.work_pass_number}</TableCell>
                                <TableCell>{expiryDate.toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-yellow-50">
                                    {daysRemaining} days
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {!check.details?.expired?.length && !check.details?.expiring_soon?.length && (
                    <p className="text-green-600">All work passes are valid and not expiring soon.</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
};

export default WorkPassExpiry;
