import axiosInstance from "../../../DynamicAPI/AxiosInstance";

export type IntegrateMetaGitResponse = {
  status?: string;
  message?: string;
  data?: unknown;
};

export const integrateService = {
  /** POST /do-suggestion/{id}/integrate/git */
  integrateToMetaGit: async (
    doSuggestionId: string,
  ): Promise<IntegrateMetaGitResponse> => {
    const response = await axiosInstance.post<IntegrateMetaGitResponse>(
      `do-suggestion/${doSuggestionId}/integrate/git`,
    );
    return response.data;
  },

  integrateAllToMetaGit: async (
    doSuggestionIds: string[],
  ): Promise<
    {
      id: string;
      ok: boolean;
      data?: IntegrateMetaGitResponse;
      error?: string;
    }[]
  > => {
    const results = await Promise.all(
      doSuggestionIds.map(async (id) => {
        try {
          const data = await integrateService.integrateToMetaGit(id);
          return { id, ok: true as const, data };
        } catch (error: unknown) {
          const message =
            (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ||
            (error as Error)?.message ||
            "Gagal integrasi";
          return { id, ok: false as const, error: message };
        }
      }),
    );
    return results;
  },
};
