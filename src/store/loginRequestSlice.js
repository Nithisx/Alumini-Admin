import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_APPROVE_SIGNUP, API_APPROVE_SIGNUP_DETAIL } from "../config/api";

const API_URL = API_APPROVE_SIGNUP;
const EDIT_URL = (id) => API_APPROVE_SIGNUP_DETAIL(id);

// Auth is the httpOnly cookie; CSRF header is attached automatically by
// lib/axiosInstance.js's global fetch patch for unsafe methods.
function authHeaders() {
  return { "Content-Type": "application/json" };
}

export const fetchLoginRequests = createAsyncThunk(
  "loginRequests/fetch",
  async ({ silent = false } = {}, { rejectWithValue }) => {
    try {
      const res = await fetch(API_URL, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const results = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
      return { results, silent };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const approveRequest = createAsyncThunk(
  "loginRequests/approve",
  async (email, { rejectWithValue }) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return email;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const declineRequest = createAsyncThunk(
  "loginRequests/decline",
  async (email, { rejectWithValue }) => {
    try {
      const res = await fetch(API_URL, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return email;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const bulkApproveRequests = createAsyncThunk(
  "loginRequests/bulkApprove",
  async (requests, { rejectWithValue }) => {
    const results = { approved: [], failed: [] };
    for (const req of requests) {
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ email: req.email }),
        });
        if (res.ok) results.approved.push(req.email);
        else results.failed.push(req.email);
      } catch {
        results.failed.push(req.email);
      }
    }
    if (results.approved.length === 0 && results.failed.length > 0) {
      return rejectWithValue(`All ${results.failed.length} approvals failed.`);
    }
    return results;
  }
);

export const editRequest = createAsyncThunk(
  "loginRequests/edit",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await fetch(EDIT_URL(id), {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      return { id, updates: data.data || payload };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const loginRequestSlice = createSlice({
  name: "loginRequests",
  initialState: {
    requests: [],
    loading: false,
    error: null,
    processing: false,
    lastRefreshed: null,
  },
  reducers: {
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchLoginRequests.pending, (state, { meta }) => {
        if (!meta.arg?.silent) {
          state.loading = true;
          state.error = null;
        }
      })
      .addCase(fetchLoginRequests.fulfilled, (state, { payload }) => {
        state.loading = false;
        const incoming = payload.results;
        if (payload.silent && state.requests.length > 0) {
          // Silently add new requests and remove approved ones without full re-render
          const existingIds = new Set(state.requests.map((r) => r.id));
          const incomingIds = new Set(incoming.map((r) => r.id));
          // Add new entries at the top
          const newEntries = incoming.filter((r) => !existingIds.has(r.id));
          // Remove entries no longer pending
          const stillPending = state.requests.filter((r) => incomingIds.has(r.id));
          if (newEntries.length > 0 || stillPending.length !== state.requests.length) {
            state.requests = [...newEntries, ...stillPending];
          }
        } else {
          state.requests = incoming;
        }
        state.lastRefreshed = Date.now();
      })
      .addCase(fetchLoginRequests.rejected, (state, { payload, meta }) => {
        if (!meta.arg?.silent) {
          state.loading = false;
          state.error = payload ?? "Failed to load requests";
        }
      })
      // approve single
      .addCase(approveRequest.pending, (state) => { state.processing = true; })
      .addCase(approveRequest.fulfilled, (state, { payload: email }) => {
        state.processing = false;
        state.requests = state.requests.filter((r) => r.email !== email);
      })
      .addCase(approveRequest.rejected, (state, { payload }) => {
        state.processing = false;
        state.error = payload ?? "Failed to approve";
      })
      // decline single
      .addCase(declineRequest.pending, (state) => { state.processing = true; })
      .addCase(declineRequest.fulfilled, (state, { payload: email }) => {
        state.processing = false;
        state.requests = state.requests.filter((r) => r.email !== email);
      })
      .addCase(declineRequest.rejected, (state, { payload }) => {
        state.processing = false;
        state.error = payload ?? "Failed to decline";
      })
      // bulk approve
      .addCase(bulkApproveRequests.pending, (state) => { state.processing = true; })
      .addCase(bulkApproveRequests.fulfilled, (state, { payload }) => {
        state.processing = false;
        state.requests = state.requests.filter((r) => !payload.approved.includes(r.email));
      })
      .addCase(bulkApproveRequests.rejected, (state, { payload }) => {
        state.processing = false;
        state.error = payload ?? "Bulk approve failed";
      })
      // edit
      .addCase(editRequest.pending, (state) => { state.processing = true; })
      .addCase(editRequest.fulfilled, (state, { payload: { id, updates } }) => {
        state.processing = false;
        state.requests = state.requests.map((r) => r.id === id ? { ...r, ...updates } : r);
      })
      .addCase(editRequest.rejected, (state, { payload }) => {
        state.processing = false;
        state.error = payload ?? "Failed to update";
      });
  },
});

export const { clearError } = loginRequestSlice.actions;
export default loginRequestSlice.reducer;
