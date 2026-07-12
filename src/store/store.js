import { configureStore } from "@reduxjs/toolkit";
import permissionsReducer from "./permissionsSlice";

// Redux is being phased out in favor of MobX class stores (src/stores/).
// The audit + login-request slices are already migrated to AuditStore /
// SignupRequestStore; only the permissions slice remains here while its
// ~12 consumers (incl. the login critical path) are converted.
export const store = configureStore({
  reducer: {
    permissions: permissionsReducer,
  },
});
