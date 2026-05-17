import { useState, useRef } from "react";
import { Upload, FileDown, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBulkUploadRestaurants } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";

export function CSVBulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [results, setResults] = useState<{created: number, errors: string[]} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useBulkUploadRestaurants({
    mutation: {
      onSuccess: (data) => {
        setResults(data);
        queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
        if (data.errors.length === 0) {
          toast({ title: `Successfully imported ${data.created} restaurants` });
        } else {
          toast({ title: "Import completed with errors", variant: "destructive" });
        }
      },
      onError: (err) => {
        toast({ title: "Upload failed", description: String(err), variant: "destructive" });
      }
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    setIsParsing(true);
    setResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: { data: any[] }) => {
        setIsParsing(false);
        // Process rows, handle data types
        const rows = results.data.map((row: any) => {
          return {
            ...row,
            latitude: row.latitude ? parseFloat(row.latitude) : undefined,
            longitude: row.longitude ? parseFloat(row.longitude) : undefined,
            isFeatured: row.isFeatured === 'true' || row.isFeatured === '1'
          };
        });
        
        uploadMutation.mutate({ data: { rows } });
      },
      error: (error: Error) => {
        setIsParsing(false);
        toast({ title: "CSV Parsing Error", description: error.message, variant: "destructive" });
      }
    });
  };

  const downloadTemplate = () => {
    const headers = [
      "name", "city", "district", "cuisine", "latitude", "longitude",
      "evidenceLevel", "bestFor", "reviewConsensusSummary", "strengths", "weaknesses",
      "googleMapsUrl", "websiteUrl", "instagramUrl", "menuSourceUrl", "openingHoursNotes", "isFeatured"
    ];
    const csv = headers.join(",") + "\n";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'restaurant_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-serif">Bulk Import Data</CardTitle>
        <CardDescription>Upload restaurants via CSV to quickly populate the database.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border border-border/50 rounded-lg p-4 bg-muted/20">
            <div>
              <h4 className="font-medium text-sm text-foreground">CSV Template</h4>
              <p className="text-xs text-muted-foreground mt-1">Download the template to ensure correct column headers.</p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="border-border hover:bg-muted">
              <FileDown className="w-4 h-4 mr-2" /> Download CSV
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <Input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                className="flex-1 bg-background border-border/50 cursor-pointer" 
              />
              <Button 
                onClick={handleUpload} 
                disabled={!file || isParsing || uploadMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-32"
              >
                {isParsing || uploadMutation.isPending ? "Processing..." : (
                  <><Upload className="w-4 h-4 mr-2" /> Upload</>
                )}
              </Button>
            </div>

            {results && (
              <div className={`p-4 rounded-lg border ${results.errors.length > 0 ? 'border-destructive/30 bg-destructive/5' : 'border-primary/30 bg-primary/5'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {results.errors.length > 0 ? (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                  <h4 className="font-medium">Import Complete</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Successfully created {results.created} restaurants.</p>
                
                {results.errors.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-2">Errors ({results.errors.length})</p>
                    <div className="max-h-32 overflow-y-auto space-y-1 text-xs text-destructive/80 font-mono bg-background/50 p-2 rounded">
                      {results.errors.map((err, i) => (
                        <div key={i}>{err}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
