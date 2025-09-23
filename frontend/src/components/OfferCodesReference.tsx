import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Percent } from 'lucide-react';
import { type OfferCriteria } from '@/lib/delivery-service';

interface OfferCodesReferenceProps {
  offers: OfferCriteria[];
}

export const OfferCodesReference: React.FC<OfferCodesReferenceProps> = ({ offers }) => {
  return (
    <Card className="delivery-card">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Percent className="w-5 h-5 text-success" />
        Available Offers
      </h3>
      <div className="space-y-3">
        {offers.map((offer) => (
          <div key={offer.code} className="p-3 border border-border rounded-lg bg-success/5">
            <div className="flex items-center justify-between mb-2">
              <Badge className="offer-badge">{offer.code}</Badge>
              <span className="font-semibold text-success">{offer.discount}% OFF</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Distance: {offer.minDistance}-{offer.maxDistance}km • 
              Weight: {offer.minWeight}-{offer.maxWeight}kg
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
