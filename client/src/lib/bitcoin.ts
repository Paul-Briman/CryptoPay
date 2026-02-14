
import { useQuery } from "@tanstack/react-query";

export interface BitcoinPrice {
  price: number;
  change: number;
}

export function useBitcoinPrice() {
  return useQuery<BitcoinPrice>({
    queryKey: ["/api/bitcoin/price"],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 25000, // Consider stale after 25 seconds
  });
}
