import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface LocationItem {
  id: string;
  name: string;
}

export interface AuthState {
  user: AuthUser | null;
  tenantId: string | null;
  role: string | null;
  locationId: string | null;
  locations: LocationItem[];
  needsLocationSelection: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  tenantId: null,
  role: null,
  locationId: null,
  locations: [],
  needsLocationSelection: false,
  isAuthenticated: false,
  isInitialized: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: AuthUser;
        tenantId?: string | null;
        role?: string | null;
        locationId?: string | null;
        locations?: LocationItem[];
        needsLocationSelection?: boolean;
      }>
    ) => {
      state.user = action.payload.user;
      if (action.payload.tenantId !== undefined) {
        state.tenantId = action.payload.tenantId;
      }
      if (action.payload.role !== undefined) {
        state.role = action.payload.role;
      }
      if (action.payload.locationId !== undefined) {
        state.locationId = action.payload.locationId;
      }
      if (action.payload.locations !== undefined) {
        state.locations = action.payload.locations;
      }
      if (action.payload.needsLocationSelection !== undefined) {
        state.needsLocationSelection = action.payload.needsLocationSelection;
      }
      state.isAuthenticated = true;
      state.isInitialized = true;
    },
    setSelectedLocation: (state, action: PayloadAction<string>) => {
      state.locationId = action.payload;
      state.needsLocationSelection = false;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    logOut: (state) => {
      state.user = null;
      state.tenantId = null;
      state.role = null;
      state.locationId = null;
      state.locations = [];
      state.needsLocationSelection = false;
      state.isAuthenticated = false;
      state.isInitialized = true;
    },
  },
});

export const { setCredentials, setSelectedLocation, setInitialized, logOut } =
  authSlice.actions;

export default authSlice.reducer;

//stores authenticated user, tenantId, role, locationId, and needsLocationSelection