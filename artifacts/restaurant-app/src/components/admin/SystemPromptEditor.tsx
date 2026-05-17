import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetAdminSettings, useUpdateAdminSettings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  chatbotName: z.string().min(1, "Name required"),
  systemPrompt: z.string().min(1, "Prompt required"),
});

export function SystemPromptEditor() {
  const { data: settings, isLoading } = useGetAdminSettings();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chatbotName: "",
      systemPrompt: "",
    }
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        chatbotName: settings.chatbotName,
        systemPrompt: settings.systemPrompt,
      });
    }
  }, [settings, form]);

  const updateMutation = useUpdateAdminSettings({
    mutation: {
      onSuccess: () => {
        toast({ title: "Settings updated successfully" });
      },
      onError: (err) => {
        toast({ title: "Failed to update", description: String(err), variant: "destructive" });
      }
    }
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    updateMutation.mutate({ data });
  };

  if (isLoading) {
    return <div className="h-40 flex items-center justify-center text-muted-foreground">Loading settings...</div>;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-serif">AI Assistant Configuration</CardTitle>
        <CardDescription>Configure the personality and behavior of the chatbot</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="chatbotName" render={({ field }) => (
              <FormItem>
                <FormLabel>Assistant Name</FormLabel>
                <FormControl><Input {...field} className="max-w-md" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            
            <FormField control={form.control} name="systemPrompt" render={({ field }) => (
              <FormItem>
                <FormLabel>System Prompt</FormLabel>
                <FormControl><Textarea {...field} className="min-h-[200px] font-mono text-sm leading-relaxed" /></FormControl>
                <div className="text-xs text-muted-foreground mt-2">
                  Context variables injected at runtime: <code>{`{selected_restaurant}`}</code>, <code>{`{shortlist}`}</code>.
                </div>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending || !form.formState.isDirty} className="bg-primary text-primary-foreground">
                {updateMutation.isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
