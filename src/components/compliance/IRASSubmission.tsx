
import React from 'react';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Info 
} from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { ComplianceCheck } from '@/hooks/use-compliance';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface IRASSubmissionProps {
  data: ComplianceCheck[];
  onRefresh: () => void;
}

const IRASSubmission: React.FC<IRASSubmissionProps> = ({ data, onRefresh }) => {
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

  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">IRAS Submission Status</h3>
        <Button variant="outline" onClick={onRefresh} size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Check Submission Status
        </Button>
      </div>

      {data.length === 0 ? (
        <Card className="p-6">
          <div className="text-center py-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium mb-1">No IRAS submission data available</h3>
            <p className="text-gray-500 mb-4">
              Track your IR8A and other IRAS form submissions here
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>IR8A Submissions for {prevYear}</span>
                <Badge variant="outline">Not Started</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Appendix 8A for {prevYear}</span>
                <Badge variant="outline">Not Started</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Appendix 8B for {prevYear}</span>
                <Badge variant="outline">Not Started</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>IR8S for {prevYear}</span>
                <Badge variant="outline">Not Started</Badge>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <div className="mb-4">
          <Accordion type="single" collapsible>
            {data.map((check) => (
              <AccordionItem key={check.id} value={check.id}>
                <AccordionTrigger className="py-3 px-4 bg-gray-50 rounded-t-md hover:bg-gray-100">
                  <div className="flex items-center space-x-3 w-full">
                    <div>{getStatusIcon(check.status)}</div>
                    <div className="flex-1 text-left">
                      <span className="font-medium">IRAS Submission Check</span>
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
                  {check.details && (
                    <div className="space-y-3">
                      {check.details.submissions?.map((submission: any) => (
                        <div 
                          key={submission.id} 
                          className="flex justify-between items-center p-3 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="font-medium">{submission.form_type}</p>
                            <p className="text-xs text-gray-500">Year: {submission.year}</p>
                          </div>
                          <Badge className={getStatusClass(submission.status)}>
                            {submission.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
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

export default IRASSubmission;
