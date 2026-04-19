import { create } from "zustand";

export type AppId =
  | "gmail"
  | "nexaai"
  | "sirh"
  | "workable"
  | "teams"
  | "calendar"
  | "securex"
  | "folders"
  | "doc-bible"
  | "doc-cas008";

export type WindowState = {
  id: AppId;
  title: string;
  icon: string;
  open: boolean;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
  x: number;
  y: number;
  w: number;
  h: number;
  prev?: { x: number; y: number; w: number; h: number };
  context?: Record<string, any>;
};

type State = {
  windows: Record<AppId, WindowState>;
  zCounter: number;
  startMenuOpen: boolean;
  notifOpen: boolean;
  selectedDesktopIcon: AppId | null;
  // NexaAI conversation state
  nexaActiveConv: string | null;
  nexaPrefill: string | null;
  nexaContext: string | null;
  // Gmail
  gmailSelectedEmail: string | null;
};

type Actions = {
  openWindow: (id: AppId, opts?: Partial<WindowState> & { context?: any }) => void;
  closeWindow: (id: AppId) => void;
  minimizeWindow: (id: AppId) => void;
  toggleMaximize: (id: AppId) => void;
  focusWindow: (id: AppId) => void;
  moveWindow: (id: AppId, x: number, y: number) => void;
  resizeWindow: (id: AppId, w: number, h: number) => void;
  setStartMenu: (v: boolean) => void;
  setNotif: (v: boolean) => void;
  setSelectedDesktopIcon: (id: AppId | null) => void;
  setNexaActiveConv: (id: string | null) => void;
  setNexaPrefill: (v: string | null, ctx?: string | null) => void;
  setGmailEmail: (id: string | null) => void;
};

const defaultWindow = (id: AppId, title: string, icon: string, x: number, y: number, w: number, h: number): WindowState => ({
  id, title, icon, open: false, minimized: false, maximized: false,
  zIndex: 1, x, y, w, h,
});

const initial: Record<AppId, WindowState> = {
  gmail: defaultWindow("gmail", "Inbox — chro@demo.local", "📧", 120, 60, 1100, 680),
  nexaai: defaultWindow("nexaai", "✦ NexaAI — People Assistant", "✦", 200, 110, 1080, 680),
  sirh: defaultWindow("sirh", "SIRH NexaFlow", "📊", 240, 140, 1000, 620),
  workable: defaultWindow("workable", "ATS — Recruitment", "🎯", 180, 100, 1040, 640),
  teams: defaultWindow("teams", "Teams — Demo Company", "📞", 260, 140, 960, 600),
  calendar: defaultWindow("calendar", "Calendar — Apr 19, 2026", "📅", 220, 120, 980, 600),
  securex: defaultWindow("securex", "Payroll Portal", "🔒", 280, 150, 920, 580),
  folders: defaultWindow("folders", "HR Folders", "📁", 200, 120, 900, 560),
  "doc-bible": defaultWindow("doc-bible", "Company_Bible_500.docx — Word", "📄", 220, 130, 900, 600),
  "doc-cas008": defaultWindow("doc-cas008", "CAS-008_GDPR_URGENT.docx — Word", "🗂️", 240, 100, 920, 620),
};

export const useDesktop = create<State & Actions>((set, get) => ({
  windows: initial,
  zCounter: 10,
  startMenuOpen: false,
  notifOpen: false,
  selectedDesktopIcon: null,
  nexaActiveConv: null,
  nexaPrefill: null,
  nexaContext: null,
  gmailSelectedEmail: "isabelle",

  openWindow: (id, opts = {}) => {
    const z = get().zCounter + 1;
    set((s) => ({
      zCounter: z,
      windows: {
        ...s.windows,
        [id]: {
          ...s.windows[id],
          ...opts,
          open: true,
          minimized: false,
          zIndex: z,
          context: opts.context ?? s.windows[id].context,
        },
      },
    }));
  },
  closeWindow: (id) =>
    set((s) => ({ windows: { ...s.windows, [id]: { ...s.windows[id], open: false, minimized: false } } })),
  minimizeWindow: (id) =>
    set((s) => ({ windows: { ...s.windows, [id]: { ...s.windows[id], minimized: true } } })),
  toggleMaximize: (id) =>
    set((s) => {
      const w = s.windows[id];
      if (w.maximized) {
        return {
          windows: {
            ...s.windows,
            [id]: { ...w, maximized: false, ...(w.prev ?? { x: w.x, y: w.y, w: w.w, h: w.h }) },
          },
        };
      }
      return {
        windows: {
          ...s.windows,
          [id]: { ...w, maximized: true, prev: { x: w.x, y: w.y, w: w.w, h: w.h } },
        },
      };
    }),
  focusWindow: (id) => {
    const z = get().zCounter + 1;
    set((s) => ({
      zCounter: z,
      windows: { ...s.windows, [id]: { ...s.windows[id], zIndex: z, minimized: false } },
    }));
  },
  moveWindow: (id, x, y) =>
    set((s) => ({ windows: { ...s.windows, [id]: { ...s.windows[id], x, y } } })),
  resizeWindow: (id, w, h) =>
    set((s) => ({ windows: { ...s.windows, [id]: { ...s.windows[id], w, h } } })),
  setStartMenu: (v) => set({ startMenuOpen: v, notifOpen: false }),
  setNotif: (v) => set({ notifOpen: v, startMenuOpen: false }),
  setSelectedDesktopIcon: (id) => set({ selectedDesktopIcon: id }),
  setNexaActiveConv: (id) => set({ nexaActiveConv: id }),
  setNexaPrefill: (v, ctx = null) => set({ nexaPrefill: v, nexaContext: ctx }),
  setGmailEmail: (id) => set({ gmailSelectedEmail: id }),
}));
