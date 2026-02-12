"use client";

import { Radio, Users, MessageSquare, Hand, Clock, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatNumber, formatDuration } from "@/lib/utils";
import type { Room } from "@/types";

interface RoomCardProps {
  room: Room;
  onSelect?: (room: Room) => void;
}

export function RoomCard({ room, onSelect }: RoomCardProps) {
  const statusColors = {
    live: "live",
    waiting: "warning",
    ended: "secondary",
  } as const;

  const statusLabels = {
    live: "Live",
    waiting: "Waiting",
    ended: "Ended",
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={() => onSelect?.(room)}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={room.hostAvatar} />
            <AvatarFallback>
              {room.hostName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold leading-tight">{room.name}</h3>
            <p className="text-sm text-muted-foreground">{room.hostName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusColors[room.status]}>
            {room.status === "live" && (
              <Radio className="mr-1 h-3 w-3" />
            )}
            {statusLabels[room.status]}
          </Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Guest Info */}
        {room.guestName && (
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <span>with</span>
            <Avatar className="h-6 w-6">
              <AvatarImage src={room.guestAvatar} />
              <AvatarFallback className="text-xs">
                {room.guestName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span>{room.guestName}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs">Viewers</span>
            </div>
            <span className="text-lg font-semibold">
              {formatNumber(room.viewerCount)}
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs">Peak</span>
            </div>
            <span className="text-lg font-semibold">
              {formatNumber(room.peakViewers)}
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-xs">Chat</span>
            </div>
            <span className="text-lg font-semibold">
              {formatNumber(room.chatMessages)}
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs">Duration</span>
            </div>
            <span className="text-lg font-semibold">
              {formatDuration(room.duration)}
            </span>
          </div>
        </div>

        {/* Hand Raises Indicator */}
        {room.status === "live" && room.handRaises > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-warning/10 px-3 py-2 text-sm">
            <Hand className="h-4 w-4 text-warning" />
            <span>
              <strong>{room.handRaises}</strong> hand{room.handRaises !== 1 ? "s" : ""} raised
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
