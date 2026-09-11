'use client';

import * as React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { stepLabel } from '@/lib/workflow';
import { WorkflowRoadmap } from '@/components/workflow-roadmap';

function RoadmapPreview({ targetStep }: { targetStep: number }) {
  return (
    <div className="animate-in fade-in-0 slide-in-from-top-3 zoom-in-95 ease-out rounded-lg border bg-muted/20 p-4 duration-500 delay-150 fill-mode-both">
      <WorkflowRoadmap role="seller" currentStep={targetStep} onNodeClick={() => {}} />
    </div>
  );
}

export function ForwardConfirmDialog({
  open,
  targetStep,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  targetStep: number | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Is this step done?</DialogTitle>
          <DialogDescription>
            {targetStep
              ? `Confirming will move this order to Step ${targetStep}: ${stepLabel(targetStep, 'seller')}.`
              : ''}
          </DialogDescription>
        </DialogHeader>
        {targetStep && <RoadmapPreview targetStep={targetStep} />}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Not now</Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BackwardWarningDialog({
  open,
  targetStep,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  targetStep: number | null;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [ack, setAck] = React.useState(false);
  const [reason, setReason] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setAck(false);
      setReason('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-600 dark:text-amber-400">⚠️ You're moving this order backward</DialogTitle>
          <DialogDescription>
            {targetStep
              ? `This order will be moved back to Step ${targetStep}: ${stepLabel(targetStep, 'seller')}. Please confirm this is intentional.`
              : ''}
          </DialogDescription>
        </DialogHeader>

        {targetStep && <RoadmapPreview targetStep={targetStep} />}

        <div className="space-y-4 py-2">
          <RadioGroup value={ack ? 'yes' : ''} onValueChange={(v) => setAck(v === 'yes')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="ack-back" />
              <Label htmlFor="ack-back" className="font-normal">Yes, I intentionally want to move this order back a step</Label>
            </div>
          </RadioGroup>

          <div className="space-y-1.5">
            <Label htmlFor="back-reason" className="text-sm">Why are you moving it back? (required)</Label>
            <Textarea
              id="back-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Seller submitted wrong info, sending it back to the verification step…"
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={!ack || reason.trim().length === 0}
            onClick={() => onConfirm(reason.trim())}
          >
            Move it back
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
 
