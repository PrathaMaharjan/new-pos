import {
  BaseQueryFn,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { logOut } from "../slices/authSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: "/",
  credentials: "include", // Ensures httpOnly cookies (access_token, refresh_token) are included
});

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // If a refresh is already in progress, wait for it before executing the new query
  if (isRefreshing && refreshPromise) {
    const refreshed = await refreshPromise;
    if (!refreshed) {
      // Refresh failed, exit early
      return {
        error: {
          status: 401,
          data: { message: "Session expired" },
        },
      };
    }
  }

  let result = await baseQuery(args, api, extraOptions);

  // If request failed with 401 and this is NOT already the login/refresh endpoint
  const url = typeof args === "string" ? args : args.url;
  const isAuthEndpoint =
    url.includes("/api/auth/login") ||
    url.includes("/api/auth/refresh") ||
    url.includes("/api/auth/logout");

  if (result.error && result.error.status === 401 && !isAuthEndpoint) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = (async () => {
        try {
          const refreshResult = await baseQuery(
            { url: "/api/auth/refresh", method: "POST" },
            api,
            extraOptions
          );

          if (refreshResult.data) {
            return true;
          } else {
            api.dispatch(logOut());
            return false;
          }
        } catch {
          api.dispatch(logOut());
          return false;
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      })();
    }

    const refreshed = await refreshPromise;
    if (refreshed) {
      // Retry the original query with the new access token cookie
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};
