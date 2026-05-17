import { useState } from "react";
import { useListRestaurants, useDeleteRestaurant, Restaurant } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, UtensilsCrossed } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { RestaurantFormDialog } from "./RestaurantFormDialog";
import { DishManagement } from "./DishManagement";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export function RestaurantList() {
  const [search, setSearch] = useState("");
  const [selectedRestaurantForEdit, setSelectedRestaurantForEdit] = useState<Restaurant | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [selectedRestaurantForDishes, setSelectedRestaurantForDishes] = useState<Restaurant | null>(null);
  
  const [restaurantToDelete, setRestaurantToDelete] = useState<Restaurant | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: restaurants = [], isLoading } = useListRestaurants({ search }, {
    query: { queryKey: ['/api/restaurants', { search }] }
  });

  const deleteMutation = useDeleteRestaurant({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
        toast({ title: "Restaurant deleted successfully" });
        setRestaurantToDelete(null);
      },
      onError: (error) => {
        toast({ title: "Failed to delete", description: String(error), variant: "destructive" });
      }
    }
  });

  const handleEdit = (restaurant: Restaurant) => {
    setSelectedRestaurantForEdit(restaurant);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedRestaurantForEdit(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search restaurants..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Button onClick={handleCreate} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Restaurant
        </Button>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Cuisine</TableHead>
              <TableHead>Evidence</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : restaurants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-serif italic">No restaurants found</TableCell>
              </TableRow>
            ) : (
              restaurants.map((restaurant) => (
                <TableRow key={restaurant.id} className="border-border/50 hover:bg-muted/30">
                  <TableCell className="font-medium text-foreground">{restaurant.name}</TableCell>
                  <TableCell className="text-muted-foreground">{restaurant.city}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border/50 text-foreground/80 font-normal">{restaurant.cuisine}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs uppercase tracking-wider text-primary">{restaurant.evidenceLevel}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedRestaurantForDishes(restaurant)} className="text-muted-foreground hover:text-primary">
                        <UtensilsCrossed className="w-4 h-4 mr-1.5" /> Dishes
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(restaurant)} className="text-muted-foreground hover:text-foreground">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setRestaurantToDelete(restaurant)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RestaurantFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        restaurant={selectedRestaurantForEdit} 
      />

      {selectedRestaurantForDishes && (
        <DishManagement 
          restaurant={selectedRestaurantForDishes} 
          open={!!selectedRestaurantForDishes} 
          onOpenChange={(open) => !open && setSelectedRestaurantForDishes(null)} 
        />
      )}

      <AlertDialog open={!!restaurantToDelete} onOpenChange={(open) => !open && setRestaurantToDelete(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Delete {restaurantToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the restaurant and all its associated dishes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border hover:bg-muted">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => restaurantToDelete && deleteMutation.mutate({ id: restaurantToDelete.id })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
