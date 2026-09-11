'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WORKFLOW_STEPS, stepLabel, type WorkflowRole } from '@/lib/workflow';

export function WorkflowRoadmap({
  role,
  currentStep,
  onNodeClick,
}: {
  role: WorkflowRole;
  currentStep: number;
  onNodeClick: (step: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center">
        {WORKFLOW_STEPS.map((s, i) => {
          const isDone = s.step < currentStep;
          const isCurrent = s.step === currentStep;
          const isLast = i === WORKFLOW_STEPS.length - 1;
          return (
            <div key={s.step} className={cn('flex items-center', !isLast && 'flex-1')}>
              <button
                type="button"
                onClick={() => onNodeClick(s.step)}
                title={stepLabel(s.step, role)}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  isDone && 'bg-emerald-600 text-white hover:bg-emerald-500',
                  isCurrent && 'bg-blue-600 text-white ring-4 ring-blue-500/25',
                  !isDone && !isCurrent && 'bg-muted text-muted-foreground hover:bg-muted/70'
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : s.step}
              </button>
              {!isLast && (
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    s.step < currentStep ? 'bg-emerald-600' : 'bg-muted'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs font-medium text-muted-foreground">
        {`Step ${currentStep}: ${stepLabel(currentStep, role)}`}
      </p>
    </div>
  );
}
 
