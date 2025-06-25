// src/components/layout/AppLayoutBase.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/layout/UserNav";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react"; 
import { KoneLogo } from "@/components/shared/KoneLogo"; // Import KONE Logo

interface AppLayoutBaseProps {
  children: React.ReactNode;
}

export function AppLayoutBase({ children }: AppLayoutBaseProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/"); // Redirect to login if not authenticated
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon" className="border-r border-sidebar-border no-print"> {/* Removed shadow-lg */}
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <Button variant="link" className="p-0 h-auto" asChild>
                <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-primary-foreground transition-colors">
                  <KoneLogo 
                    className="h-8 w-auto" 
                    blockColor="hsl(var(--primary-foreground))" // White
                    textColor="hsl(var(--primary))"           // KONE Blue
                    separatorColor="hsl(var(--primary))"      // KONE Blue
                  />
                  <h1 className="text-xl font-bold font-headline group-data-[collapsible=icon]:hidden">R&D Stores Flow</h1>
                </Link>
              </Button>
              {/* Mobile trigger, hidden on md+ */}
              <div className="md:hidden">
                <SidebarTrigger />
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-0">
            <SidebarNav />
          </SidebarContent>
          {/* Footer can be added here if needed */}
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-card border-b md:px-8 no-print"> {/* Removed shadow-sm for flatter KONE look */}
             {/* Desktop trigger, hidden on mobile */}
            <div className="hidden md:block">
                <SidebarTrigger />
            </div>
            <div className="flex-1"></div> {/* Spacer */}
            <UserNav />
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
