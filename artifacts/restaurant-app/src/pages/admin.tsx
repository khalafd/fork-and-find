import { Navbar } from "@/components/layout/Navbar";
import { AdminStats } from "@/components/admin/AdminStats";
import { RestaurantList } from "@/components/admin/RestaurantList";
import { SystemPromptEditor } from "@/components/admin/SystemPromptEditor";
import { CSVBulkUpload } from "@/components/admin/CSVBulkUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Manage the curated Fork & Find database.</p>
        </div>

        <AdminStats />

        <Tabs defaultValue="restaurants" className="w-full">
          <TabsList className="mb-6 bg-card border border-border/50 w-full justify-start rounded-lg h-auto p-1">
            <TabsTrigger value="restaurants" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-6 py-2.5">
              Restaurants & Dishes
            </TabsTrigger>
            <TabsTrigger value="ai-config" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-6 py-2.5">
              AI Configuration
            </TabsTrigger>
            <TabsTrigger value="import" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-6 py-2.5">
              Bulk Import
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="restaurants" className="m-0 focus-visible:outline-none">
            <RestaurantList />
          </TabsContent>
          
          <TabsContent value="ai-config" className="m-0 focus-visible:outline-none">
            <div className="max-w-4xl">
              <SystemPromptEditor />
            </div>
          </TabsContent>
          
          <TabsContent value="import" className="m-0 focus-visible:outline-none">
            <div className="max-w-4xl">
              <CSVBulkUpload />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
