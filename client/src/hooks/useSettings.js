import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useSettings() {
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/public/settings')).data.settings,
    staleTime: 5 * 60 * 1000,
  });
  return { settings: data };
}
