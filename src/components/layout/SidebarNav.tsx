// src/components/layout/SidebarNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { cn } from "@/lib/utils";
import { mainNavItems, type NavItem } from "@/config/nav";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth"; // Mock auth hook

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
  // Add any specific props if needed
}

export function SidebarNav({ className, ...props }: SidebarNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const checkActive = (href: string, isParent = false) => {
    if (isParent) {
      return pathname.startsWith(href);
    }
    return pathname === href;
  };
  
  const filterAndCloneNavItemsByRole = React.useCallback((itemsToFilter: NavItem[]): NavItem[] => {
    if (!user || !user.role) {
      return itemsToFilter
        .filter(item => !item.roles || item.roles.length === 0)
        .map(item => {
          const clonedItem = { ...item };
          if (clonedItem.items) {
            clonedItem.items = filterAndCloneNavItemsByRole(clonedItem.items);
          }
          return clonedItem;
        });
    }

    return itemsToFilter
      .map(item => {
        const hasAccess = !item.roles || item.roles.length === 0 || item.roles.includes(user.role!);
        
        if (!hasAccess) {
          return null;
        }

        const clonedItem = { ...item };
        
        if (clonedItem.items) {
          clonedItem.items = filterAndCloneNavItemsByRole(clonedItem.items);
        }
        return clonedItem;
      })
      .filter(Boolean) as NavItem[];
  }, [user]);

  const visibleNavItems = React.useMemo(() => filterAndCloneNavItemsByRole(mainNavItems), [filterAndCloneNavItemsByRole]);


  const renderNavItem = (item: NavItem, isSubItem = false) => (
    <li key={item.href}>
      <Button
        asChild
        variant={checkActive(item.href, !!item.items) ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start h-10 mb-1 text-sm",
          checkActive(item.href, !!item.items) && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90",
          !checkActive(item.href, !!item.items) && "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isSubItem && "h-9 pl-10"
        )}
      >
        <Link href={item.href}>
          {typeof item.icon === 'function' && <item.icon className={cn("mr-3 h-5 w-5", isSubItem && "h-4 w-4")} />}
          {item.title}
        </Link>
      </Button>
    </li>
  );

  return (
    <nav
      className={cn("flex flex-col space-y-1 p-4", className)}
      {...props}
    >
      <ul className="space-y-1">
        {visibleNavItems.map((item) =>
          item.items && item.items.length > 0 ? (
            <li key={item.title}>
              <Accordion type="single" collapsible className="w-full" defaultValue={checkActive(item.href, true) ? item.href : undefined}>
                <AccordionItem value={item.href} className="border-b-0">
                  <AccordionTrigger
                     className={cn(
                      "w-full justify-start h-10 mb-1 text-sm rounded-md px-3 py-2 ",
                      checkActive(item.href, true) ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:no-underline" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:no-underline",
                      "[&[data-state=open]>svg]:text-sidebar-primary-foreground" 
                    )}
                  >
                    <div className="flex items-center">
                      {typeof item.icon === 'function' && <item.icon className="mr-3 h-5 w-5" />}
                      {item.title}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-0 pl-2">
                    <ul className="space-y-1">
                      {item.items.map((subItem) => renderNavItem(subItem, true))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </li>
          ) : (
            renderNavItem(item)
          )
        )}
      </ul>
    </nav>
  );
}
