/**
 * permissionsSlice — the caller's effective RBAC permission set (Redux).
 *
 * Permissions are fetched from GET /api/v1/me/permissions/ after login (they
 * are NOT embedded in the JWT, since Admin edits the matrix at runtime). The
 * set is cached in localStorage so the UI can gate immediately on reload /
 * offline. Gate UI with the `selectHasPerm` selector or the <Can> component.
 */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_BASE } from "../config/api";
import { authHeader, getRole } from "../lib/authToken";

const LS_KEY = "app:permissions";

function loadCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(LS_KEY) || "null");
    if (cached?.permissions) {
      return { permissions: cached.permissions, role: cached.role || getRole(), loaded: true };
    }
  } catch { /* ignore */ }
  return { permissions: [], role: getRole(), loaded: false };
}

function saveCache(permissions, role) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ permissions, role }));
  } catch { /* quota */ }
}

export const fetchPermissions = createAsyncThunk(
  "permissions/fetch",
  async (_arg, { rejectWithValue }) => {
    const header = authHeader();
    if (!header) return rejectWithValue("no-token");
    try {
      const res = await fetch(`${API_BASE}/me/permissions/`, {
        headers: { Authorization: header, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(res.statusText);
      const body = await res.json();
      const data = body?.data ?? body;
      return { permissions: data.permissions || [], role: data.role || getRole() };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = { ...loadCache(), loading: false };

const permissionsSlice = createSlice({
  name: "permissions",
  initialState,
  reducers: {
    // Seed directly from a login response (which already includes `permissions`),
    // avoiding a second round-trip.
    seedFromLogin(state, action) {
      const { permissions, role } = action.payload || {};
      if (Array.isArray(permissions)) {
        state.permissions = permissions;
        state.role = role || getRole();
        state.loaded = true;
        saveCache(state.permissions, state.role);
      }
    },
    clearPermissions(state) {
      state.permissions = [];
      state.role = null;
      state.loaded = false;
      localStorage.removeItem(LS_KEY);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPermissions.pending, (state) => { state.loading = true; })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.permissions = action.payload.permissions;
        state.role = action.payload.role;
        saveCache(state.permissions, state.role);
      })
      .addCase(fetchPermissions.rejected, (state) => { state.loading = false; });
  },
});

export const { seedFromLogin, clearPermissions } = permissionsSlice.actions;
export default permissionsSlice.reducer;

// ── Selectors ─────────────────────────────────────────────────────────────
export const selectPermissions = (state) => state.permissions.permissions;
export const selectRole = (state) => state.permissions.role;
export const selectHasPerm = (codename) => (state) =>
  state.permissions.permissions.includes(codename);
export const selectHasAny = (codenames = []) => (state) =>
  codenames.some((c) => state.permissions.permissions.includes(c));
export const selectHasAll = (codenames = []) => (state) =>
  codenames.every((c) => state.permissions.permissions.includes(c));
