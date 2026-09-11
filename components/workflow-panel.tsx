'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  WORKFLOW_STEPS,
  getStepDef,
  getStatusOption,
  firstStatusOfStep,
  stepLabel,
  statusLabel,
  TONE_CLASSNAMES,
  type WorkflowRole,
  type WorkflowStatus,
} from '@/lib/workflow';

export function WorkflowPanel({
  role,
  status,
  onChange,
}: {
  role: WorkflowRole;
  status: WorkflowStatus;
  onChange: (next: WorkflowStatus) => void;
}) {
  const isBuyer = role === 'buyer';
  const currentStep = getStepDef(status);
  const currentOption = getStatusOption(status);

  return (
    <Card className={isBuyer ? 'border-blue-200 dark:border-blue-500/20' : 'border-emerald-200 dark:border-emerald-500/20'}>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-xs font-semibold uppercase tracking-wide', isBuyer ? 'text-blue-700 dark:text-blue-400' : 'text-emerald-700 dark:text-emerald-400')}>
            {isBuyer ? 'Buyer Dashboard' : 'Seller Dashboard'}
          </p>
          <Badge variant="outline" className={cn('font-medium', TONE_CLASSNAMES[currentOption.tone])}>
            {statusLabel(status, role)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Step</p>
            <Select
              value={String(currentStep.step)}
              onValueChange={(v) => onChange(firstStatusOfStep(Number(v)))}
            >
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WORKFLOW_STEPS.map((s) => (
                  <SelectItem key={s.step} value={String(s.step)}>
                    {`Step ${s.step}: ${stepLabel(s.step, role)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Status</p>
            <Select value={status} onValueChange={(v) => onChange(v as WorkflowStatus)}>
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
