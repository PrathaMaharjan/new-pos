import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import {
  AuthUser,
  LocationItem,
  logOut,
  setCredentials,
  setInitialized,
} from "../slices/authSlice";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  locations: LocationItem[];
  needsLocationSelection: boolean;
  tenant?: { id: string; name: string; slug: string } | null;
  role?: string;
}

export interface MeResponse {
  user: AuthUser;
  tenantId: string;
  tenantSlug?: string | null;
  tenantName?: string | null;
  role: string;
  locationId: string | null;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User", "Session"],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/api/auth/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              user: data.user,
              tenantId: data.tenant?.id,
              role: data.role,
              locations: data.locations,
              needsLocationSelection: data.needsLocationSelection,
            })
          );
        } catch {
          // Handled by caller or error state
        }
      },
      invalidatesTags: ["Session"],
    }),

    logout: builder.mutation<{ loggedOut: boolean }, void>({
      query: () => ({
        url: "/api/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(logOut());
        }
      },
      invalidatesTags: ["Session"],
    }),

    getMe: builder.query<MeResponse, void>({
      query: () => "/api/auth/me",
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              user: data.user,
              tenantId: data.tenantId,
              role: data.role,
              locationId: data.locationId,
            })
          );
        } catch {
          dispatch(setInitialized(true));
        }
      },
      providesTags: ["User", "Session"],
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useGetMeQuery } = authApi;
