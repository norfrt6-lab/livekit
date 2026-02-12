"use client";

import { useState } from "react";
import {
  Users,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Signal,
  TrendingUp,
  Clock,
  Search,
  Download,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { useDashboardStore } from "@/store/dashboard-store";
import { cn, formatNumber, formatDuration } from "@/lib/utils";

export default function ViewersPage() {
  const {
    sidebarOpen,
    analytics,
    viewerTimeSeries,
    viewersByCountry,
    viewersByDevice,
  } = useDashboardStore();

  const chartData = viewerTimeSeries.map((d) => ({
    time: new Date(d.time).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    viewers: d.viewers,
  }));

  const qualityData = [
    { quality: "1080p", count: 12453, percentage: 27.3 },
    { quality: "720p", count: 18234, percentage: 40.0 },
    { quality: "480p", count: 11234, percentage: 24.6 },
    { quality: "360p", count: 3702, percentage: 8.1 },
  ];

  const connectionData = [
    { name: "Excellent", value: 45, color: "hsl(var(--success))" },
    { name: "Good", value: 35, color: "hsl(var(--primary))" },
    { name: "Fair", value: 15, color: "hsl(var(--warning))" },
    { name: "Poor", value: 5, color: "hsl(var(--destructive))" },
  ];

  // Mock active viewers list
  const activeViewers = [
    { id: "1", name: "John D.", country: "US", device: "Desktop", watchTime: 2456, quality: "1080p", connection: "Excellent" },
    { id: "2", name: "Sarah M.", country: "GB", device: "Mobile", watchTime: 1823, quality: "720p", connection: "Good" },
    { id: "3", name: "Alex K.", country: "DE", device: "Desktop", watchTime: 3421, quality: "1080p", connection: "Excellent" },
    { id: "4", name: "Maria L.", country: "FR", device: "Tablet", watchTime: 987, quality: "480p", connection: "Fair" },
    { id: "5", name: "James W.", country: "CA", device: "Mobile", watchTime: 2134, quality: "720p", connection: "Good" },
    { id: "6", name: "Emma S.", country: "AU", device: "Desktop", watchTime: 4532, quality: "1080p", connection: "Excellent" },
    { id: "7", name: "Lucas P.", country: "JP", device: "Mobile", watchTime: 1567, quality: "720p", connection: "Good" },
    { id: "8", name: "Olivia R.", country: "US", device: "Desktop", watchTime: 2890, quality: "1080p", connection: "Excellent" },
  ];

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
          title="Viewer Analytics"
          subtitle="Deep dive into your audience metrics"
        />

        <div className="p-6 space-y-6">
          {/* Top Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(analytics.totalViews)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unique Viewers</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(analytics.uniqueViewers)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Watch Time</p>
                    <p className="text-2xl font-bold">
                      {formatDuration(analytics.avgWatchTime)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Signal className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Peak Concurrent</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(analytics.peakConcurrentViewers)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Viewer Trends */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Viewer Activity</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Real-time viewer count over the last 24 hours
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <AreaChart data={chartData} xKey="time" yKey="viewers" height={300} />
            </CardContent>
          </Card>

          {/* Analytics Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Geographic Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {viewersByCountry.slice(0, 6).map((country, i) => (
                    <div key={country.code} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{getCountryFlag(country.code)}</span>
                          {country.country}
                        </span>
                        <span className="font-medium">{country.percentage}%</span>
                      </div>
                      <Progress value={country.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Device Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Device Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart
                  data={viewersByDevice.map((d) => ({
                    name: d.device,
                    value: d.count,
                  }))}
                  height={180}
                />
                <div className="mt-4 space-y-3">
                  {viewersByDevice.map((device) => (
                    <div
                      key={device.device}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {device.device === "Desktop" && (
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                        )}
                        {device.device === "Mobile" && (
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                        )}
                        {device.device === "Tablet" && (
                          <Tablet className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">{device.device}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">
                          {formatNumber(device.count)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({device.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Connection Quality */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Signal className="h-5 w-5" />
                  Connection Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart data={connectionData} height={180} />
                <div className="mt-4 space-y-3">
                  {connectionData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Viewers Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active Viewers</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Currently watching across all rooms
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search viewers..."
                  className="h-9 w-64 rounded-md border bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium">Viewer</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Country</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Device</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Watch Time</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Quality</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Connection</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeViewers.map((viewer) => (
                      <tr key={viewer.id} className="border-b last:border-0">
                        <td className="px-4 py-3 text-sm font-medium">{viewer.name}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="mr-2">{getCountryFlag(viewer.country)}</span>
                          {viewer.country}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant="secondary">{viewer.device}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">{formatDuration(viewer.watchTime)}</td>
                        <td className="px-4 py-3 text-sm">{viewer.quality}</td>
                        <td className="px-4 py-3 text-sm">
                          <Badge
                            variant={
                              viewer.connection === "Excellent"
                                ? "success"
                                : viewer.connection === "Good"
                                ? "default"
                                : viewer.connection === "Fair"
                                ? "warning"
                                : "destructive"
                            }
                          >
                            {viewer.connection}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function getCountryFlag(code: string): string {
  const flags: Record<string, string> = {
    US: "🇺🇸",
    GB: "🇬🇧",
    DE: "🇩🇪",
    CA: "🇨🇦",
    FR: "🇫🇷",
    JP: "🇯🇵",
    AU: "🇦🇺",
    OT: "🌍",
  };
  return flags[code] || "🌍";
}
