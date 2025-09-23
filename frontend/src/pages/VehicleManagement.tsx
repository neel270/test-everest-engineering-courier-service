import React from 'react';
import { VehicleList } from '@/components/VehicleList';

export const VehicleManagement: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-delivery-orange-light/10 to-courier-blue-light/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-delivery-orange to-courier-blue bg-clip-text text-transparent mb-4">
            Vehicle Management
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage your delivery vehicles with comprehensive CRUD operations. Add, edit, delete, and organize your vehicle fleet efficiently.
          </p>
        </div>

        {/* Vehicle List */}
        <VehicleList />
      </div>
    </div>
  );
};