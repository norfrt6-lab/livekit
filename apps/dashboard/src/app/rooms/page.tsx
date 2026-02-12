"use client";

import { useState } from "react";
import {
  Radio,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  Users,
  Clock,
  MessageSquare,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomCard } from "@/components/rooms/room-card";
import { useDashboardStore } from "@/store/dashboard-store";
import { cn, formatNumber, formatDuration } from "@/lib/utils";
import type { Room } from "@/types";

export default function RoomsPage() {
  const { sidebarOpen, rooms } = useDashboardStore();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "waiting" | "ended">("all");

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.hostName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || room.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const liveCount = rooms.filter((r) => r.status === "live").length;
  const waitingCount = rooms.filter((r) => r.status === "waiting").length;
  const endedCount = rooms.filter((r) => r.status === "ended").length;

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
          title="Live Rooms"
          subtitle="Manage and monitor all your show rooms"
        />

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card
              className={cn(
                "cursor-pointer transition-all",
                statusFilter === "all" && "ring-2 ring-primary"
              )}
              onClick={() => setStatusFilter("all")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">All Rooms</p>
                    <p className="text-2xl font-bold">{rooms.length}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Grid className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={cn(
                "cursor-pointer transition-all",
                statusFilter === "live" && "ring-2 ring-red-500"
              )}
              onClick={() => setStatusFilter("live")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Live Now</p>
                    <p className="text-2xl font-bold text-red-500">{liveCount}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Radio className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={cn(
                "cursor-pointer transition-all",
                statusFilter === "waiting" && "ring-2 ring-warning"
              )}
              onClick={() => setStatusFilter("waiting")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Waiting</p>
                    <p className="text-2xl font-bold text-warning">{waitingCount}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={cn(
                "cursor-pointer transition-all",
                statusFilter === "ended" && "ring-2 ring-muted-foreground"
              )}
              onClick={() => setStatusFilter("ended")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ended</p>
                    <p className="text-2xl font-bold">{endedCount}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Pause className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search rooms or hosts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-md border bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Room
              </Button>
            </div>
          </div>

          {/* Rooms Grid/List */}
          {viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredRooms.map((room) => (
                    <RoomListItem key={room.id} room={room} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {filteredRooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Radio className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No rooms found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "Create your first room to get started"}
              </p>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Room
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function RoomListItem({ room }: { room: Room }) {
  const statusColors = {
    live: "live",
    waiting: "warning",
    ended: "secondary",
  } as const;

  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
          {room.status === "live" ? (
            <Radio className="h-6 w-6 text-red-500" />
          ) : (
            <Radio className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{room.name}</h3>
            <Badge variant={statusColors[room.status]}>
              {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Hosted by {room.hostName}
            {room.guestName && ` with ${room.guestName}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-1 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{formatNumber(room.viewerCount)}</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span>{formatNumber(room.chatMessages)}</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{formatDuration(room.duration)}</span>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
