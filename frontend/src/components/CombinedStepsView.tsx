import React from 'react';
import type { OptimizationStep } from '@/lib/delivery-service';
import { Step1Card } from './Step1Card';
import { Step2Card } from './Step2Card';
import { Step3Card } from './Step3Card';
import { Step4Card } from './Step4Card';
import { Step5Card } from './Step5Card';
import { Step6Card } from './Step6Card';

interface CombinedStepsViewProps {
  steps: OptimizationStep[];
}

export const CombinedStepsView: React.FC<CombinedStepsViewProps> = ({ steps }) => {
  if (!steps || steps.length === 0) return null;

  // Backend guarantees exactly 6 steps in order (1..6)
  const s1 = steps[0];
  const s2 = steps[1];
  const s3 = steps[2];
  const s4 = steps[3];
  const s5 = steps[4];
  const s6 = steps[5];

  return (
    <div className="space-y-6">
      <Step1Card step={s1} />
      <Step2Card step={s2} />
      <Step3Card step={s3} />
      <Step4Card step={s4} />
      <Step5Card step={s5} />
      <Step6Card step={s6} />
    </div>
  );
};
