/**
 * StoreContext — provides the RootStore to the React tree and exposes hooks.
 *
 *   <StoreProvider> … </StoreProvider>          // wrap the app (main.jsx)
 *   const { auth, chat } = useStores();          // any store
 *   const auth = useAuthStore();                 // one store
 *
 * Components that read observable store state must be wrapped in
 * `observer(...)` (from mobx-react-lite) to re-render on change.
 */
import React, { createContext, useContext } from "react";
import { rootStore } from "./RootStore";

const StoreContext = createContext(rootStore);

export function StoreProvider({ children }) {
  return <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>;
}

export function useStores() {
  return useContext(StoreContext);
}

export const useConfigStore = () => useStores().config;
export const useAuthStore = () => useStores().auth;
export const usePermissionStore = () => useStores().permissions;
export const useNotificationStore = () => useStores().notifications;
export const useAuditStore = () => useStores().audit;
export const useSignupRequestStore = () => useStores().signupRequests;

export default StoreContext;
