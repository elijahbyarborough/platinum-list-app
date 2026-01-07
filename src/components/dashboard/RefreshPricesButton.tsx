import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { api } from '@/utils/api';
import { cn } from '@/lib/utils';

export function RefreshPricesButton() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const refreshMutation = useMutation({
    mutationFn: api.refreshAllPrices,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setRefreshing(false);
    },
    onError: () => {
      setRefreshing(false);
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    refreshMutation.mutate();
  };

  const isLoading = refreshing || refreshMutation.isPending;

  return (
    <Button
      onClick={handleRefresh}
      disabled={isLoading}
      variant="outline"
      className="gap-2"
    >
      <svg 
        className={cn(
          "w-4 h-4 transition-transform",
          isLoading && "animate-spin"
        )} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
        />
      </svg>
      {isLoading ? 'Refreshing...' : 'Refresh Prices'}
    </Button>
  );
}
