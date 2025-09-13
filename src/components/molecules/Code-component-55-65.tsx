import { Check, Clock, AlertCircle } from 'lucide-react';
import { StatusIndicator } from '../atoms/StatusIndicator';
import { cn } from '../ui/utils';

/**
 * Progress Indicator for Regulatory Workflows
 * Shows user progression through complex compliance processes
 */

interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  status: 'pending' | 'current' | 'completed' | 'error';
  isOptional?: boolean;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function ProgressIndicator({ 
  steps, 
  className,
  orientation = 'horizontal' 
}: ProgressIndicatorProps) {
  const getStepIcon = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'current':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStepStatusColor = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'current':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'error':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  if (orientation === 'vertical') {
    return (
      <div className={cn('space-y-4', className)}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-3">
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0',
              getStepStatusColor(step.status)
            )}>
              {getStepIcon(step.status) || (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-medium text-slate-900">
                  {step.label}
                </h4>
                {step.isOptional && (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Optional
                  </span>
                )}
              </div>
              {step.description && (
                <p className="text-sm text-slate-600 mt-1">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Horizontal orientation
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full border-2',
              getStepStatusColor(step.status)
            )}>
              {getStepIcon(step.status) || (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            
            <div className="mt-2 text-center">
              <p className="text-sm font-medium text-slate-900">
                {step.label}
              </p>
              {step.isOptional && (
                <p className="text-xs text-slate-500">Optional</p>
              )}
            </div>
          </div>
          
          {index < steps.length - 1 && (
            <div className={cn(
              'w-full h-0.5 mx-4',
              steps[index + 1].status === 'completed' || steps[index + 1].status === 'current'
                ? 'bg-blue-300'
                : 'bg-gray-300'
            )} />
          )}
        </div>
      ))}
    </div>
  );
}