// src/config/nav.ts
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Truck, Recycle, FileText, ListChecks, BarChart3, UserCircle,
  LogOut, Settings, ShieldCheck, Database, Package, Building, Briefcase,
  ClipboardCheck, ShoppingCart, Tags, PlusCircle, Warehouse,
  Store, PackagePlus, PackageMinus, Undo2, SearchCheck, SlidersHorizontal, GitFork,
  Users, Mail, UserCog, Layers, FileArchive, LibraryBig, Map, Scale, Building2, Tag, Landmark,
  Group, MapPin, Users2, Workflow, Code, CheckSquare, BellRing, Goal, FileClock, HelpCircle
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
        title: 'User & Role Master',
        href: '/administration/user-management',
        icon: UserCog,
        description: "Manage users, roles, and permissions.",
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
        href: '#', // Parent item
        icon: Database,
        description: "Manage application master data.",
        roles: ['admin'],
        items: [
            { title: "Asset Classifications", href: "/administration/asset-classifications", icon: Layers, description: "Standardizes asset categories" },
            { title: "Asset Groupings", href: "/administration/asset-groupings", icon: Group, description: "Logical grouping of assets" },
            { title: "Locations", href: "/administration/locations", icon: MapPin, description: "Sites, buildings, floors, labs" },
            { title: "Departments & Teams", href: "/administration/departments-teams", icon: Users2, description: "Organizational structure" },
            { title: "Coordinator Mappings", href: "/administration/coordinator-mappings", icon: Workflow, description: "Map SPOCs to departments" },
            { title: "Movement Types", href: "/administration/movement-types", icon: GitFork, description: "Allowed movement flows" },
            { title: "Reason Codes", href: "/administration/reason-codes", icon: Code, description: "Standard transaction reasons" },
            { title: "Statuses", href: "/administration/statuses", icon: CheckSquare, description: "Asset lifecycle states" },
            { title: "Conditions", href: "/administration/conditions", icon: HelpCircle, description: "Asset health states" },
            { title: "Audit Plans", href: "/administration/audit-plans", icon: FileClock, description: "Audit frequency and rules" },
            { title: "Notification Rules", href: "/administration/notification-rules", icon: BellRing, description: "Events and recipients for alerts" },
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
