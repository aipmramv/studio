// src/components/auth/LoginForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AtSign, Lock, LogIn, Briefcase, Loader2 } from "lucide-react";
import * as React from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, type AuthError } from "firebase/auth";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginSchema, type LoginFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { KoneLogo } from "@/components/shared/KoneLogo";
import { useFirestore } from "@/firebase";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const firestore = useFirestore();


  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    setLoading(true);
    const auth = getAuth();
    
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push("/dashboard");
    } catch (error) {
      const authError = error as AuthError;
      
      // Special handling for the default admin user on first login
      if (
        authError.code === 'auth/user-not-found' &&
        data.email === 'admin@example.com' &&
        data.password === 'admin123' &&
        firestore
      ) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
          const user = userCredential.user;

          // Create a user profile in Firestore
          const userDocRef = doc(firestore, "users", user.uid);
          await setDoc(userDocRef, {
            id: user.uid,
            email: user.email,
            role: 'admin',
            displayName: 'Admin User',
            department: 'IT'
          });

          toast({
            title: "Admin Account Created",
            description: "Default administrator account has been set up. Welcome!",
          });
          router.push("/dashboard");

        } catch (creationError) {
          const creationAuthError = creationError as AuthError;
          toast({
            title: "Admin Creation Failed",
            description: creationAuthError.message || "Could not create the default admin account.",
            variant: "destructive",
          });
        }
      } else {
         toast({
          title: "Login Failed",
          description: authError.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } finally {
        setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <KoneLogo className="h-12 w-auto mx-auto mb-6" />
        <CardTitle className="text-3xl font-bold font-headline">KTI Assets Login</CardTitle>
        <CardDescription>Enter your credentials to access the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging in...</> : <><LogIn className="w-4 h-4 mr-2" /> Login</>}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 pt-6">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
