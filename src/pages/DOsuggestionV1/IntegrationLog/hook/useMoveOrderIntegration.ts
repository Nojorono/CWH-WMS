import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { MoveOrderIntegrationParams } from "../../../../API/types/DOsuggestionIntegration";
import { getMoveOrderIntegration } from "../../../../API/services/DOsuggestionServices/integrationMetaService";

export const useMoveOrderIntegration = (params: MoveOrderIntegrationParams) => {
  return useQuery({
    queryKey: ["move-order-integration", params],
    queryFn: ({ signal }) => getMoveOrderIntegration(params, signal),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
};
