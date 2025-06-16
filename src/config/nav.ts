
import type { LucideIcon } from 'lucide-react';
import { 
  LayoutDashboard, Truck, Recycle, FileText, ListChecks, BarChart3, UserCircle, 
  LogOut, Settings, ShieldCheck, Database, Package, Building, Briefcase, 
  ClipboardCheck, ShoppingCart, Tags, PlusCircle, FileSignature, Warehouse, 
  Store, PackagePlus, PackageMinus, Undo2, SearchCheck, Workflow, SlidersHorizontal, GitFork,
  Users, Mail, UserCog, Layers
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
    title: 'All Requests',
    href: '/all-requests',
    icon: Layers, // Using Layers icon for All Requests
    description: "View all requests and their status.",
  },
  {
    title: 'Requests',
    href: '/material-movement/new', // Points to the first child as a default
    icon: ClipboardCheck, 
    description: "Manage all types of requests.",
    items: [
      {
        title: 'Material Movement',
        href: '/material-movement/new', 
        icon: Truck,
        description: "Log and track material movements.",
        items: [
          { title: 'New Request', href: '/material-movement/new', icon: PlusCircle, description: "Create a new material movement request." },
          { title: 'View Requests', href: '/material-movement/list', icon: ListChecks, description: "View all material movement requests." },
        ]
      },
      {
        title: 'Scrap Request',
        href: '/scrap-movement/new', 
        icon: Recycle,
        description: "Log and track scrap disposals.",
        items: [
          { title: 'New Request', href: '/scrap-movement/new', icon: PlusCircle, description: "Create a new scrap request." },
          { title: 'View Requests', href: '/scrap-movement/list', icon: ListChecks, description: "View all scrap requests." },
        ]
      },
      {
        title: 'Work Permit',
        href: '/work-permit/new', 
        icon: ShieldCheck,
        description: "Request and manage work permits.",
        items: [
          { title: 'New Request', href: '/work-permit/new', icon: PlusCircle, description: "Create a new work permit request." },
          { title: 'View Permits', href: '/work-permit/list', icon: ListChecks, description: "View all work permit requests." },
        ]
      },
      {
        title: 'Purchase Order',
        href: '/purchase-order/new', 
        icon: ShoppingCart,
        description: "Manage Purchase Orders.",
        items: [
          { title: 'New Request', href: '/purchase-order/new', icon: PlusCircle, description: "Create a new purchase order." },
          { title: 'View Requests', href: '/purchase-order/list', icon: ListChecks, description: "View all purchase orders." },
        ]
      },
      {
        title: 'Sale Order',
        href: '/sale-order/new', 
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
    href: '/delivery-note/generate', // Points to the first child
    icon: Package, 
    description: "Manage delivery and stores operations.",
    items: [
      {
        title: 'Delivery Note',
        href: '/delivery-note/generate', 
        icon: FileSignature,
        description: "Generate and view Delivery Notes.",
        items: [
            { title: 'Generate Note', href: '/delivery-note/generate', icon: PlusCircle, description: "Generate a new delivery note." },
            { title: 'View Notes', href: '/delivery-note/list', icon: ListChecks, description: "View all delivery notes." },
        ]
      },
      {
        title: 'Stores',
        href: '/stores/manage', // Default to Manage Stores
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
    href: '/kpi-dashboard', 
    icon: BarChart3,
    description: "View key performance indicators.",
    roles: ['admin', 'mm_team'], 
    items: [
      {
        title: 'KPI Dashboard',
        href: '/kpi-dashboard',
        icon: BarChart3, 
        description: "View key performance indicators.",
        roles: ['admin', 'mm_team'], 
      }
    ]
  },
  {
    title: 'Administration',
    href: '/administration/workflows', 
    icon: SlidersHorizontal, 
    description: "Manage application settings and metadata.",
    roles: ['admin'],
    items: [
      {
        title: 'Workflow Config',
        href: '/administration/workflows',
        icon: GitFork, 
        description: "Configure approval workflows.",
        roles: ['admin'],
      },
      { 
        title: 'Masters', 
        href: '/masters/material-types', 
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
      {
        title: 'User Management',
        href: '/administration/user-management',
        icon: UserCog,
        description: "Manage users, roles, and departments.",
        roles: ['admin'],
      },
      {
        title: 'Email Templates',
        href: '/administration/email-templates',
        icon: Mail,
        description: "Configure email notifications.",
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

