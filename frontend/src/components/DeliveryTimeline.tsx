import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Truck, Package, Clock, MapPin } from "lucide-react";
import { DeliveryService, type OptimizationStep } from "@/lib/delivery-service";
import { Step1Card } from "./Step1Card";
import { Step2Card } from "./Step2Card";
import { Step3Card } from "./Step3Card";
import { Step4Card } from "./Step4Card";
import { Step5Card } from "./Step5Card";
import { Step6Card } from "./Step6Card";
import { Step7Card } from "./Step7Card";

interface DeliveryTimelineProps {
  steps: OptimizationStep[];
}

export const DeliveryTimeline: React.FC<DeliveryTimelineProps> = ({
  steps,
}) => {
  if (steps.length === 0) {
    return null;
  }
console.log(steps,'steps')
  const totalTime = Math.max(...steps.map((step) => step.currentTime));
  const totalPackages = steps.reduce(
    (total, step) =>
      total +
      step.vehicleAssignments.reduce(
        (stepTotal, assignment) => stepTotal + assignment.packages.length,
        0
      ),
    0
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Delivery Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {steps.length}
              </div>
              <div className="text-sm text-muted-foreground">Steps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {DeliveryService.formatTime(totalTime)}
              </div>
              <div className="text-sm text-muted-foreground">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {totalPackages}
              </div>
              <div className="text-sm text-muted-foreground">Packages</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-8">
              {steps.map((step, index) => {
                return (
                  <div
                    key={step.step}
                    className="relative flex items-start gap-4"
                  >
                    {/* Timeline Node */}
                    {step.packagesRemaining !== 0 ? (
                      <div
                        className={`relative z-10 w-16 h-16 rounded-full border-4 flex items-center justify-center ${
                          step.vehicleAssignments.length > 0
                            ? "bg-primary border-primary text-primary-foreground"
                            : "bg-muted border-muted-foreground"
                        }`}
                      >
                        {step.vehicleAssignments.length > 0 ? (
                          <Truck className="w-6 h-6" />
                        ) : (
                          <Clock className="w-6 h-6" />
                        )}
                      </div>
                    ) : (
                      (index === 5 || index === 6) && (
                        <div
                          className={`relative z-10 w-16 h-16 rounded-full border-4 flex items-center justify-center ${"bg-primary border-primary text-primary-foreground"}`}
                        >
                          <Truck className="w-6 h-6" />
                        </div>
                      )
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {step.packagesRemaining !== 0 ? (
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">
                            Step {step.step}
                          </h3>
                        </div>
                      ) : (
                        (index === 5 || index === 6) && (
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">
                              Step {(index === 5 || index === 6) ? "Final" : step.step}
                            </h3>
                          </div>
                        )
                      )}

                      <div className="bg-muted/50  rounded-lg space-y-3">
                        {index === 0 && step.packagesRemaining !== 0 ? (
                          <Step1Card step={step} />
                        ) : null}
                        {index === 1 && step.packagesRemaining !== 0 ? (
                          <Step2Card step={step} />
                        ) : null}
                        {index === 2 && step.packagesRemaining !== 0 ? (
                          <Step3Card step={step} />
                        ) : null}
                        {index === 3 && step.packagesRemaining !== 0 ? (
                          <Step4Card step={step} />
                        ) : null}
                        {index === 4 && step.packagesRemaining !== 0 ? (
                          <Step5Card step={step} />
                        ) : null}
                        {index === 5 && step.packagesRemaining !== 0 ? (
                          <Step6Card step={step} />
                        ) : null}
                        {(index === 5 || index === 6) && step.packagesRemaining === 0 ? (
                          <Step7Card step={step} />
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>
                {Math.round(
                  ((totalPackages -
                    steps[steps.length - 1]?.packagesRemaining || 0) /
                    totalPackages) *
                    100
                )}
                %
              </span>
            </div>
            <Progress
              value={
                ((totalPackages -
                  (steps[steps.length - 1]?.packagesRemaining || 0)) /
                  totalPackages) *
                100
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
