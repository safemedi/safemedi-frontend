import { useMutation } from "@tanstack/react-query";

import { postLogout } from "@/api/endpoints/auth";
import { getHttpStatus } from "@/api/error";
import { queryKeys } from "@/api/query-keys";

export function useLogoutMutation() {
  return useMutation({
    mutationKey: queryKeys.auth.logout,
    mutationFn: postLogout,
    retry: (failureCount, error) => {
      const status = getHttpStatus(error);
      return failureCount < 1 && (status === undefined || status === 429 || status >= 500);
    },
  });
}
