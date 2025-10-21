// src/config/nav.ts
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Truck, Recycle, FileText, ListChecks, BarChart3, UserCircle,
  LogOut, Settings, ShieldCheck, Database, LibraryBig,
  SlidersHorizontal, GitFork,
  Users, UserCog, Layers, FileArchive, 
  Group, MapPin, Users2, Workflow, Code, CheckSquare, BellRing, HelpCircle, FileClock, Send, Handshake, CornerRightDown, AlertTriangle, FileWarning, DollarSign, PieChart, Activity
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
    title: 'Asset Transactions',
    href: '/asset-transactions',
    icon: GitFork,
    description: "Manage asset movements and lifecycle events.",
    items: [
       { title: 'Asset Request & Approve', href: '/asset-transactions/requests', icon: Send, description: "Request ownership changes or reassignments." },
       { title: 'Transfer (Movement)', href: '/asset-transactions/transfers', icon: Truck, description: "Handle asset movements between locations." },
       { title: 'Check-in / Check-out', href: '/asset-transactions/check-in-out', icon: ListChecks, description: "Manage temporary asset usage." },
       { title: 'Verification / Audit', href: '/asset-transactions/audit', icon: ShieldCheck, description: "Perform asset verification." },
       { title: 'Scrap Disposal', href: '/asset-transactions/scrap-disposal', icon: Recycle, description: "Manage the asset scraping process." },
       { title: 'Feedback / Issue Log', href: '/asset-transactions/feedback', icon: Handshake, description: "Submit and track asset feedback." },
    ]
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
    description: "View detailed reports and analytics.",
    items: [
        { 
          title: 'Asset Reports', 
          href: '/reports/asset', 
          icon: LibraryBig, 
          description: "Master lists and summaries.",
          items: [
            { title: 'Asset Register', href: '/reports/asset-register', icon: FileText, description: "View a complete list of all assets." },
          ]
        },
        { 
          title: 'Transactional Reports', 
          href: '/reports/transactional', 
          icon: GitFork, 
          description: "Logs of all asset activities.",
          items: [
            { title: 'Movement Report', href: '/reports/movement-report', icon: Truck, description: "Track all asset movements." },
            { title: 'Scrap Register', href: '/reports/scrap-report', icon: Recycle, description: "Log of all scrapped assets." },
          ]
        },
        { 
          title: 'Audit & Compliance', 
          href: '/reports/audit', 
          icon: ShieldCheck, 
          description: "Verification and financial reports.",
          items: [
            { title: 'Verification Report', href: '/reports/verification-report', icon: CheckSquare, description: "Audit verification history." },
            { title: 'Depreciation/Finance Report', href: '/reports/finance-report', icon: DollarSign, description: "View depreciation and financial data." },

          ]
        },
        { 
          title: 'Exception Reports', 
          href: '/reports/exceptions', 
          icon: AlertTriangle, 
          description: "Reports on issues and alerts.",
          items: [
             { title: 'Incomplete Records', href: '/reports/incomplete-records', icon: FileWarning, description: "Assets with missing mandatory fields." },
          ]
        },
         { 
          title: 'Management Reports', 
          href: '/reports/management', 
          icon: PieChart, 
          description: "Summary and analysis reports.",
          items: [
            { title: 'Asset Value Summary', href: '/reports/asset-value-summary', icon: DollarSign, description: "Total asset value by category." },
            { title: 'Utilization Report', href: '/reports/utilization-report', icon: Activity, description: "Asset usage frequency." },
          ]
        },
    ]
  },
  {
    title: 'Administration',
    href: '/administration',
    icon: SlidersHorizontal,
    description: "Manage application settings, users, and masters.",
    roles: ['admin'],
    items: [
      {
        title: 'User Management',
        href: '/administration/user-management',
        icon: UserCog,
        description: "Manage users, roles, and permissions.",
        roles: ['admin'],
      },
       {
        title: 'Audit Logs',
        href: '/administration/audit-logs',
        icon: FileArchive,
        description: "Track all system actions.",
        roles: ['admin'],
      },
      {
        title: 'Masters',
        href: '/administration/masters',
        icon: Database,
        description: "Manage application master data.",
        roles: ['admin'],
        items: [
            { title: "Classification", href: "/administration/asset-classifications", icon: Layers, description: "Standardizes asset categories" },
            { title: "Asset Grouping", href: "/administration/asset-groupings", icon: Group, description: "Logical grouping of assets" },
            { title: "Location", href: "/administration/locations", icon: MapPin, description: "Sites, buildings, floors, labs" },
            { title: "Department / Team", href: "/administration/departments-teams", icon: Users2, description: "Organizational structure" },
            { title: "Coordinator (SPOC)", href: "/administration/coordinator-mappings", icon: Workflow, description: "Map SPOCs to departments" },
            { title: "Movement Type", href: "/administration/movement-types", icon: GitFork, description: "Allowed movement flows" },
            { title: "Reason Code", href: "/administration/reason-codes", icon: Code, description: "Standard transaction reasons" },
            { title: "Status", href: "/administration/statuses", icon: CheckSquare, description: "Asset lifecycle states" },
            { title: "Condition", href: "/administration/conditions", icon: HelpCircle, description: "Asset health states" },
            { title: "Verification/Audit Plan", href: "/administration/audit-plans", icon: FileClock, description: "Audit frequency and rules" },
            { title: "Alert/Notification Rule", href: "/administration/notification-rules", icon: BellRing, description: "Events and recipients for alerts" },
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
