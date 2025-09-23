import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Package, Percent } from 'lucide-react';
import { type PackageData } from '@/lib/delivery-service';

interface PackageListProps {
  packageList: PackageData[];
  onAddPackage: () => void;
  onUpdatePackage: (index: number, field: keyof PackageData, value: string | number) => void;
  onRemovePackage: (index: number) => void;
  validateOfferCode: (pkg: PackageData) => boolean;
}

export const PackageList: React.FC<PackageListProps> = ({
  packageList,
  onAddPackage,
  onUpdatePackage,
  onRemovePackage,
  validateOfferCode
}) => {
  return (
    <Card className="delivery-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-semibold">Package Details</h2>
        </div>
        <Button 
          onClick={onAddPackage}
          variant="outline"
          size="sm"
          className="hover:bg-delivery-orange hover:text-white transition-colors"
        >
          Add Package
        </Button>
      </div>

      <div className="space-y-6">
        {packageList.map((pkg, index) => (
          <div key={index} className="animate-package-slide p-4 border border-border rounded-lg bg-card/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{pkg.id}</h3>
              {packageList.length > 1 && (
                <Button
                  onClick={() => onRemovePackage(index)}
                  variant="destructive"
                  size="sm"
                >
                  Remove
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Weight (kg)</Label>
                <Input
                  type="number"
                  value={pkg.weight}
                  onChange={(e) => onUpdatePackage(index, 'weight', Number(e.target.value))}
                  className="package-input mt-1"
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium">Distance (km)</Label>
                <Input
                  type="number"
                  value={pkg.distance}
                  onChange={(e) => onUpdatePackage(index, 'distance', Number(e.target.value))}
                  className="package-input mt-1"
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium">Offer Code</Label>
                <Input
                  type="text"
                  value={pkg.offerCode}
                  onChange={(e) => onUpdatePackage(index, 'offerCode', e.target.value.toUpperCase())}
                  className="package-input mt-1"
                  placeholder="OFR001"
                />
              </div>
            </div>

            {pkg.offerCode && (
              <div className="mt-3 flex items-center gap-2">
                <Percent className="w-4 h-4 text-success" />
                <Badge 
                  variant={validateOfferCode(pkg) ? "default" : "destructive"}
                  className={validateOfferCode(pkg) ? "animate-offer-glow" : ""}
                >
                  {validateOfferCode(pkg) ? 'Valid Offer' : 'Invalid Offer'}
                </Badge>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
