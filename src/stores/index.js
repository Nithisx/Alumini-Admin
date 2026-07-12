/**
 * stores — the single import surface for all application state.
 *
 *   import { useAuthStore, useNewsStore } from "../stores";
 *
 * Layout: one folder per domain (stores/<domain>/index.js), each a MobX class
 * store owning ALL of that domain's data + logic (API calls, websockets,
 * derived state). Components never fetch, never open sockets, never hold
 * business logic — they render store state and call store actions.
 *
 * Reactivity: a component that reads observable store state must either be
 * wrapped in `observer()` (mobx-react-lite) or read through a hook that bridges
 * to React state (see lib/usePermissions.js). Reading an observable from a plain
 * component does NOT subscribe it.
 */
import { createContext, createElement, useContext } from "react";
import { rootStore } from "./RootStore";

const StoreContext = createContext(rootStore);

// createElement rather than JSX: this is a .js file, and Vite only applies the
// JSX transform to .jsx. Keeping it JSX-free lets the barrel stay `index.js`.
export function StoreProvider({ children }) {
  return createElement(StoreContext.Provider, { value: rootStore }, children);
}

export function useStores() {
  return useContext(StoreContext);
}

// ── Per-domain hooks ────────────────────────────────────────────────────────
export const useConfigStore = () => useStores().config;
export const useAuthStore = () => useStores().auth;
export const usePermissionStore = () => useStores().permissions;
export const useNotificationStore = () => useStores().notifications;
export const useProfileStore = () => useStores().profile;
export const useDashboardStore = () => useStores().dashboard;

// Content domains
export const useNewsStore = () => useStores().news;
export const useEventsStore = () => useStores().events;
export const useAlbumsStore = () => useStores().albums;
export const useBusinessStore = () => useStores().business;
export const useJobsStore = () => useStores().jobs; // the feed ("posts") = jobs domain

export const useMembersStore = () => useStores().members;
export const useChatStore = () => useStores().chat;
export const useMapStore = () => useStores().map;
export const useRbacStore = () => useStores().rbac;
export const useBirthdayStore = () => useStores().birthday;

export const useAuditStore = () => useStores().audit;
export const useSignupRequestStore = () => useStores().signupRequests;

export { rootStore };
export default StoreContext;
