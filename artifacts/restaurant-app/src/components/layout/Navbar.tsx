import { Link } from "wouter";
import { MapPin, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
      <div className="mx-auto px-5 h-13 flex items-center justify-between" style={{ height: "52px" }}>
        <Link href="/" className="flex items-center">
          <span
            className="font-serif tracking-wide"
            style={{ fontSize: "20px", fontWeight: 600, color: "#1a1a1a" }}
          >
            Fork{" "}
            <span style={{ color: "#B8860B" }}>&</span>
            {" "}Find
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1.5" style={{ color: "#888", fontSize: "13px" }}>
          <MapPin style={{ width: "13px", height: "13px" }} />
          <span>Al Khobar · Dammam</span>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin">
            <Button
              variant="ghost"
              size="sm"
              style={{ fontSize: "13px", color: "#555" }}
            >
              <LayoutDashboard className="w-4 h-4 mr-1.5" />
              Admin
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
