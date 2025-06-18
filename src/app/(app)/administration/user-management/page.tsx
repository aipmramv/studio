
// src/app/(app)/administration/user-management/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Users, Send, RefreshCw, UserCog } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InviteUserSchema, type InviteUserFormData } from "@/lib/schemas";
import { USER_ROLES, DEPARTMENTS, type UserRole } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface MockUser {
  id: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
}

const mockUsersData: MockUser[] = [
  { id: "user1", name: "Ram Kumar", email: "ram.admin@example.com", department: "IT", role: "admin" },
  { id: "user2", name: "Prem Kumar", email: "prem.kumar@example.com", department: "Finance", role: "approver" },
  { id: "user3", name: "Praveen S.", email: "praveen.s@example.com", department: "Production", role: "requester" },
  { id: "user4", name: "Chandrasekar R.", email: "chandrasekar.r@example.com", department: "R&D", role: "requester" },
  { id: "user5", name: "Nagaraj V.", email: "nagaraj.v@example.com", department: "Maintenance", role: "requester" },
  { id: "user6", name: "Sashikanth M.", email: "sashikanth.m@example.com", department: "Safety & Environment", role: "safety" },
  { id: "user7", name: "Kumaravel P.", email: "kumaravel.p@example.com", department: "Logistics", role: "department_head" },
];

export default function UserManagementPage() {
  const [users, setUsers] = React.useState<MockUser[]>(mockUsersData);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<MockUser | null>(null);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = React.useState(false);

  const { toast } = useToast();

  const inviteForm = useForm<InviteUserFormData>({
    resolver: zodResolver(InviteUserSchema),
    defaultValues: { email: "", role: "requester" },
  });
  
  const editUserForm = useForm<{ department: string, role: UserRole }>({
    // resolver: zodResolver(SomeSchemaForEditUser), // If you create a schema
    defaultValues: { department: "", role: "requester"}
  });


  const handleInviteUserSubmit = (data: InviteUserFormData) => {
    console.log("Invite User Data:", data);
    // Extract name from email or use a generic name
    const namePart = data.email.split('@')[0].replace('.', ' ');
    const formattedName = namePart.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || "New User";

    const newUser: MockUser = { 
      id: `user_${Date.now()}`, 
      name: formattedName, 
      email: data.email, 
      department: "Unassigned", 
      role: data.role 
    };
    setUsers(prev => [...prev, newUser]);
    toast({ title: "User Invited", description: `Invitation sent to ${data.email} with role ${data.role}.` });
    setIsInviteDialogOpen(false);
    inviteForm.reset();
  };

  const handleSyncSsoUsers = () => {
    toast({ title: "Syncing SSO Users...", description: "This is a mock action. In a real app, this would sync with your SSO provider." });
    setTimeout(() => {
      const ssoUser: MockUser = { 
        id: `sso_user_${Date.now()}`, 
        name: "SSO Ram", 
        email: "sso.ram@example.com", 
        department: "IT", 
        role: "requester"
      };
      setUsers(prev => [...prev, ssoUser]);
      toast({ title: "SSO Sync Complete", description: "New users (if any) have been synced." });
    }, 1500);
  };
  
  const openEditUserDialog = (user: MockUser) => {
    setEditingUser(user);
    editUserForm.reset({ department: user.department, role: user.role });
    setIsEditUserDialogOpen(true);
  };

  const handleEditUserSubmit = (data: { department: string, role: UserRole }) => {
    if (!editingUser) return;
    setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...data } : u));
    toast({ title: "User Updated", description: `${editingUser.name}'s department/role updated.` });
    setIsEditUserDialogOpen(false);
    setEditingUser(null);
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="User Management"
        description="Manage users, roles, departments, and SSO synchronization."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><UserCog className="w-5 h-5 mr-2 text-primary" /> User Administration Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button onClick={handleSyncSsoUsers}>
            <RefreshCw className="w-4 h-4 mr-2" /> Sync SSO Users
          </Button>
          <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)}>
            <Send className="w-4 h-4 mr-2" /> Invite New User
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isInviteDialogOpen} onOpenChange={(isOpen) => {
        setIsInviteDialogOpen(isOpen);
        if (!isOpen) inviteForm.reset();
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>Send an invitation to a new user to join the platform.</DialogDescription>
          </DialogHeader>
          <Form {...inviteForm}>
            <form onSubmit={inviteForm.handleSubmit(handleInviteUserSubmit)} className="space-y-4 py-4">
              <FormField
                control={inviteForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={inviteForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {USER_ROLES.map(role => <SelectItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button type="submit"><Send className="w-4 h-4 mr-2" /> Send Invitation</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditUserDialogOpen} onOpenChange={(isOpen) => {
        setIsEditUserDialogOpen(isOpen);
        if (!isOpen) {
          setEditingUser(null);
          editUserForm.reset();
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User: {editingUser?.name}</DialogTitle>
            <DialogDescription>Update department and role for this user.</DialogDescription>
          </DialogHeader>
          <Form {...editUserForm}>
            <form onSubmit={editUserForm.handleSubmit(handleEditUserSubmit)} className="space-y-4 py-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Email: {editingUser?.email}</p>
              </div>
              <FormField
                  control={editUserForm.control}
                  name="department"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          {DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                          <SelectItem value="Unassigned">Unassigned</SelectItem>
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
              />
              <FormField
                  control={editUserForm.control}
                  name="role"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          {USER_ROLES.map(role => <SelectItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')}</SelectItem>)}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
              />
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Users className="w-5 h-5 mr-2 text-primary" /> User List</CardTitle>
          <CardDescription>Manage existing users, their roles, and departments.</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell><Badge variant="secondary">{user.role.charAt(0).toUpperCase() + user.role.slice(1).replace(/_/g, ' ')}</Badge></TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditUserDialog(user)}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" disabled> {/* Delete user mock can be added later */}
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{users.length} user(s) found.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No users found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
