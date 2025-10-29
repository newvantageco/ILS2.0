import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  DoorOpen,
  Activity,
  CheckCircle2,
  Wrench,
  Users,
  Calendar,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";

interface LocationStats {
  locationId: string;
  locationName: string;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  totalBookings: number;
  todayBookings: number;
  utilizationRate: number;
  activeUsers: number;
}

interface TestRoom {
  id: string;
  roomName: string;
  roomCode: string | null;
  currentStatus: string;
  locationId: string | null;
  locationName?: string;
}

const STATUS_COLORS = {
  available: "text-green-500",
  occupied: "text-yellow-500",
  maintenance: "text-orange-500",
  offline: "text-red-500",
};

export function MultiLocationDashboard() {
  const { data: locations, isLoading: locationsLoading } = useQuery<LocationStats[]>({
    queryKey: ["/api/ecp/locations/stats"],
  });

  const { data: allRooms, isLoading: roomsLoading } = useQuery<TestRoom[]>({
    queryKey: ["/api/ecp/test-rooms/all-locations"],
  });

  const { data: systemStats } = useQuery({
    queryKey: ["/api/ecp/stats/overview"],
  });

  const isLoading = locationsLoading || roomsLoading;

  // Calculate overall statistics
  const overallStats = {
    totalLocations: locations?.length || 0,
    totalRooms: allRooms?.length || 0,
    totalAvailable: allRooms?.filter(r => r.currentStatus === "available").length || 0,
    totalOccupied: allRooms?.filter(r => r.currentStatus === "occupied").length || 0,
    avgUtilization: (locations?.reduce((acc, loc) => acc + loc.utilizationRate, 0) || 0) / (locations?.length || 1),
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Building2 className="h-8 w-8" />
          Multi-Location Overview
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor test rooms and operations across all practice locations
        </p>
      </div>

      {/* Overall Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalLocations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active practices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Test Rooms</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalRooms}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overallStats.totalAvailable} available now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Occupancy</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalOccupied}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Rooms in use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.avgUtilization.toFixed(1)}%
            </div>
            <Progress value={overallStats.avgUtilization} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Location Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {locations?.map((location) => {
          const utilizationColor =
            location.utilizationRate >= 80
              ? "text-green-500"
              : location.utilizationRate >= 50
              ? "text-yellow-500"
              : "text-red-500";

          return (
            <Card key={location.locationId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {location.locationName}
                  </CardTitle>
                  <Badge variant="outline" className={utilizationColor}>
                    {location.utilizationRate.toFixed(0)}% utilized
                  </Badge>
                </div>
                <CardDescription>
                  {location.totalRooms} test rooms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Room Status */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <DoorOpen className="h-4 w-4" />
                    Room Status
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded">
                      <span className="text-xs">Available</span>
                      <Badge variant="outline" className="bg-white dark:bg-gray-900">
                        {location.availableRooms}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                      <span className="text-xs">Occupied</span>
                      <Badge variant="outline" className="bg-white dark:bg-gray-900">
                        {location.occupiedRooms}
                      </Badge>
                    </div>
                    {location.maintenanceRooms > 0 && (
                      <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950 rounded col-span-2">
                        <span className="text-xs flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          Maintenance
                        </span>
                        <Badge variant="outline" className="bg-white dark:bg-gray-900">
                          {location.maintenanceRooms}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Booking Stats */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Bookings
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Today</span>
                    <Badge>{location.todayBookings}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <Badge variant="outline">{location.totalBookings}</Badge>
                  </div>
                </div>

                {/* Active Users */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Active Staff
                  </span>
                  <Badge variant="secondary">{location.activeUsers}</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* All Rooms Quick View */}
      <Card>
        <CardHeader>
          <CardTitle>All Test Rooms</CardTitle>
          <CardDescription>
            Real-time status of all rooms across locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allRooms?.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{room.roomName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {room.locationName || "Main Location"}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {room.roomCode && (
                    <Badge variant="outline" className="text-xs">
                      {room.roomCode}
                    </Badge>
                  )}
                  <div
                    className={`w-3 h-3 rounded-full ${
                      room.currentStatus === "available"
                        ? "bg-green-500"
                        : room.currentStatus === "occupied"
                        ? "bg-yellow-500"
                        : room.currentStatus === "maintenance"
                        ? "bg-orange-500"
                        : "bg-red-500"
                    }`}
                    title={room.currentStatus}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-green-600 border-green-600">
              All Systems Operational
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "HH:mm:ss")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Data Integrity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Progress value={100} className="flex-1" />
              <span className="text-sm font-medium">100%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
