
// src/config/nav.ts
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Truck, Recycle, FileText, ListChecks, BarChart3, UserCircle,
  LogOut, Settings, ShieldCheck, Database, Package, Building, Briefcase,
  ClipboardCheck, ShoppingCart, Tags, PlusCircle, Warehouse,
  Store, PackagePlus, PackageMinus, Undo2, SearchCheck, SlidersHorizontal, GitFork,
  Users, Mail, UserCog, Layers, FileArchive, LibraryBig, Map, Scale, Building2, Tag, Landmark
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
        title: 'Audit Logs',
        href: '/administration/audit-logs',
        icon: FileArchive,
        description: "Review system and user activity.",
        roles: ['admin'],
      },
      {
        title: 'Masters',
        href: '/masters/cost-centers',
        icon: Database,
        description: "Manage application master data.",
        roles: ['admin'],
        items: [
            { title: "Activity Types", href: "/masters/activity-types", icon: ListChecks, description: "Work Permit activity types" },
            { title: "Cost Centers", href: "/masters/cost-centers", icon: Briefcase, description: "Organizational cost centers" },
            { title: "Customers", href: "/masters/customers", icon: Users, description: "Customer master data" },
            { title: "Dept Budgets", href: "/masters/department-budgets", icon: Landmark, description: "Department budget allocation" },
            { title: "Departments", href: "/masters/departments", icon: Building2, description: "Organizational departments" },
            { title: "HSN/SAC Codes", href: "/masters/hsn-sac-codes", icon: Tag, description: "Tax codes for goods/services" },
            { title: "Material Types", href: "/masters/material-types", icon: Package, description: "Types of materials" },
            { title: "Scrap Types", href: "/masters/scrap-types", icon: Recycle, description: "Types of scrap material" },
            { title: "Store Locations", href: "/masters/store-locations", icon: Map, description: "Warehouse and store locations" },
            { title: "UOM", href: "/masters/uom", icon: Scale, description: "Units of Measurement" },
            { title: "Vendors", href: "/masters/vendors", icon: Building, description: "Vendor and supplier master" },
        ]
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
