import { X, MapPin, Globe, ExternalLink, Clock, Star, TrendingUp, AlertCircle, BookmarkPlus, BookmarkMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useGetRestaurant, getGetRestaurantQueryKey, useAddToShortlist, useRemoveFromShortlist, useGetShortlist } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionId } from "@/hooks/use-session";
import { useQueryClient } from "@tanstack/react-query";

interface RestaurantDetailPanelProps {
  restaurantId: number;
  onClose: () => void;
  onAskAI: () => void;
}

export function RestaurantDetailPanel({ restaurantId, onClose, onAskAI }: RestaurantDetailPanelProps) {
  const queryClient = useQueryClient();
  
  const { data: restaurant, isLoading } = useGetRestaurant(restaurantId, {
    query: { enabled: !!restaurantId, queryKey: getGetRestaurantQueryKey(restaurantId) }
  });

  const { data: shortlist } = useGetShortlist();
  
  const addToShortlist = useAddToShortlist();
  
  const removeFromShortlist = useRemoveFromShortlist();

  const isShortlisted = shortlist?.some(r => r.id === restaurantId);

  const toggleShortlist = () => {
    if (isShortlisted) {
      removeFromShortlist.mutate({ restaurantId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/shortlist'] })
      });
    } else {
      addToShortlist.mutate({ restaurantId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/shortlist'] })
      });
    }
  };

  if (isLoading || !restaurant) {
    return (
      <div className="absolute top-4 left-4 z-10 w-96 max-h-[calc(100vh-2rem)] bg-card border border-border shadow-2xl rounded-lg overflow-hidden flex flex-col">
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full mt-4" />
        </div>
      </div>
    );
  }

  // Group dishes by category
  const dishesByCategory = restaurant.dishes?.reduce((acc, dish) => {
    const cat = dish.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(dish);
    return acc;
  }, {} as Record<string, typeof restaurant.dishes>) || {};

  return (
    <div className="absolute top-4 left-4 z-10 w-[420px] max-h-[calc(100vh-6rem)] bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-xl overflow-hidden flex flex-col animate-in slide-in-from-left-4 fade-in duration-300">
      
      <div className="sticky top-0 bg-gradient-to-b from-card to-card/80 p-5 pb-4 z-20 border-b border-border/20">
        <Button variant="ghost" size="icon" className="absolute top-3 right-3 text-muted-foreground hover:text-foreground rounded-full" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
        
        <div className="flex gap-2 mb-3">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 capitalize font-medium">
            {restaurant.evidenceLevel} Evidence
          </Badge>
          <Badge variant="outline" className="text-muted-foreground capitalize border-border/50">
            {restaurant.cuisine}
          </Badge>
        </div>

        <h2 className="font-serif text-2xl font-bold text-foreground leading-tight">{restaurant.name}</h2>
        
        <div className="flex items-center text-sm text-muted-foreground mt-2 gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          <span>{restaurant.district ? `${restaurant.district}, ` : ''}{restaurant.city}</span>
        </div>

        <div className="flex gap-2 mt-4">
          <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={onAskAI}>
            Ask AI about this
          </Button>
          <Button variant="outline" size="icon" className="border-border/50 hover:bg-muted" onClick={toggleShortlist}>
            {isShortlisted ? <BookmarkMinus className="w-4 h-4 text-primary" /> : <BookmarkPlus className="w-4 h-4 text-muted-foreground" />}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-5">
        <div className="space-y-6 pb-6">
          
          {restaurant.bestFor && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" /> Best For
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {restaurant.bestFor.split(',').map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-muted/50 text-foreground/80 font-normal">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {restaurant.reviewConsensusSummary && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Review Consensus</h3>
              <p className="text-sm text-foreground/90 leading-relaxed italic border-l-2 border-primary/30 pl-3 py-1">
                "{restaurant.reviewConsensusSummary}"
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {restaurant.strengths && (
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Strengths
                </h3>
                <p className="text-sm text-foreground/80">{restaurant.strengths}</p>
              </div>
            )}
            {restaurant.weaknesses && (
              <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-destructive mb-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Weaknesses
                </h3>
                <p className="text-sm text-foreground/80">{restaurant.weaknesses}</p>
              </div>
            )}
          </div>

          <Separator className="bg-border/30" />

          {Object.keys(dishesByCategory).length > 0 && (
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground mb-4">Notable Dishes</h3>
              <div className="space-y-5">
                {Object.entries(dishesByCategory).map(([category, dishes]) => (
                  <div key={category}>
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 pb-1 border-b border-border/20">
                      {category.replace('-', ' ')}
                    </h4>
                    <div className="space-y-3">
                      {dishes.map(dish => (
                        <div key={dish.id} className="group">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{dish.name}</span>
                              {dish.recommendationScore && (
                                <Badge variant="outline" className="ml-2 bg-background border-primary/20 text-primary text-[10px] px-1 py-0 h-4">
                                  {dish.recommendationScore}/10
                                </Badge>
                              )}
                            </div>
                            {dish.evidenceLevel && (
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded-sm">
                                {dish.evidenceLevel}
                              </span>
                            )}
                          </div>
                          {dish.description && <p className="text-xs text-muted-foreground mt-1 leading-snug">{dish.description}</p>}
                          {dish.dietTags && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {dish.dietTags.split(',').map(tag => (
                                <span key={tag} className="text-[9px] uppercase tracking-wider text-foreground/50 border border-border/50 rounded-sm px-1">
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator className="bg-border/30" />
          
          <div className="space-y-2">
            {restaurant.openingHoursNotes && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{restaurant.openingHoursNotes}</span>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 pt-2">
              {restaurant.googleMapsUrl && (
                <a href={restaurant.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-primary hover:underline">
                  <MapPin className="w-3 h-3" /> Google Maps
                </a>
              )}
              {restaurant.websiteUrl && (
                <a href={restaurant.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-primary hover:underline">
                  <Globe className="w-3 h-3" /> Website
                </a>
              )}
              {restaurant.instagramUrl && (
                <a href={restaurant.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-primary hover:underline">
                  <ExternalLink className="w-3 h-3" /> Instagram
                </a>
              )}
              {restaurant.menuSourceUrl && (
                <a href={restaurant.menuSourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-primary hover:underline">
                  <ExternalLink className="w-3 h-3" /> Menu
                </a>
              )}
            </div>
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
