import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

export type RoleSelectScope = 'all' | 'school';

// Custom hook to use roles for selection
export const useRoleSelectQuery = (scope: RoleSelectScope = 'all') => {
  const fetchRoleList = async () => {
    const qs = scope === 'school' ? '?scope=school' : '';
    const response = await apiFetch(
      `/api/sections/securite-configuration/acces/roles/select${qs}`,
    );

    if (!response.ok) {
      toast.error(
        'Something went wrong while loading the records. Please try again.',
        {
          position: 'top-center',
        },
      );
    }

    return response.json();
  };

  return useQuery({
    queryKey: ['user-role-select', scope],
    queryFn: fetchRoleList,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
};

/** Rôles IAM école uniquement (RH / conformité / collaborateurs). */
export const useSchoolRoleSelectQuery = () => useRoleSelectQuery('school');
