// Shared Buyer/Seller order-progress roadmap.
//
// There is ONE underlying value per order (`workflow_status`, stored on the
// `orders` row). Steps 1, 2 and 4 look identical to both sides; steps 3 and 5
// show different wording per role even though it's the same underlying
// event (e.g. seller "Submitted" == buyer "Received"). Because both the
// Buyer panel and the Seller panel just render different labels for the
// same stored value, changing it from either side updates both instantly —
// there is no separate buyer/seller state to keep in sync.

export type WorkflowRole = 'buyer' | 'seller';

export type WorkflowStatus =
  | 'step1_checking'
  | 'step1_paid'
  | 'step2_escrow'
  | 'step3_pending'
  | 'step3_submitted'
  | 'step4_checking'
  | 'step4_approved'
  | 'step4_disputed'
  | 'step5_processing'
  | 'step5_released';

export type WorkflowTone = 'neutral' | 'progress' | 'success' | 'danger';

export type WorkflowStatusOption = {
  code: WorkflowStatus;
  sellerLabel: string;
  buyerLabel: string;
  tone: WorkflowTone;
  // true when picking this status means this step's work is done and the
  // order is allowed to move on to the next step.
  advances: boolean;
};

export type WorkflowStepDef = {
  step: number;
  sellerLabel: string;
  buyerLabel: string;
  statuses: WorkflowStatusOption[];
};

export const DEFAULT_WORKFLOW_STATUS: WorkflowStatus = 'step1_checking';

export const WORKFLOW_STEPS: WorkflowStepDef[] = [
  {
    step: 1,
    sellerLabel: 'Order Placed',
    buyerLabel: 'Order Placed',
    statuses: [
      { code: 'step1_checking', sellerLabel: 'Under Checking', buyerLabel: 'Under Checking', tone: 'neutral', advances: false },
      { code: 'step1_paid', sellerLabel: 'Paid', buyerLabel: 'Paid', tone: 'progress', advances: true },
    ],
  },
  {
    step: 2,
    sellerLabel: 'Payment Received',
    buyerLabel: 'Payment Received',
    statuses: [
      { code: 'step2_escrow', sellerLabel: 'In Escrow', buyerLabel: 'In Escrow', tone: 'progress', advances: true },
    ],
  },
  {
    step: 3,
    sellerLabel: 'Submit Account Info',
    buyerLabel: 'Waiting for Account Info',
    statuses: [
      { code: 'step3_pending', sellerLabel: 'Pending', buyerLabel: 'Waiting', tone: 'neutral', advances: false },
      { code: 'step3_submitted', sellerLabel: 'Submitted', buyerLabel: 'Received', tone: 'progress', advances: true },
    ],
  },
  {
    step: 4,
    sellerLabel: 'Account Transfer & Verification',
    buyerLabel: 'Account Transfer & Verification',
    statuses: [
      { code: 'step4_checking', sellerLabel: 'Checking (23:59)', buyerLabel: 'Checking (23:59)', tone: 'neutral', advances: false },
      { code: 'step4_approved', sellerLabel: 'Approved', buyerLabel: 'Approved', tone: 'success', advances: true },
      { code: 'step4_disputed', sellerLabel: 'Disputed', buyerLabel: 'Disputed', tone: 'danger', advances: false },
    ],
  },
  {
    step: 5,
    sellerLabel: 'Payout Status',
    buyerLabel: 'Payment Status',
    statuses: [
      { code: 'step5_processing', sellerLabel: 'Processing', buyerLabel: 'Processing', tone: 'neutral', advances: false },
      { code: 'step5_released', sellerLabel: 'Released to Wallet', buyerLabel: 'Released to Seller', tone: 'success', advances: true },
    ],
  },
];

const STATUS_TO_STEP = new Map<WorkflowStatus, WorkflowStepDef>();
for (const stepDef of WORKFLOW_STEPS) {
  for (const s of stepDef.statuses) STATUS_TO_STEP.set(s.code, stepDef);
}

export function normalizeWorkflowStatus(value: string | null | undefined): WorkflowStatus {
  if (value && STATUS_TO_STEP.has(value as WorkflowStatus)) return value as WorkflowStatus;
  return DEFAULT_WORKFLOW_STATUS;
}

export function getStepDef(status: WorkflowStatus): WorkflowStepDef {
  return STATUS_TO_STEP.get(status) ?? WORKFLOW_STEPS[0];
}

export function getStepDefByNumber(step: number): WorkflowStepDef {
  return WORKFLOW_STEPS.find((s) => s.step === step) ?? WORKFLOW_STEPS[0];
}

export function getStatusOption(status: WorkflowStatus): WorkflowStatusOption {
  const stepDef = getStepDef(status);
  return stepDef.statuses.find((s) => s.code === status) ?? stepDef.statuses[0];
}

export function firstStatusOfStep(step: number): WorkflowStatus {
  return getStepDefByNumber(step).statuses[0].code;
}

// Whether the current status already satisfies this step's requirement,
// i.e. whether the order is allowed to move on to the next step.
export function canAdvanceFromStatus(status: WorkflowStatus): boolean {
  return getStatusOption(status).advances;
}

export function stepLabel(step: number, role: WorkflowRole): string {
  const stepDef = getStepDefByNumber(step);
  return role === 'buyer' ? stepDef.buyerLabel : stepDef.sellerLabel;
}

export function statusLabel(status: WorkflowStatus, role: WorkflowRole): string {
  const option = getStatusOption(status);
  return role === 'buyer' ? option.buyerLabel : option.sellerLabel;
}

export const TONE_CLASSNAMES: Record<WorkflowTone, string> = {
  neutral: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  progress: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};
