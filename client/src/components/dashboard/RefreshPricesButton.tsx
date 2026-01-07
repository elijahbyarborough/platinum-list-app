import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { api } from '@/utils/api';

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

  return (
    <Button
      onClick={handleRefresh}
      disabled={refreshing || refreshMutation.isPending}
      variant="outline"
    >
      {refreshing || refreshMutation.isPending ? 'Refreshing...' : 'Refresh Prices'}
    </Button>
  );
}

