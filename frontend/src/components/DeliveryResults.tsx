import React from 'react';
import { Card } from '@/components/ui/card';
import { Package, Clock } from 'lucide-react';
import packages from '@/assets/packages.png';
import { DeliveryService } from '@/lib/delivery-service';

interface DeliveryResult {
  id: string;
  discount: number;
  totalCost: number;
  originalCost: number;
  estimatedDeliveryTime: number;
}

interface DeliveryResultsProps {
  results: DeliveryResult[];
}

export const DeliveryResults: React.FC<DeliveryResultsProps> = ({ results }) => {
  return (
    <Card className="delivery-card">
      <div className="flex items-center gap-3 mb-6">
        <img src={packages} alt="Packages" className="w-8 h-8" />
        <h2 className="text-2xl font-semibold">Cost Breakdown</h2>
      </div>

      {results.length > 0 ? (
        <div className="space-y-4">
          {results.map((result) => (
            <div key={result.id} className="animate-cost-calculate p-4 border border-border rounded-lg bg-gradient-to-r from-card to-delivery-orange-light/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{result.id}</h3>
                <div className="text-right">
                  <div className="cost-display">₹{result.totalCost}</div>
                  {result.discount > 0 && (
                    <div className="text-sm text-success font-medium">
                      Saved ₹{result.discount}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {DeliveryService.formatTime(result.estimatedDeliveryTime)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Original Cost:</span>
                  <span>₹{result.originalCost}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span className="text-success">-₹{result.discount}</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Final Cost:</span>
                  <span>₹{result.totalCost}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Est. Delivery Time:</span>
                  <span>{DeliveryService.formatTime(result.estimatedDeliveryTime)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Click "Calculate Delivery Costs" to see results</p>
        </div>
      )}
    </Card>
  );
};
