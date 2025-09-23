import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Truck, Package, Clock, MapPin } from 'lucide-react';
import { DeliveryService, type OptimizationStep } from '@/lib/delivery-service';

interface DeliveryTimelineProps {
  steps: OptimizationStep[];
}

export const DeliveryTimeline: React.FC<DeliveryTimelineProps> = ({ steps }) => {
  if (steps.length === 0) {
    return null;
  }

  const totalTime = Math.max(...steps.map(step => step.currentTime));
  const totalPackages = steps.reduce((total, step) =>
    total + step.vehicleAssignments.reduce((stepTotal, assignment) =>
      stepTotal + assignment.packages.length, 0), 0);

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
              <div className="text-2xl font-bold text-primary">{steps.length}</div>
              <div className="text-sm text-muted-foreground">Steps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{DeliveryService.formatTime(totalTime)}</div>
              <div className="text-sm text-muted-foreground">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalPackages}</div>
              <div className="text-sm text-muted-foreground">Packages</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-8">
              {steps.map((step, index) => {
                const progress = (step.currentTime / totalTime) * 100;
                const isLast = index === steps.length - 1;

                return (
                  <div key={step.step} className="relative flex items-start gap-4">
                    {/* Timeline Node */}
                    <div className={`relative z-10 w-16 h-16 rounded-full border-4 flex items-center justify-center ${
                      step.vehicleAssignments.length > 0
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-muted border-muted-foreground'
                    }`}>
                      {step.vehicleAssignments.length > 0 ? (
                        <Truck className="w-6 h-6" />
                      ) : (
                        <Clock className="w-6 h-6" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">Step {step.step}</h3>
                        <Badge variant="outline">
                          {DeliveryService.formatTime(step.currentTime)}
                        </Badge>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            <span>{step.packagesRemaining} packages remaining</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            <span>{step.vehiclesAvailable} vehicles available</span>
                          </div>
                        </div>

                        {step.vehicleAssignments.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Active Deliveries:</h4>
                            {step.vehicleAssignments.map((assignment) => (
                              <div key={assignment.vehicleId} className="bg-background p-3 rounded border">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge>{assignment.name ?? `Vehicle ${assignment.vehicleId}`}</Badge>
                                  <span className="text-sm font-medium">
                                    {assignment.totalWeight}kg
                                  </span>
                                </div>

                                <div className="text-sm space-y-1">
                                  <div>Packages: {assignment.packages.map(pkg => pkg.id).join(', ')}</div>
                                  <div>Distance: {assignment.maxDistance}km</div>
                                  <div>Delivery: {DeliveryService.formatTime(assignment.deliveryTime)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {step.unassignedPackages.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            <strong>Unassigned:</strong> {step.unassignedPackages.map(pkg => pkg.id).join(', ')}
                          </div>
                        )}
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
              <span>{Math.round((totalPackages - steps[steps.length - 1]?.packagesRemaining || 0) / totalPackages * 100)}%</span>
            </div>
            <Progress value={(totalPackages - (steps[steps.length - 1]?.packagesRemaining || 0)) / totalPackages * 100} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};