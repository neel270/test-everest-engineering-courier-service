import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { deliveryApi } from "@/lib/api";
import { Package, Truck, Clock, DollarSign, Eye } from "lucide-react";
import { DeliveryService } from "@/lib/delivery-service";
import { DeliveryFilters } from "@/components/DeliveryFilters";
import { DeliveryCard } from "@/components/DeliveryCard";
import { Pagination } from "@/components/ui/pagination";
import {
  DeliveryResponse,
  DeliveryFilters as DeliveryFiltersType
} from "@/types/delivery";
import {
  PaginatedDeliveriesResponse,
  PaginationInfo
} from "@/types/api";

// Using types from the types directory instead of inline interfaces


const DeliveryList: React.FC = () => {
  const [filters, setFilters] = useState({
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    minCost: undefined as number | undefined,
    maxCost: undefined as number | undefined,
    vehicleId: undefined as string | undefined,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["deliveries", filters, currentPage, itemsPerPage],
    queryFn: async () => {
      // If no filters are applied, use the regular history endpoint
      if (!filters.startDate && !filters.endDate && !filters.minCost && !filters.maxCost && !filters.vehicleId) {
        const response = await deliveryApi.getDeliveryHistory({
          page: currentPage,
          limit: itemsPerPage
        });
        return response.data;
      }

      // Use the advanced filtering endpoint
      const response = await deliveryApi.getDeliveriesWithFilters({
        ...filters,
        page: currentPage,
        limit: itemsPerPage
      });
      return response.data;
    },
  });

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when applying filters
    refetch();
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: undefined,
      endDate: undefined,
      minCost: undefined,
      maxCost: undefined,
      vehicleId: undefined,
    });
    setCurrentPage(1); // Reset to first page when clearing filters
    refetch();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top when changing pages
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Deliveries</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="text-center">
                      <Skeleton className="h-6 w-8 mx-auto mb-1" />
                      <Skeleton className="h-3 w-12 mx-auto" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Deliveries</h1>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load deliveries. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const deliveries = (data as PaginatedDeliveriesResponse)?.data?.data?.items || [];
  const pagination = (data as PaginatedDeliveriesResponse)?.data?.data?.pagination;

  // Helper function to get total count from pagination
  const getTotalCount = () => {
    if (!pagination) return 0;
    return pagination.totalItems;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Deliveries</h1>
          <p className="text-muted-foreground">
            Manage and track your delivery operations
          </p>
          {pagination && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing {deliveries.length} of {getTotalCount()} deliveries
              {pagination.totalPages > 1 && ` (Page ${pagination.currentPage} of ${pagination.totalPages})`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button asChild>
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>

      {showFilters && (
        <DeliveryFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
        />
      )}

      {deliveries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No deliveries found</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven't created any deliveries yet. Start by creating a new delivery from the dashboard.
            </p>
            <Button asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deliveries.map((delivery: DeliveryResponse) => (
              <DeliveryCard key={delivery.id} delivery={delivery} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default DeliveryList;