import { Link } from "wouter";
import { Search, Info, Map as MapIcon, LogIn, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <MapIcon className="w-5 h-5 text-primary" />
          <span className="font-serif font-bold text-lg tracking-wide text-foreground">Fork & Find</span>
        </Link>

        <div className="hidden md:flex items-center space-x-6 text-sm">
          <div className="flex items-center text-muted-foreground/80 font-medium">
            <Info className="w-4 h-4 mr-2" />
            Curated database — not live Google/Tripadvisor data
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="font-medium">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Admin
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
