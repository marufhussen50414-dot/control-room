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
          <DialogTitle>এই স্টেপের কাজ শেষ?</DialogTitle>
          <DialogDescription>
            {targetStep
              ? `কনফার্ম করলে অর্ডারটি Step ${targetStep}: ${stepLabel(targetStep, 'seller')} সেকশনে চলে যাবে। সেখানেও এই একই রোডম্যাপ দেখতে পারবেন।`
              : ''}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>এখনই না</Button>
          <Button onClick={onConfirm}>কনফার্ম করুন</Button>
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
          <DialogTitle className="text-amber-600 dark:text-amber-400">⚠️ আপনি পিছনের স্টেপে যাচ্ছেন</DialogTitle>
          <DialogDescription>
            {targetStep
              ? `এই অর্ডারটি Step ${targetStep}: ${stepLabel(targetStep, 'seller')} — আগের একটা স্টেপে ফিরিয়ে নেওয়া হবে। এটা ইচ্ছাকৃতভাবে নিশ্চিত করুন।`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <RadioGroup value={ack ? 'yes' : ''} onValueChange={(v) => setAck(v === 'yes')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="ack-back" />
              <Label htmlFor="ack-back" className="font-normal">হ্যাঁ, আমি ইচ্ছাকৃতভাবে এই অর্ডারটি পিছনের স্টেপে নিতে চাই</Label>
            </div>
          </RadioGroup>

          <div className="space-y-1.5">
            <Label htmlFor="back-reason" className="text-sm">কেন পিছনে নিচ্ছেন? (কারণ লিখুন)</Label>
            <Textarea
              id="back-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="যেমন: সেলার ভুল তথ্য দিয়েছিল, তাই যাচাই স্টেপে ফিরিয়ে নেওয়া হচ্ছে…"
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>বাতিল করুন</Button>
          <Button
            variant="destructive"
            disabled={!ack || reason.trim().length === 0}
            onClick={() => onConfirm(reason.trim())}
          >
            পিছনে নিয়ে যান
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
