import { create } from "zustand";
import type {
  Room,
  AnalyticsData,
  DashboardStats,
  Notification,
  TimeRange,
  TimeSeriesData,
  ViewersByCountry,
  ViewersByDevice,
} from "@/types";

interface DashboardState {
  // UI State
  sidebarOpen: boolean;
  selectedTimeRange: TimeRange;
  darkMode: boolean;

  // Data
  rooms: Room[];
  analytics: AnalyticsData;
  stats: DashboardStats;
  notifications: Notification[];
  viewerTimeSeries: TimeSeriesData[];
  viewersByCountry: ViewersByCountry[];
  viewersByDevice: ViewersByDevice[];

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  toggleSidebar: () => void;
  setTimeRange: (range: TimeRange) => void;
  toggleDarkMode: () => void;
  setRooms: (rooms: Room[]) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  setAnalytics: (analytics: AnalyticsData) => void;
  setStats: (stats: DashboardStats) => void;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  setViewerTimeSeries: (data: TimeSeriesData[]) => void;
  setViewersByCountry: (data: ViewersByCountry[]) => void;
  setViewersByDevice: (data: ViewersByDevice[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Generate mock data for demo
const generateMockRooms = (): Room[] => [
  {
    id: "room-1",
    name: "Tech Talk Live",
    status: "live",
    hostName: "Sarah Chen",
    viewerCount: 2847,
    peakViewers: 3102,
    startedAt: new Date(Date.now() - 45 * 60 * 1000),
    duration: 2700,
    chatMessages: 1243,
    handRaises: 28,
  },
  {
    id: "room-2",
    name: "Gaming Stream",
    status: "live",
    hostName: "Mike Johnson",
    guestName: "Alex Rivera",
    viewerCount: 1523,
    peakViewers: 1890,
    startedAt: new Date(Date.now() - 90 * 60 * 1000),
    duration: 5400,
    chatMessages: 3421,
    handRaises: 67,
  },
  {
    id: "room-3",
    name: "Cooking Masterclass",
    status: "live",
    hostName: "Chef Maria",
    viewerCount: 892,
    peakViewers: 1100,
    startedAt: new Date(Date.now() - 30 * 60 * 1000),
    duration: 1800,
    chatMessages: 456,
    handRaises: 12,
  },
  {
    id: "room-4",
    name: "Music Session",
    status: "waiting",
    hostName: "David Kim",
    viewerCount: 0,
    peakViewers: 0,
    duration: 0,
    chatMessages: 0,
    handRaises: 0,
  },
  {
    id: "room-5",
    name: "Fitness Friday",
    status: "ended",
    hostName: "Lisa Thompson",
    viewerCount: 0,
    peakViewers: 2456,
    startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    duration: 3600,
    chatMessages: 1890,
    handRaises: 45,
  },
];

const generateMockAnalytics = (): AnalyticsData => ({
  totalViews: 156789,
  uniqueViewers: 45623,
  avgWatchTime: 1847,
  peakConcurrentViewers: 8934,
  totalShowsToday: 24,
  totalShowsThisWeek: 156,
  engagementRate: 67.8,
  chatMessagesTotal: 89432,
});

const generateMockStats = (): DashboardStats => ({
  liveRooms: 3,
  totalViewers: 5262,
  avgEngagement: 72.4,
  serverLoad: 34,
});

const generateMockTimeSeries = (): TimeSeriesData[] => {
  const data: TimeSeriesData[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.toISOString(),
      viewers: Math.floor(Math.random() * 5000) + 1000,
      chatMessages: Math.floor(Math.random() * 500) + 100,
      engagement: Math.floor(Math.random() * 30) + 50,
    });
  }
  return data;
};

const generateMockCountryData = (): ViewersByCountry[] => [
  { country: "United States", code: "US", viewers: 15234, percentage: 33.4 },
  { country: "United Kingdom", code: "GB", viewers: 8932, percentage: 19.6 },
  { country: "Germany", code: "DE", viewers: 5621, percentage: 12.3 },
  { country: "Canada", code: "CA", viewers: 4521, percentage: 9.9 },
  { country: "France", code: "FR", viewers: 3892, percentage: 8.5 },
  { country: "Japan", code: "JP", viewers: 2845, percentage: 6.2 },
  { country: "Australia", code: "AU", viewers: 2341, percentage: 5.1 },
  { country: "Others", code: "OT", viewers: 2237, percentage: 5.0 },
];

const generateMockDeviceData = (): ViewersByDevice[] => [
  { device: "Desktop", count: 23456, percentage: 51.4 },
  { device: "Mobile", count: 18234, percentage: 40.0 },
  { device: "Tablet", count: 3933, percentage: 8.6 },
];

export const useDashboardStore = create<DashboardState>((set) => ({
  // Initial UI State
  sidebarOpen: true,
  selectedTimeRange: "24h",
  darkMode: true,

  // Initial Data
  rooms: generateMockRooms(),
  analytics: generateMockAnalytics(),
  stats: generateMockStats(),
  notifications: [],
  viewerTimeSeries: generateMockTimeSeries(),
  viewersByCountry: generateMockCountryData(),
  viewersByDevice: generateMockDeviceData(),

  // Loading states
  isLoading: false,
  error: null,

  // Actions
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setTimeRange: (range) => set({ selectedTimeRange: range }),

  toggleDarkMode: () =>
    set((state) => ({ darkMode: !state.darkMode })),

  setRooms: (rooms) => set({ rooms }),

  updateRoom: (roomId, updates) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId ? { ...room, ...updates } : room
      ),
    })),

  setAnalytics: (analytics) => set({ analytics }),

  setStats: (stats) => set({ stats }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: `notif-${Date.now()}`,
          timestamp: new Date(),
          read: false,
        },
        ...state.notifications,
      ],
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  clearNotifications: () => set({ notifications: [] }),

  setViewerTimeSeries: (data) => set({ viewerTimeSeries: data }),

  setViewersByCountry: (data) => set({ viewersByCountry: data }),

  setViewersByDevice: (data) => set({ viewersByDevice: data }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}));
