'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  getStepDef,
  getStatusOption,
  statusLabel,
  stepLabel,
  TONE_CLASSNAMES,
  type WorkflowRole,
  type WorkflowStatus,
} from '@/lib/workflow';
import { WorkflowRoadmap } from '@/components/workflow-roadmap';

export function WorkflowPanel({
  role,
  status,
  onRequestStatusChange,
  onRequestStepClick,
}: {
  role: WorkflowRole;
  status: WorkflowStatus;
  onRequestStatusChange: (next: WorkflowStatus) => void;
  onRequestStepClick: (step: number) => void;
}) {
  const isBuyer = role === 'buyer';
  const currentStep = getStepDef(status);
  const currentOption = getStatusOption(status);

  return (
    <Card className={isBuyer ? 'border-blue-200 dark:border-blue-500/20' : 'border-emerald-200 dark:border-emerald-500/20'}>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-xs font-semibold uppercase tracking-wide', isBuyer ? 'text-blue-700 dark:text-blue-400' : 'text-emerald-700 dark:text-emerald-400')}>
            {isBuyer ? 'Buyer Dashboard' : 'Seller Dashboard'}
          </p>
          <Badge variant="outline" className={cn('font-medium', TONE_CLASSNAMES[currentOption.tone])}>
            {statusLabel(status, role)}
          </Badge>
        </div>

        <WorkflowRoadmap role={role} currentStep={currentStep.step} onNodeClick={onRequestStepClick} />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Step</p>
            <div className="flex h-9 items-center truncate rounded-md border border-input bg-muted/30 px-3 text-sm text-muted-foreground">
              {`Step ${currentStep.step}: ${stepLabel(currentStep.step, role)}`}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Status</p>
            <Select value={status} onValueChange={(v) => onRequestStatusChange(v as WorkflowStatus)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {currentStep.statuses.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {role === 'buyer' ? s.buyerLabel : s.sellerLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
 
