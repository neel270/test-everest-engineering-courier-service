import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Clock, Package } from 'lucide-react';
import type { OptimizationStep } from '@/lib/delivery-service';

interface StepsSixViewProps {
  steps: OptimizationStep[];
}

// Utility to left-pad numbers and align columns in a monospaced block
const pad = (val: string | number, len: number) => String(val).padStart(len, ' ');

export const StepsSixView: React.FC<StepsSixViewProps> = ({ steps }) => {
  if (!steps || steps.length === 0) return null;

  // We will take up to the first 6 steps and render them in the requested format.
  const six = steps.slice(0, 6);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Delivery Steps (Formatted)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {six.map((step, idx) => (
          <div
            key={step.step}
            className="p-4 rounded-md border bg-background shadow-sm animate-fade-in-up"
            style={{ animationDelay: `${idx * 120}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">STEP {String(step.step).padStart(2, '0')}</h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Package className="w-4 h-4" />{pad(step.packagesRemaining, 2)} pkgs</span>
                <span className="flex items-center gap-1"><Truck className="w-4 h-4" />{pad(step.vehiclesAvailable, 2)} veh</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{step.currentTime.toFixed(2)} hrs</span>
              </div>
            </div>

            {/* Monospaced formatted block as per example */}
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed bg-muted/40 p-4 rounded-md">
{step.description}
            </pre>

            {/* Vehicle assignments quick chips */}
            {step.vehicleAssignments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {step.vehicleAssignments.map(v => (
                  <Badge key={v.vehicleId} variant="outline">
                    Vehicle {pad(v.vehicleId, 2)} • {v.packages.map(p => p.id).join(' + ')} • {v.totalWeight}kg
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
