
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui-custom/Button';
import { AlertTriangle, FileText, CheckCircle, Info } from 'lucide-react';
import { ComplianceCheck } from '@/hooks/use-compliance';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

interface CPFValidationProps {
  data: ComplianceCheck[];
  onRefresh: () => void;
}

const CPFValidation: React.FC<CPFValidationProps> = ({ data, onRefresh }) => {
  const [isExpanded, setIsExpanded] = useState<string | null>(null);

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
        <h3 className="text-lg font-medium">CPF Validation</h3>
        <Button variant="outline" onClick={onRefresh} size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Run Check
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">No CPF validation checks found. Run a check to see results.</p>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <Accordion type="single" collapsible>
              {data.map((check, index) => (
                <AccordionItem key={check.id} value={check.id}>
                  <AccordionTrigger className="py-3 px-4 bg-gray-50 rounded-t-md hover:bg-gray-100">
                    <div className="flex items-center space-x-3 w-full">
                      <div>{getStatusIcon(check.status)}</div>
                      <div className="flex-1 text-left">
                        <span className="font-medium">CPF Validation Check</span>
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
                    {check.details?.employees?.length > 0 ? (
                      <div>
                        <h4 className="font-medium mb-2">Employees with missing CPF information:</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Employee Name</TableHead>
                              <TableHead>CPF Account Number</TableHead>
                              <TableHead>CPF Contribution</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {check.details.employees.map((emp: any) => (
                              <TableRow key={emp.id}>
                                <TableCell>{emp.full_name}</TableCell>
                                <TableCell>
                                  {emp.cpf_account_number || (
                                    <span className="text-red-500">Missing</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {emp.cpf_contribution !== null ? (
                                    emp.cpf_contribution ? 'Yes' : 'No'
                                  ) : (
                                    <span className="text-red-500">Not specified</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-green-600">All employees have complete CPF information.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      )}
    </div>
  );
};

export default CPFValidation;
