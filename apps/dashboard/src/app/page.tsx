"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Radio,
  TrendingUp,
  Clock,
  MessageSquare,
  Eye,
  Activity,
  Zap,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { RoomCard } from "@/components/rooms/room-card";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { Progress } from "@/components/ui/progress";
import { useDashboardStore } from "@/store/dashboard-store";
import { cn, formatNumber } from "@/lib/utils";

export default function DashboardPage() {
  const {
    sidebarOpen,
    rooms,
    analytics,
    stats,
    viewerTimeSeries,
    viewersByCountry,
    viewersByDevice,
  } = useDashboardStore();

  // Simulate real-time updates
  const [liveViewers, setLiveViewers] = useState(stats.totalViewers);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveViewers((prev) => {
        const change = Math.floor(Math.random() * 100) - 50;
        return Math.max(0, prev + change);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Format time series data for charts
  const chartData = viewerTimeSeries.map((d) => ({
    time: new Date(d.time).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    viewers: d.viewers,
    engagement: d.engagement,
  }));

  const countryChartData = viewersByCountry.slice(0, 5).map((c) => ({
    country: c.code,
    viewers: c.viewers,
  }));

  const deviceChartData = viewersByDevice.map((d) => ({
    name: d.device,
    value: d.count,
  }));

  const liveRooms = rooms.filter((r) => r.status === "live");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main
        className={cn(
          "transition-all duration-300",
          sidebarOpen ? "ml-64" : "ml-16"
        )}
      >
        <Header
          title="Dashboard Overview"
          subtitle="Monitor your live shows and viewer analytics"
        />

        <div className="p-6 space-y-6">
          {/* Top Stats Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Live Viewers"
              value={formatNumber(liveViewers)}
              change={12.5}
              icon={Users}
              iconColor="text-primary"
            />
            <StatCard
              title="Active Rooms"
              value={stats.liveRooms}
              change={8.2}
              icon={Radio}
              iconColor="text-success"
            />
            <StatCard
              title="Avg. Engagement"
              value={`${stats.avgEngagement}%`}
              change={-2.4}
              icon={TrendingUp}
              iconColor="text-warning"
            />
            <StatCard
              title="Server Load"
              value={`${stats.serverLoad}%`}
              icon={Activity}
              iconColor="text-muted-foreground"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Viewer Trends Chart - Takes 2 columns */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Viewer Trends</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Last 24 hours viewer activity
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Viewers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-success" />
                    <span className="text-muted-foreground">Engagement</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <AreaChart
                  data={chartData}
                  xKey="time"
                  yKey="viewers"
                  yKey2="engagement"
                  height={300}
                />
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <p className="text-sm text-muted-foreground">Today's summary</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Views</span>
                    <span className="font-medium">
                      {formatNumber(analytics.totalViews)}
                    </span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Unique Viewers</span>
                    <span className="font-medium">
                      {formatNumber(analytics.uniqueViewers)}
                    </span>
                  </div>
                  <Progress value={62} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Chat Messages</span>
                    <span className="font-medium">
                      {formatNumber(analytics.chatMessagesTotal)}
                    </span>
                  </div>
                  <Progress value={48} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Peak Concurrent</span>
                    <span className="font-medium">
                      {formatNumber(analytics.peakConcurrentViewers)}
                    </span>
                  </div>
                  <Progress value={89} className="h-2" />
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{analytics.totalShowsToday}</p>
                      <p className="text-xs text-muted-foreground">Shows Today</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{analytics.totalShowsThisWeek}</p>
                      <p className="text-xs text-muted-foreground">This Week</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Rooms Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Live Rooms</h2>
                <Badge variant="live" className="gap-1">
                  <Radio className="h-3 w-3" />
                  {liveRooms.length} Live
                </Badge>
              </div>
              <a
                href="/rooms"
                className="text-sm text-primary hover:underline"
              >
                View all rooms
              </a>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {liveRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </div>

          {/* Bottom Analytics Row */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Viewers by Country */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Countries</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={countryChartData}
                  xKey="country"
                  yKey="viewers"
                  height={200}
                />
                <div className="mt-4 space-y-2">
                  {viewersByCountry.slice(0, 4).map((c) => (
                    <div
                      key={c.code}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">{c.country}</span>
                      <span className="font-medium">{c.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Viewers by Device */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Device Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <DonutChart data={deviceChartData} height={200} />
                </div>
                <div className="mt-4 space-y-2">
                  {viewersByDevice.map((d) => (
                    <div
                      key={d.device}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-3 w-3 rounded-full",
                            d.device === "Desktop" && "bg-primary",
                            d.device === "Mobile" && "bg-success",
                            d.device === "Tablet" && "bg-warning"
                          )}
                        />
                        <span className="text-muted-foreground">{d.device}</span>
                      </div>
                      <span className="font-medium">{d.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      icon: Radio,
                      text: "Tech Talk Live started",
                      time: "2m ago",
                      color: "text-success",
                    },
                    {
                      icon: Users,
                      text: "1,000 viewers milestone",
                      time: "15m ago",
                      color: "text-primary",
                    },
                    {
                      icon: MessageSquare,
                      text: "Chat spike detected",
                      time: "32m ago",
                      color: "text-warning",
                    },
                    {
                      icon: Zap,
                      text: "Guest joined Gaming Stream",
                      time: "45m ago",
                      color: "text-primary",
                    },
                    {
                      icon: Eye,
                      text: "Peak viewers: 3,102",
                      time: "1h ago",
                      color: "text-success",
                    },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-muted",
                          activity.color
                        )}
                      >
                        <activity.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.text}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
