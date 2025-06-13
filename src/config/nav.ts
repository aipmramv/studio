import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Truck, Recycle, FileText, ListChecks, BarChart3, UserCircle, LogOut, Settings, ShieldCheck } from 'lucide-react';

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
    title: 'DC Generator',
    href: '/dc-generator',
    icon: ListChecks,
    description: "Generate Delivery Challans.",
  },
  {
    title: 'KPI Dashboard',
    href: '/kpi-dashboard',
    icon: BarChart3,
    description: "View key performance indicators.",
    roles: ['admin', 'mm_team'],
  },
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
        href: "/logout", // This would trigger a logout action on client, then redirect to /
        icon: LogOut,
        description: "Sign out of your account."
    }
];
