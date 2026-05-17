import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateRestaurant, useUpdateRestaurant, Restaurant } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  city: z.string().min(1, "City is required"),
  district: z.string().optional(),
  cuisine: z.string().min(1, "Cuisine is required"),
  latitude: z.coerce.number().optional().or(z.literal("")),
  longitude: z.coerce.number().optional().or(z.literal("")),
  googleMapsUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  instagramUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  menuSourceUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  ratingSourceNotes: z.string().optional(),
  openingHoursNotes: z.string().optional(),
  reviewConsensusSummary: z.string().optional(),
  evidenceLevel: z.string().optional(),
  bestFor: z.string().optional(),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  isFeatured: z.boolean().default(false),
});

interface RestaurantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant | null;
}

export function RestaurantFormDialog({ open, onOpenChange, restaurant }: RestaurantFormDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", city: "", district: "", cuisine: "", latitude: "", longitude: "",
      googleMapsUrl: "", instagramUrl: "", websiteUrl: "", menuSourceUrl: "",
      ratingSourceNotes: "", openingHoursNotes: "", reviewConsensusSummary: "",
      evidenceLevel: "moderate", bestFor: "", strengths: "", weaknesses: "", isFeatured: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (restaurant) {
        form.reset({
          name: restaurant.name,
          city: restaurant.city,
          district: restaurant.district || "",
          cuisine: restaurant.cuisine,
          latitude: restaurant.latitude || "",
          longitude: restaurant.longitude || "",
          googleMapsUrl: restaurant.googleMapsUrl || "",
          instagramUrl: restaurant.instagramUrl || "",
          websiteUrl: restaurant.websiteUrl || "",
          menuSourceUrl: restaurant.menuSourceUrl || "",
          ratingSourceNotes: restaurant.ratingSourceNotes || "",
          openingHoursNotes: restaurant.openingHoursNotes || "",
          reviewConsensusSummary: restaurant.reviewConsensusSummary || "",
          evidenceLevel: restaurant.evidenceLevel || "moderate",
          bestFor: restaurant.bestFor || "",
          strengths: restaurant.strengths || "",
          weaknesses: restaurant.weaknesses || "",
          isFeatured: restaurant.isFeatured,
        });
      } else {
        form.reset({
          name: "", city: "", district: "", cuisine: "", latitude: "", longitude: "",
          googleMapsUrl: "", instagramUrl: "", websiteUrl: "", menuSourceUrl: "",
          ratingSourceNotes: "", openingHoursNotes: "", reviewConsensusSummary: "",
          evidenceLevel: "moderate", bestFor: "", strengths: "", weaknesses: "", isFeatured: false,
        });
      }
    }
  }, [open, restaurant, form]);

  const createMutation = useCreateRestaurant({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
        toast({ title: "Restaurant created" });
        onOpenChange(false);
      },
      onError: (err) => toast({ title: "Error", description: String(err), variant: "destructive" })
    }
  });

  const updateMutation = useUpdateRestaurant({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
        toast({ title: "Restaurant updated" });
        onOpenChange(false);
      },
      onError: (err) => toast({ title: "Error", description: String(err), variant: "destructive" })
    }
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Clean up empty strings to undefined
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === "" ? undefined : v])
    );
    
    if (restaurant) {
      updateMutation.mutate({ id: restaurant.id, data: cleanData as any });
    } else {
      createMutation.mutate({ data: cleanData as any });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col bg-card border-border p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/50 shrink-0">
          <DialogTitle className="font-serif text-xl">{restaurant ? 'Edit Restaurant' : 'Add Restaurant'}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 py-4">
          <Form {...form}>
            <form id="restaurant-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="cuisine" render={({ field }) => (
                  <FormItem><FormLabel>Cuisine</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="district" render={({ field }) => (
                  <FormItem><FormLabel>District (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="evidenceLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evidence Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="strong">Strong</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="weak">Weak</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="bestFor" render={({ field }) => (
                  <FormItem><FormLabel>Best For (comma separated)</FormLabel><FormControl><Input {...field} placeholder="date, business, family" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="reviewConsensusSummary" render={({ field }) => (
                <FormItem><FormLabel>Review Consensus</FormLabel><FormControl><Textarea className="resize-none h-20" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="strengths" render={({ field }) => (
                  <FormItem><FormLabel>Strengths</FormLabel><FormControl><Textarea className="resize-none h-20" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="weaknesses" render={({ field }) => (
                  <FormItem><FormLabel>Weaknesses</FormLabel><FormControl><Textarea className="resize-none h-20" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="latitude" render={({ field }) => (
                  <FormItem><FormLabel>Latitude</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="longitude" render={({ field }) => (
                  <FormItem><FormLabel>Longitude</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="googleMapsUrl" render={({ field }) => (
                  <FormItem><FormLabel>Google Maps URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="websiteUrl" render={({ field }) => (
                  <FormItem><FormLabel>Website URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="instagramUrl" render={({ field }) => (
                  <FormItem><FormLabel>Instagram URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="menuSourceUrl" render={({ field }) => (
                  <FormItem><FormLabel>Menu URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="openingHoursNotes" render={({ field }) => (
                <FormItem><FormLabel>Opening Hours Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="isFeatured" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-muted/20">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Featured</FormLabel>
                    <div className="text-sm text-muted-foreground">Display this prominently.</div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </form>
          </Form>
        </ScrollArea>

        <div className="p-6 pt-4 border-t border-border/50 shrink-0 flex justify-end gap-2 bg-card">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="restaurant-form" disabled={isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {isPending ? "Saving..." : "Save Restaurant"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
