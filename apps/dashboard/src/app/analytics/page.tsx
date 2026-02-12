"use client";

import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { useDashboardStore } from "@/store/dashboard-store";
import { cn, formatNumber, formatDuration } from "@/lib/utils";

export default function AnalyticsPage() {
  const { sidebarOpen, analytics, viewerTimeSeries } = useDashboardStore();

  // Generate weekly data
  const weeklyData = [
    { day: "Mon", viewers: 12453, shows: 18, engagement: 72 },
    { day: "Tue", viewers: 15234, shows: 22, engagement: 68 },
    { day: "Wed", viewers: 18932, shows: 25, engagement: 75 },
    { day: "Thu", viewers: 14521, shows: 20, engagement: 71 },
    { day: "Fri", viewers: 21892, shows: 28, engagement: 78 },
    { day: "Sat", viewers: 28456, shows: 35, engagement: 82 },
    { day: "Sun", viewers: 24123, shows: 30, engagement: 79 },
  ];

  const hourlyEngagement = viewerTimeSeries.map((d) => ({
    time: new Date(d.time).toLocaleTimeString("en-US", {
      hour: "2-digit",
    }),
    engagement: d.engagement || 0,
    chatMessages: d.chatMessages || 0,
  }));

  const contentPerformance = [
    { category: "Tech Talks", views: 45623, avgDuration: 2847 },
    { category: "Gaming", views: 38921, avgDuration: 3421 },
    { category: "Music", views: 28456, avgDuration: 1987 },
    { category: "Education", views: 21345, avgDuration: 2156 },
    { category: "Lifestyle", views: 18234, avgDuration: 1654 },
  ];

  const peakHours = [
    { hour: "6 PM", viewers: 8934 },
    { hour: "7 PM", viewers: 7823 },
    { hour: "8 PM", viewers: 6543 },
    { hour: "9 PM", viewers: 5432 },
    { hour: "10 PM", viewers: 4321 },
  ];

  const retentionData = [
    { name: "0-1 min", value: 100 },
    { name: "1-5 min", value: 78 },
    { name: "5-15 min", value: 62 },
    { name: "15-30 min", value: 48 },
    { name: "30+ min", value: 35 },
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
          title="Analytics"
          subtitle="Comprehensive performance insights"
        />

        <div className="p-6 space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <Tabs defaultValue="overview" className="w-auto">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="engagement">Engagement</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Views"
              value={formatNumber(analytics.totalViews)}
              change={12.5}
              trend="up"
              description="vs last period"
            />
            <MetricCard
              title="Engagement Rate"
              value={`${analytics.engagementRate}%`}
              change={-2.4}
              trend="down"
              description="vs last period"
            />
            <MetricCard
              title="Avg. Session"
              value={formatDuration(analytics.avgWatchTime)}
              change={8.2}
              trend="up"
              description="vs last period"
            />
            <MetricCard
              title="Shows This Week"
              value={analytics.totalShowsThisWeek}
              change={15.3}
              trend="up"
              description="vs last week"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Weekly Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Performance</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Viewers and shows per day
                </p>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={weeklyData}
                  xKey="day"
                  yKey="viewers"
                  height={300}
                />
              </CardContent>
            </Card>

            {/* Engagement Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Trends</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Hourly engagement and chat activity
                </p>
              </CardHeader>
              <CardContent>
                <AreaChart
                  data={hourlyEngagement}
                  xKey="time"
                  yKey="engagement"
                  yKey2="chatMessages"
                  height={300}
                />
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Peak Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Peak Viewing Hours</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Best times to go live
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {peakHours.map((hour, i) => (
                    <div key={hour.hour} className="flex items-center gap-4">
                      <div className="w-16 text-sm font-medium">{hour.hour}</div>
                      <div className="flex-1">
                        <div
                          className="h-8 rounded bg-primary/80 flex items-center justify-end pr-3"
                          style={{
                            width: `${(hour.viewers / peakHours[0].viewers) * 100}%`,
                          }}
                        >
                          <span className="text-xs text-primary-foreground font-medium">
                            {formatNumber(hour.viewers)}
                          </span>
                        </div>
                      </div>
                      {i === 0 && (
                        <Badge variant="success" className="ml-2">
                          Peak
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Viewer Retention */}
            <Card>
              <CardHeader>
                <CardTitle>Viewer Retention</CardTitle>
                <p className="text-sm text-muted-foreground">
                  How long viewers stay
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {retentionData.map((item) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="font-medium">{item.value}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Content Categories</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Performance by category
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contentPerformance.map((item, i) => (
                    <div
                      key={item.category}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold",
                            i === 0 && "bg-primary text-primary-foreground",
                            i === 1 && "bg-primary/80 text-primary-foreground",
                            i === 2 && "bg-primary/60 text-primary-foreground",
                            i > 2 && "bg-muted text-muted-foreground"
                          )}
                        >
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.category}</p>
                          <p className="text-xs text-muted-foreground">
                            Avg. {formatDuration(item.avgDuration)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatNumber(item.views)}
                        </p>
                        <p className="text-xs text-muted-foreground">views</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Period Comparison</CardTitle>
              <p className="text-sm text-muted-foreground">
                This week vs last week performance
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <ComparisonStat
                  label="Total Views"
                  current={156789}
                  previous={139456}
                />
                <ComparisonStat
                  label="Unique Viewers"
                  current={45623}
                  previous={42156}
                />
                <ComparisonStat
                  label="Chat Messages"
                  current={89432}
                  previous={78934}
                />
                <ComparisonStat
                  label="Shows Hosted"
                  current={156}
                  previous={142}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  trend,
  description,
}: {
  title: string;
  value: string | number;
  change: number;
  trend: "up" | "down";
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend === "up" ? "text-success" : "text-destructive"
            )}
          >
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(change)}%
          </div>
        </div>
        <p className="mt-2 text-3xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function ComparisonStat({
  label,
  current,
  previous,
}: {
  label: string;
  current: number;
  previous: number;
}) {
  const change = ((current - previous) / previous) * 100;
  const isPositive = change > 0;

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{formatNumber(current)}</span>
        <span
          className={cn(
            "text-sm font-medium",
            isPositive ? "text-success" : "text-destructive"
          )}
        >
          {isPositive ? "+" : ""}
          {change.toFixed(1)}%
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        vs {formatNumber(previous)} last period
      </p>
    </div>
  );
}
