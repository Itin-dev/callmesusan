import { useQuery } from '@tanstack/react-query'
import { getAccounts } from './accounts'

/** React Query hooks: screens read server data only through these. */
export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: getAccounts })
}
