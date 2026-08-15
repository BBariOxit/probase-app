'use client';

import { create } from 'zustand';

const STORAGE_KEY = 'probase.sidebar.collapsed';

function readCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY) === '1';
}

interface SidebarState {
  /** Desktop: icons only. Persisted, because it is a standing preference. */
  collapsed: boolean;
  /** Mobile: the drawer. Never persisted — it belongs to one interaction. */
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useSidebar = create<SidebarState>((set) => ({
  // Read when the store is created rather than from an effect. The shell only
  // renders once the session bootstrap has resolved, so there is no
  // server-rendered sidebar for this to disagree with — and therefore no
  // expand-then-collapse flicker on every page load.
  collapsed: readCollapsed(),
  mobileOpen: false,

  toggleCollapsed: () =>
    set((state) => {
      const collapsed = !state.collapsed;
      window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
      return { collapsed };
    }),

  setMobileOpen: (mobileOpen) => set({ mobileOpen }),
}));
