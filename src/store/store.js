import { configureStore } from "@reduxjs/toolkit";
import auditReducer from "./auditSlice";
import loginRequestReducer from "./loginRequestSlice";

export const store = configureStore({
  reducer: {
    audit: auditReducer,
    loginRequests: loginRequestReducer,
  },
});
