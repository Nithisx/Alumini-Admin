import { configureStore } from "@reduxjs/toolkit";
import auditReducer from "./auditSlice";
import loginRequestReducer from "./loginRequestSlice";
import permissionsReducer from "./permissionsSlice";

export const store = configureStore({
  reducer: {
    audit: auditReducer,
    loginRequests: loginRequestReducer,
    permissions: permissionsReducer,
  },
});
