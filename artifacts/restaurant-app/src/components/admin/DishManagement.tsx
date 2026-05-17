import { useState } from "react";
import { useListDishes, useCreateDish, useUpdateDish, useDeleteDish, Restaurant, Dish } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const dishSchema = z.object({
  name: z.string().min(1, "Name required"),
  category: z.string().min(1, "Category required"),
  rawOrCooked: z.string().optional(),
  description: z.string().optional(),
  evidenceType: z.string().optional(),
  evidenceLevel: z.string().optional(),
  recommendationScore: z.coerce.number().min(1).max(10).optional().or(z.literal("")),
  dietTags: z.string().optional(),
});

interface DishManagementProps {
  restaurant: Restaurant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DishManagement({ restaurant, open, onOpenChange }: DishManagementProps) {
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: dishes = [], isLoading } = useListDishes(restaurant.id, {
    query: { enabled: open, queryKey: ['/api/restaurants', restaurant.id, 'dishes'] }
  });

  const deleteMutation = useDeleteDish({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/restaurants', restaurant.id, 'dishes'] });
        toast({ title: "Dish deleted" });
      }
    }
  });

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingDish(null);
    setIsFormOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card border-border max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif">Dishes for {restaurant.name}</DialogTitle>
        </DialogHeader>

        <div className="flex justify-between items-center my-4">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">{dishes.length} Items</h3>
          <Button size="sm" onClick={handleCreate} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> Add Dish
          </Button>
        </div>

        <div className="border border-border rounded-md overflow-y-auto flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur">
              <TableRow className="border-border">
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : dishes.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground italic">No dishes yet</TableCell></TableRow>
              ) : (
                dishes.map(dish => (
                  <TableRow key={dish.id} className="border-border/50">
                    <TableCell className="font-medium">{dish.name}</TableCell>
                    <TableCell className="capitalize text-muted-foreground text-sm">{dish.category.replace('-', ' ')}</TableCell>
                    <TableCell>{dish.recommendationScore ? `${dish.recommendationScore}/10` : '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(dish)} className="h-8 w-8 text-muted-foreground hover:text-foreground"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: dish.id })} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DishFormDialog 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen} 
          restaurantId={restaurant.id} 
          dish={editingDish} 
        />
      </DialogContent>
    </Dialog>
  );
}

function DishFormDialog({ open, onOpenChange, restaurantId, dish }: { open: boolean, onOpenChange: (open: boolean) => void, restaurantId: number, dish: Dish | null }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof dishSchema>>({
    resolver: zodResolver(dishSchema),
    defaultValues: {
      name: "", category: "main", rawOrCooked: "", description: "", evidenceType: "", evidenceLevel: "", recommendationScore: "", dietTags: ""
    }
  });

  useState(() => {
    if (open) {
      if (dish) {
        form.reset({
          name: dish.name, category: dish.category, rawOrCooked: dish.rawOrCooked || "", description: dish.description || "",
          evidenceType: dish.evidenceType || "", evidenceLevel: dish.evidenceLevel || "", recommendationScore: dish.recommendationScore || "", dietTags: dish.dietTags || ""
        });
      } else {
        form.reset({ name: "", category: "main", rawOrCooked: "", description: "", evidenceType: "", evidenceLevel: "", recommendationScore: "", dietTags: "" });
      }
    }
  });

  const createMutation = useCreateDish({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/restaurants', restaurantId, 'dishes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
        onOpenChange(false);
      }
    }
  });

  const updateMutation = useUpdateDish({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/restaurants', restaurantId, 'dishes'] });
        onOpenChange(false);
      }
    }
  });

  const onSubmit = (data: z.infer<typeof dishSchema>) => {
    const cleanData = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === "" ? undefined : v]));
    if (dish) {
      updateMutation.mutate({ id: dish.id, data: cleanData as any });
    } else {
      createMutation.mutate({ restaurantId, data: cleanData as any });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-serif">{dish ? 'Edit Dish' : 'Add Dish'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="salad">Salad</SelectItem>
                      <SelectItem value="sushi-raw">Sushi/Raw</SelectItem>
                      <SelectItem value="main">Main</SelectItem>
                      <SelectItem value="dessert">Dessert</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>
            
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="recommendationScore" render={({ field }) => (
                <FormItem><FormLabel>Score (1-10)</FormLabel><FormControl><Input type="number" min="1" max="10" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="evidenceLevel" render={({ field }) => (
                <FormItem>
                  <FormLabel>Evidence Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="strong">Strong</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="weak">Weak</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="dietTags" render={({ field }) => (
              <FormItem><FormLabel>Diet Tags (comma separated)</FormLabel><FormControl><Input {...field} placeholder="seafood, spicy, light" /></FormControl></FormItem>
            )} />

            <div className="flex justify-end pt-4 gap-2 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-primary text-primary-foreground">Save</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
