export interface Room {
  id: string;
  name: string;
  status: "live" | "waiting" | "ended";
  hostName: string;
  hostAvatar?: string;
  guestName?: string;
  guestAvatar?: string;
  viewerCount: number;
  peakViewers: number;
  startedAt?: Date;
  duration: number; // in seconds
  chatMessages: number;
  handRaises: number;
}

export interface Viewer {
  id: string;
  name: string;
  joinedAt: Date;
  watchTime: number; // in seconds
  country: string;
  device: "desktop" | "mobile" | "tablet";
  quality: "1080p" | "720p" | "480p" | "360p";
  connectionQuality: "excellent" | "good" | "fair" | "poor";
}

export interface AnalyticsData {
  totalViews: number;
  uniqueViewers: number;
  avgWatchTime: number;
  peakConcurrentViewers: number;
  totalShowsToday: number;
  totalShowsThisWeek: number;
  engagementRate: number;
  chatMessagesTotal: number;
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface ViewersByCountry {
  country: string;
  code: string;
  viewers: number;
  percentage: number;
}

export interface ViewersByDevice {
  device: string;
  count: number;
  percentage: number;
}

export interface TimeSeriesData {
  time: string;
  viewers: number;
  chatMessages?: number;
  engagement?: number;
}

export interface DashboardStats {
  liveRooms: number;
  totalViewers: number;
  avgEngagement: number;
  serverLoad: number;
}

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export type TimeRange = "1h" | "24h" | "7d" | "30d" | "all";
