// src/components/auth/SignupForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AtSign, Lock, UserPlus, Briefcase, Loader2, User } from "lucide-react";
import * as React from "react";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupSchema, type SignupFormData } from "@/lib/schemas";
import { USER_ROLES, DEPARTMENTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { KoneLogo } from "../shared/KoneLogo";
import { useFirestore } from "@/firebase";

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const firestore = useFirestore();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      department: undefined,
    },
  });

  async function onSubmit(data: SignupFormData) {
    setLoading(true);
    const auth = getAuth();

    if (!firestore) {
      toast({
        title: "Signup Failed",
        description: "Database service is not available. Please try again later.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Update user's profile with display name in Firebase Auth
      await updateProfile(user, { displayName: data.displayName });
      
      // Create a user profile document in Firestore
      const userDocRef = doc(firestore, "users", user.uid);
      await setDoc(userDocRef, {
        id: user.uid,
        email: user.email,
        displayName: data.displayName,
        role: "user", // All signups are 'user' role by default
        department: data.department,
      });

      toast({
        title: "Signup Successful",
        description: "Your account has been created. Please login.",
      });
      router.push("/"); // Redirect to login page after successful signup
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.code === 'auth/email-already-in-use' 
            ? "This email address is already registered."
            : error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
       <CardHeader className="text-center">
        <KoneLogo className="h-12 w-auto mx-auto mb-6" />
        <CardTitle className="text-3xl font-bold font-headline">Create an Account</CardTitle>
        <CardDescription>Join the KTI Asset Management platform.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
             <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><User className="w-4 h-4 mr-2" />Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Ram Kumar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><AtSign className="w-4 h-4 mr-2" />Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Lock className="w-4 h-4 mr-2" />Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Lock className="w-4 h-4 mr-2" />Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Briefcase className="w-4 h-4 mr-2" />Department</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
               {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Creating account...</> : <><UserPlus className="w-4 h-4 mr-2" /> Sign Up</>}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/" className="font-medium text-primary hover:underline">
            Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}