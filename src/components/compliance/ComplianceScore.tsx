
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComplianceScoreProps {
  score: number;
}

const ComplianceScore: React.FC<ComplianceScoreProps> = ({ score }) => {
  const getScoreColor = () => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = () => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getScoreMessage = () => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Needs Attention';
    if (score >= 50) return 'At Risk';
    return 'Critical';
  };

  return (
    <Card className="bg-white shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <ShieldCheck className="w-5 h-5 mr-2" />
          Compliance Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-4">
          <div 
            className={cn(
              "w-28 h-28 rounded-full flex items-center justify-center mb-2",
              getScoreBackground()
            )}
          >
            <span className={cn("text-3xl font-bold", getScoreColor())}>
              {score.toFixed(0)}%
            </span>
          </div>
          <p className="text-lg font-medium text-gray-800">{getScoreMessage()}</p>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Based on all compliance checks
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplianceScore;
