import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE = "https://api.karpagamalumni.in/api/v1";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("Token") : null;
}

function authHeaders() {
  return { Authorization: `Token ${getToken()}`, "Content-Type": "application/json" };
}

export const fetchAuditLogs = createAsyncThunk(
  "audit/fetchLogs",
  async ({ page = 1, filters = {} } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page });
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) {
          if (Array.isArray(v)) { if (v.length) params.set(k, v.join(",")); }
          else params.set(k, v);
        }
      });
      const res = await fetch(`${API_BASE}/audit-logs/?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchAuditFilters = createAsyncThunk(
  "audit/fetchFilters",
  async (usernameQ = "", { rejectWithValue }) => {
    try {
      const url = usernameQ
        ? `${API_BASE}/audit-logs/filters/?username_q=${encodeURIComponent(usernameQ)}`
        : `${API_BASE}/audit-logs/filters/`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchAuditDetail = createAsyncThunk(
  "audit/fetchDetail",
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/audit-logs/${id}/`, { headers: authHeaders() });
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const auditSlice = createSlice({
  name: "audit",
  initialState: {
    logs: [],
    count: 0,
    page: 1,
    loading: false,
    error: null,
    filterOptions: { status_codes: [], target_types: [], usernames: [], actions: [] },
    filtersLoading: false,
    selectedLog: null,
    detailLoading: false,
    lastRefreshed: null,
  },
  reducers: {
    setPage(state, action) { state.page = action.payload; },
    clearSelected(state) { state.selectedLog = null; },
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLogs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAuditLogs.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.logs = payload.results ?? [];
        state.count = payload.count ?? 0;
        state.lastRefreshed = Date.now();
      })
      .addCase(fetchAuditLogs.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload ?? "Failed to load audit logs";
      })
      .addCase(fetchAuditFilters.pending, (state) => { state.filtersLoading = true; })
      .addCase(fetchAuditFilters.fulfilled, (state, { payload }) => {
        state.filtersLoading = false;
        state.filterOptions = payload;
      })
      .addCase(fetchAuditFilters.rejected, (state) => { state.filtersLoading = false; })
      .addCase(fetchAuditDetail.pending, (state) => { state.detailLoading = true; })
      .addCase(fetchAuditDetail.fulfilled, (state, { payload }) => {
        state.detailLoading = false;
        state.selectedLog = payload;
      })
      .addCase(fetchAuditDetail.rejected, (state) => { state.detailLoading = false; });
  },
});

export const { setPage, clearSelected, clearError } = auditSlice.actions;
export default auditSlice.reducer;
