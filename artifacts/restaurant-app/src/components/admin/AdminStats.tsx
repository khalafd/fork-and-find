import { useGetAdminStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, MapPin, MessageSquare, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminStats() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Restaurants</CardTitle>
            <Building2 className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-bold text-foreground">{stats.totalRestaurants}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Dishes</CardTitle>
            <Utensils className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-bold text-foreground">{stats.totalDishes}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">AI Conversations</CardTitle>
            <MessageSquare className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-bold text-foreground">{stats.totalConversations}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Top Cuisines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topCuisines.map(c => (
                <div key={c.cuisine} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{c.cuisine}</span>
                  <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">{c.count}</span>
                </div>
              ))}
              {stats.topCuisines.length === 0 && <span className="text-sm text-muted-foreground italic">No data</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Top Cities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topCities.map(c => (
                <div key={c.city} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{c.city}</span>
                  <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">{c.count}</span>
                </div>
              ))}
              {stats.topCities.length === 0 && <span className="text-sm text-muted-foreground italic">No data</span>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
