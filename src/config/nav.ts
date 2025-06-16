
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Truck, Recycle, FileText, ListChecks, BarChart3, UserCircle, LogOut, Settings, ShieldCheck, Database, Package, Building, Briefcase, ClipboardCheck, ShoppingCart, Tags, PlusCircle } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  description?: string;
  roles?: string[]; // For future role-based access
  items?: NavItem[]; // For sub-menus
}

export const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: "Pending approvals and overview.",
  },
  {
    title: 'Material Movement',
    href: '/material-movement',
    icon: Truck,
    description: "Log and track material movements.",
    items: [
      { title: 'New Request', href: '/material-movement/new', icon: FileText },
      { title: 'View Requests', href: '/material-movement/list', icon: ListChecks },
    ]
  },
  {
    title: 'Scrap Movement',
    href: '/scrap-movement',
    icon: Recycle,
    description: "Log and track scrap disposals.",
    items: [
      { title: 'New Request', href: '/scrap-movement/new', icon: FileText },
      { title: 'View Requests', href: '/scrap-movement/list', icon: ListChecks },
    ]
  },
  {
    title: 'Work Permit',
    href: '/work-permit',
    icon: ShieldCheck,
    description: "Request and manage work permits.",
    items: [
      { title: 'New Request', href: '/work-permit/new', icon: FileText },
      { title: 'View Permits', href: '/work-permit/list', icon: ListChecks },
    ]
  },
  {
    title: 'Purchase Order',
    href: '/purchase-order',
    icon: ShoppingCart,
    description: "Manage Purchase Orders.",
    items: [
      { title: 'New Request', href: '/purchase-order/new', icon: FileText },
      { title: 'View Requests', href: '/purchase-order/list', icon: ListChecks },
    ]
  },
  {
    title: 'Sale Order',
    href: '/sale-order',
    icon: Tags,
    description: "Manage Sale Orders.",
    items: [
      { title: 'New Request', href: '/sale-order/new', icon: FileText },
      { title: 'View Requests', href: '/sale-order/list', icon: ListChecks },
    ]
  },
  {
    title: 'DC Generator',
    href: '/dc-generator',
    icon: ListChecks, // Re-using ListChecks as it fits the "document generation" theme
    description: "Generate Delivery Challans.",
  },
  {
    title: 'KPI Dashboard',
    href: '/kpi-dashboard',
    icon: BarChart3,
    description: "View key performance indicators.",
    roles: ['admin', 'mm_team'],
  },
  {
    title: 'Masters',
    href: '/masters',
    icon: Database,
    description: "Manage application metadata.",
    roles: ['admin'],
    items: [
      { title: 'Material Types', href: '/masters/material-types', icon: Package },
      { title: 'Scrap Types', href: '/masters/scrap-types', icon: Recycle },
      { title: 'Building Types', href: '/masters/building-types', icon: Building },
      { title: 'Departments', href: '/masters/departments', icon: Briefcase },
      { title: 'Activity Types', href: '/masters/activity-types', icon: ClipboardCheck },
    ]
  }
];

export const userNavItems: NavItem[] = [
    {
        title: "Profile",
        href: "/profile",
        icon: UserCircle,
        description: "Manage your profile settings."
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Application settings."
    },
    {
        title: "Logout",
        href: "/logout", 
        icon: LogOut,
        description: "Sign out of your account."
    }
];
