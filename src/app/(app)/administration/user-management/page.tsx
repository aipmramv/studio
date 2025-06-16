
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InviteUserSchema, type InviteUserFormData } from "@/lib/schemas";
import { USER_ROLES, DEPARTMENTS, type UserRole } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface MockUser {
  id: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
}

const mockUsersData: MockUser[] = [
  { id: "user1", name: "Alice Admin", email: "alice@example.com", department: "IT", role: "admin" },
  { id: "user2", name: "Bob Approver", email: "bob@example.com", department: "Finance", role: "approver" },
  { id: "user3", name: "Charlie Requester", email: "charlie@example.com", department: "Production", role: "requester" },
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
  
  // Mock form for editing user (department and role)
  const editUserForm = useForm<{ department: string, role: UserRole }>({
    defaultValues: { department: "", role: "requester"}
  });


  const handleInviteUserSubmit = (data: InviteUserFormData) => {
    console.log("Invite User Data:", data);
    // Mock: Add to users list
    const newUser: MockUser = { 
      id: `user_${Date.now()}`, 
      name: data.email.split('@')[0], // Simple name generation
      email: data.email, 
      department: "Unassigned", // Default department
      role: data.role 
    };
    setUsers(prev => [...prev, newUser]);
    toast({ title: "User Invited", description: `Invitation sent to ${data.email} with role ${data.role}.` });
    setIsInviteDialogOpen(false);
    inviteForm.reset();
  };

  const handleSyncSsoUsers = () => {
    toast({ title: "Syncing SSO Users...", description: "This is a mock action. In a real app, this would sync with your SSO provider." });
    // Simulate adding a new user from SSO
    setTimeout(() => {
      const ssoUser: MockUser = { 
        id: `sso_user_${Date.now()}`, 
        name: "SSO Synced User", 
        email: "sso.user@example.com", 
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

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><UserCog className="w-5 h-5 mr-2 text-primary" /> User Administration Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button onClick={handleSyncSsoUsers}>
            <RefreshCw className="w-4 h-4 mr-2" /> Sync SSO Users
          </Button>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)}>
              <Send className="w-4 h-4 mr-2" /> Invite New User
            </Button>
          </DialogTrigger>
        </CardContent>
      </Card>

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>Send an invitation to a new user to join the platform.</DialogDescription>
          </DialogHeader>
          <form onSubmit={inviteForm.handleSubmit(handleInviteUserSubmit)} className="space-y-4 py-4">
            <FormField
              control={inviteForm.control}
              name="email"
              render={({ field }) => (
                <div className="space-y-1">
                  <Label htmlFor="inviteEmail">Email Address</Label>
                  <Input id="inviteEmail" type="email" placeholder="user@example.com" {...field} />
                  {inviteForm.formState.errors.email && <p className="text-sm text-destructive">{inviteForm.formState.errors.email.message}</p>}
                </div>
              )}
            />
            <FormField
              control={inviteForm.control}
              name="role"
              render={({ field }) => (
                <div className="space-y-1">
                  <Label htmlFor="inviteRole">Assign Role</Label>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="inviteRole"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map(role => <SelectItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                   {inviteForm.formState.errors.role && <p className="text-sm text-destructive">{inviteForm.formState.errors.role.message}</p>}
                </div>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button type="submit"><Send className="w-4 h-4 mr-2" /> Send Invitation</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User: {editingUser?.name}</DialogTitle>
            <DialogDescription>Update department and role for this user.</DialogDescription>
          </DialogHeader>
          <form onSubmit={editUserForm.handleSubmit(handleEditUserSubmit)} className="space-y-4 py-4">
             <div className="space-y-1">
              <Label>Email: {editingUser?.email}</Label>
            </div>
            <FormField
                control={editUserForm.control}
                name="department"
                render={({ field }) => (
                    <div className="space-y-1">
                    <Label htmlFor="editUserDepartment">Department</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="editUserDepartment"><SelectValue placeholder="Select department" /></SelectTrigger>
                        <SelectContent>
                        {DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                        <SelectItem value="Unassigned">Unassigned</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                )}
            />
            <FormField
                control={editUserForm.control}
                name="role"
                render={({ field }) => (
                    <div className="space-y-1">
                    <Label htmlFor="editUserRole">Role</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="editUserRole"><SelectValue placeholder="Select role" /></SelectTrigger>
                        <SelectContent>
                        {USER_ROLES.map(role => <SelectItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    </div>
                )}
            />
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button></DialogClose>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
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
