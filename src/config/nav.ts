
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Truck, Recycle, FileText, ListChecks, BarChart3, UserCircle,
  LogOut, Settings, ShieldCheck, Database, Package, Building, Briefcase,
  ClipboardCheck, ShoppingCart, Tags, PlusCircle, Warehouse,
  Store, PackagePlus, PackageMinus, Undo2, SearchCheck, SlidersHorizontal, GitFork,
  Users, Mail, UserCog, Layers, FileArchive, DollarSignIcon, PackageSearch,
  Building2, Users2, TagIcon, ScaleIcon, Landmark, AreaChart, PieChart, BarChartHorizontalBig,
  FileSpreadsheet, FileCheck
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
    description: "Pending approvals and overview.",
  },
  {
    title: 'All Requests',
    href: '/all-requests',
    icon: Layers,
    description: "View all requests and their status.",
  },
  {
    title: 'Requests',
    href: '/material-movement/new',
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
        title: 'Scrap Disposal',
        href: '/scrap-movement/new',
        icon: Recycle,
        description: "Log and track scrap disposals.",
        items: [
          { title: 'New Request', href: '/scrap-movement/new', icon: PlusCircle, description: "Create a new scrap disposal request." },
          { title: 'View Requests', href: '/scrap-movement/list', icon: ListChecks, description: "View all scrap disposal requests." },
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
    title: 'DC Management',
    href: '/dc-generator',
    icon: FileText, // Main icon for DC Management
    description: "Manage Delivery Challans.",
    items: [
      { title: 'Generate DC', href: '/dc-generator', icon: PlusCircle, description: "Generate a new Delivery Challan." },
      { title: 'View DCs', href: '/dc-generator/list', icon: ListChecks, description: "View all Delivery Challans." },
    ]
  },
  {
    title: 'Stores Management',
    href: '/stores/inventory-summary',
    icon: Warehouse,
    description: "Manage store operations, inventory, and audits.",
    items: [
      { title: 'Material Receipt', href: '/stores/material-receipt', icon: PackagePlus, description: "Record material receipts." },
      { title: 'Material Issue', href: '/stores/material-issue', icon: PackageMinus, description: "Record material issues." },
      { title: 'Material Return', href: '/stores/material-returns', icon: Undo2, description: "Record material returns." },
      { title: 'Inventory Summary', href: '/stores/inventory-summary', icon: PackageSearch, description: "View material availability." },
    ]
  },
  {
    title: 'Analytics & Reports',
    href: '/kpi-dashboard',
    icon: BarChart3,
    description: "View key performance indicators and audit logs.",
    roles: ['admin', 'mm_team', 'department_head', 'finance_team'],
    items: [
      {
        title: 'KPI Dashboard',
        href: '/kpi-dashboard',
        icon: BarChart3,
        description: "View key performance indicators.",
        roles: ['admin', 'mm_team', 'department_head', 'finance_team'],
      },
      {
        title: 'Monthly Budget Report',
        href: '/reports/monthly-budget-report',
        icon: AreaChart,
        description: "Track monthly budget forecast vs actuals.",
        roles: ['admin', 'department_head', 'finance_team'],
      },
       {
        title: 'Request Status Summary',
        href: '/reports/request-status-summary',
        icon: PieChart,
        description: "Overview of request statuses by type.",
        roles: ['admin', 'mm_team', 'department_head'],
      },
      {
        title: 'Material Consumption',
        href: '/reports/material-consumption',
        icon: BarChartHorizontalBig,
        description: "Track material usage.",
        roles: ['admin', 'mm_team', 'department_head', 'finance_team'],
      },
      {
        title: 'Audit Logs',
        href: '/administration/audit-logs',
        icon: FileArchive,
        description: "View system audit logs.",
        roles: ['admin'],
      }
    ]
  },
  {
    title: 'Masters',
    href: '/masters/material-types',
    icon: Database,
    description: "Manage application master data.",
    roles: ['admin'],
    items: [
      { title: 'Material Types', href: '/masters/material-types', icon: Package, description: "Manage material types." },
      { title: 'Scrap Categories', href: '/masters/scrap-types', icon: Recycle, description: "Manage scrap types." },
      { title: 'Store Locations', href: '/masters/store-locations', icon: Store, description: "Manage store locations." },
      { title: 'Departments', href: '/masters/departments', icon: Briefcase, description: "Manage departments." },
      { title: 'Activity Types', href: '/masters/activity-types', icon: ClipboardCheck, description: "Manage work permit activity types." },
      { title: 'Cost Centers', href: '/masters/cost-centers', icon: DollarSignIcon, description: "Manage cost centers." },
      { title: 'Department Budgets', href: '/masters/department-budgets', icon: Landmark, description: "Manage department quarterly budgets.", roles:['admin'] },
      { title: 'Vendors', href: '/masters/vendors', icon: Building2, description: "Manage vendor master data." },
      { title: 'Customers', href: '/masters/customers', icon: Users2, description: "Manage customer master data." },
      { title: 'HSN/SAC Codes', href: '/masters/hsn-sac-codes', icon: TagIcon, description: "Manage HSN/SAC codes." },
      { title: 'Units of Measurement', href: '/masters/uom', icon: ScaleIcon, description: "Manage UOMs." },
    ]
  },
  {
    title: 'Administration',
    href: '/administration/workflows',
    icon: SlidersHorizontal,
    description: "Manage application settings.",
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
      {
        title: 'Work Permit Templates',
        href: '/administration/work-permit-templates',
        icon: FileCheck,
        description: "Configure work permit layouts.",
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
