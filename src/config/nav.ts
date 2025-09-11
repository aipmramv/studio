
// src/config/nav.ts
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Truck, Recycle, FileText, ListChecks, BarChart3, UserCircle,
  LogOut, Settings, ShieldCheck, Database, Package, Building, Briefcase,
  ClipboardCheck, ShoppingCart, Tags, PlusCircle, Warehouse,
  Store, PackagePlus, PackageMinus, Undo2, SearchCheck, SlidersHorizontal, GitFork,
  Users, Mail, UserCog, Layers, FileArchive, LibraryBig
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  description?: string;
  roles?: string[];
  items?: NavItem[];
}

export const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: "Asset summary and key alerts.",
  },
  {
    title: 'Asset Management',
    href: '/asset-management/list',
    icon: LibraryBig,
    description: "Manage all company assets.",
  },
  {
    title: 'Transactions',
    href: '/transactions', // This can be a placeholder or link to the first item
    icon: ClipboardCheck,
    description: "Manage asset movements and lifecycle events.",
    items: [
       { title: 'Asset Transfers', href: '/transactions/transfers', icon: Truck, description: "Handle asset movements between locations." },
       { title: 'Check-in/Check-out', href: '/transactions/check-in-out', icon: ListChecks, description: "Manage temporary asset usage." },
       { title: 'Verification & Audit', href: '/transactions/audit', icon: SearchCheck, description: "Perform asset verification." },
    ]
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
    description: "View detailed reports and analytics.",
    items: [
        { title: 'Asset Register', href: '/reports/asset-register', icon: FileText, description: "View a complete list of all assets." },
        { title: 'Movement Report', href: '/reports/movement-report', icon: Truck, description: "Track all asset movements." },
        { title: 'Verification Report', href: '/reports/verification-report', icon: ShieldCheck, description: "Audit verification history." },
        { title: 'Finance Report', href: '/reports/finance-report', icon: Database, description: "View depreciation and financial data." },
        { title: 'Scrap Report', href: '/reports/scrap-report', icon: Recycle, description: "Log of all scrapped assets." },
    ]
  },
  {
    title: 'Administration',
    href: '/administration/user-management',
    icon: SlidersHorizontal,
    description: "Manage application settings, users, and masters.",
    roles: ['admin'],
    items: [
       {
        title: 'User Management',
        href: '/administration/user-management',
        icon: UserCog,
        description: "Manage users, roles, and departments.",
        roles: ['admin'],
      },
      {
        title: 'Masters',
        href: '/masters/asset-classifications',
        icon: Database,
        description: "Manage application master data.",
        roles: ['admin'],
      },
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
