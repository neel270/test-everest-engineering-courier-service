import React from 'react';
import { Card } from '@/components/ui/card';
import { Truck } from 'lucide-react';

export const CLIInstructions: React.FC = () => {
  return (
    <Card className="delivery-card">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Truck className="w-5 h-5 text-primary" />
        Command Line Interface
      </h3>
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>You can also use the command line interface:</p>
        <div className="bg-muted p-3 rounded-lg font-mono text-xs">
          <div>npm run build:cli</div>
          <div>npm run cli -- --help</div>
          <div>npm run cli &lt; input.txt</div>
        </div>
      </div>
    </Card>
  );
};
