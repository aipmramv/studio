
import type { LucideIcon } from 'lucide-react';
import { 
  LayoutDashboard, Truck, Recycle, FileText, ListChecks, BarChart3, UserCircle, 
  LogOut, Settings, ShieldCheck, Database, Package, Building, Briefcase, 
  ClipboardCheck, ShoppingCart, Tags, PlusCircle, FileSignature, Warehouse, 
  Store, PackagePlus, PackageMinus, Undo2, SearchCheck, Workflow, SlidersHorizontal
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string; // Can be a base path for parent items
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
    description: "Pending approvals and overview.",
  },
  {
    title: 'Requests',
    href: '/requests', // Base path, actual navigation will be to children
    icon: ClipboardCheck, 
    description: "Manage all types of requests.",
    items: [
      {
        title: 'Material Movement',
        href: '/material-movement', // Base for this sub-group
        icon: Truck,
        description: "Log and track material movements.",
        items: [
          { title: 'New Request', href: '/material-movement/new', icon: PlusCircle, description: "Create a new material movement request." },
          { title: 'View Requests', href: '/material-movement/list', icon: ListChecks, description: "View all material movement requests." },
        ]
      },
      {
        title: 'Scrap Movement',
        href: '/scrap-movement', // Base for this sub-group
        icon: Recycle,
        description: "Log and track scrap disposals.",
        items: [
          { title: 'New Request', href: '/scrap-movement/new', icon: PlusCircle, description: "Create a new scrap movement request." },
          { title: 'View Requests', href: '/scrap-movement/list', icon: ListChecks, description: "View all scrap movement requests." },
        ]
      },
      {
        title: 'Work Permit',
        href: '/work-permit', // Base for this sub-group
        icon: ShieldCheck,
        description: "Request and manage work permits.",
        items: [
          { title: 'New Request', href: '/work-permit/new', icon: PlusCircle, description: "Create a new work permit request." },
          { title: 'View Permits', href: '/work-permit/list', icon: ListChecks, description: "View all work permit requests." },
        ]
      },
      {
        title: 'Purchase Order',
        href: '/purchase-order', // Base for this sub-group
        icon: ShoppingCart,
        description: "Manage Purchase Orders.",
        items: [
          { title: 'New Request', href: '/purchase-order/new', icon: PlusCircle, description: "Create a new purchase order." },
          { title: 'View Requests', href: '/purchase-order/list', icon: ListChecks, description: "View all purchase orders." },
        ]
      },
      {
        title: 'Sale Order',
        href: '/sale-order', // Base for this sub-group
        icon: Tags,
        description: "Manage Sale Orders.",
        items: [
          { title: 'New Request', href: '/sale-order/new', icon: PlusCircle, description: "Create a new sale order." },
          { title: 'View Requests', href: '/sale-order/list', icon: ListChecks, description: "View all sale orders." },
        ]
      },
    ]
  },
  {
    title: 'Logistics',
    href: '/logistics', // Base path
    icon: Package, 
    description: "Manage delivery and stores operations.",
    items: [
      {
        title: 'Delivery Note',
        href: '/delivery-note', // Base for this sub-group
        icon: FileSignature,
        description: "Generate and view Delivery Notes.",
        items: [
            { title: 'Generate Note', href: '/delivery-note/generate', icon: PlusCircle, description: "Generate a new delivery note." },
            { title: 'View Notes', href: '/delivery-note/list', icon: ListChecks, description: "View all delivery notes." },
        ]
      },
      {
        title: 'Stores',
        href: '/stores', // Base for this sub-group
        icon: Warehouse,
        description: "Manage store operations.",
        items: [
          { title: 'Manage Stores', href: '/stores/manage', icon: Store, description: "Manage store locations." },
          { title: 'Material Receipt', href: '/stores/material-receipt', icon: PackagePlus, description: "Record material receipts." },
          { title: 'Material Issue', href: '/stores/material-issue', icon: PackageMinus, description: "Record material issues." },
          { title: 'Material Returns', href: '/stores/material-returns', icon: Undo2, description: "Record material returns." },
          { title: 'Stores Audit', href: '/stores/audit', icon: SearchCheck, description: "Conduct store audits." },
        ]
      },
    ]
  },
  {
    title: 'Analytics',
    href: '/analytics', // Base path
    icon: BarChart3,
    description: "View key performance indicators.",
    roles: ['admin', 'mm_team'], // Role for the parent, applies to children unless overridden
    items: [
      {
        title: 'KPI Dashboard',
        href: '/kpi-dashboard',
        icon: BarChart3, // Can use same icon or more specific if available
        description: "View key performance indicators.",
        roles: ['admin', 'mm_team'], 
      }
    ]
  },
  {
    title: 'Administration',
    href: '/administration', // Base path
    icon: SlidersHorizontal, // Using SlidersHorizontal as a general admin/settings icon
    description: "Manage application settings and metadata.",
    roles: ['admin'],
    items: [
      { 
        title: 'Masters', 
        href: '/masters', // Base for this sub-group
        icon: Database, 
        description: "Manage application metadata.",
        roles: ['admin'],
        items: [
          { title: 'Material Types', href: '/masters/material-types', icon: Package, description: "Manage material types." },
          { title: 'Scrap Types', href: '/masters/scrap-types', icon: Recycle, description: "Manage scrap types." },
          { title: 'Building Types', href: '/masters/building-types', icon: Building, description: "Manage building types." },
          { title: 'Departments', href: '/masters/departments', icon: Briefcase, description: "Manage departments." },
          { title: 'Activity Types', href: '/masters/activity-types', icon: ClipboardCheck, description: "Manage work permit activity types." },
        ]
      },
      // Future admin items like User Management can go here
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
        href: "/settings", // This links to Application Settings page
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

