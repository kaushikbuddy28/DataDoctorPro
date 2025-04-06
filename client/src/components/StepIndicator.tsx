import { CircleIcon, CheckCircle2 } from 'lucide-react';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-4 sm:space-x-8">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div 
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold
                    ${index < currentStep 
                      ? 'bg-primary' 
                      : index === currentStep 
                        ? 'bg-primary' 
                        : 'bg-muted text-muted-foreground'
                    }
                  `}
                >
                  {index < currentStep ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span 
                  className={`
                    mt-2 text-sm font-medium whitespace-nowrap
                    ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'}
                  `}
                >
                  {step}
                </span>
              </div>
              
              {/* Connector line (except for last item) */}
              {index < steps.length - 1 && (
                <div 
                  className={`
                    w-16 sm:w-24 h-1 mx-1
                    ${index < currentStep 
                      ? 'bg-primary' 
                      : 'bg-muted'
                    }
                  `}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
