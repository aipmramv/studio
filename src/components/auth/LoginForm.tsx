// src/components/auth/LoginForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AtSign, Lock, LogIn, Briefcase, Loader2 } from "lucide-react";
import * as React from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, type AuthError, type User } from "firebase/auth";
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

  const ensureAdminUserDocument = async (user: User) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, "users", user.uid);
    // Overwrite the user document to ensure the role is admin.
    await setDoc(userDocRef, {
        id: user.uid,
        email: user.email,
        role: 'admin',
        displayName: user.email === 'aipm.ramv@gmail.com' ? 'Ram Kumar V' : (user.email === 'admin@example.com' ? 'Default Admin' : user.displayName),
        department: 'IT'
    }, { merge: true });
  };

  async function onSubmit(data: LoginFormData) {
    setLoading(true);
    
    try {
      // Try simple authentication first (for admin users)
      const simpleAuthResponse = await fetch('/api/auth/simple-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });
      
      if (simpleAuthResponse.ok) {
        const authResult = await simpleAuthResponse.json();
        if (authResult.success) {
          // Store session info (in production, use proper session management)
          localStorage.setItem('user', JSON.stringify(authResult.user));
          localStorage.setItem('token', authResult.token);
          
          toast({
            title: "Login Successful",
            description: `Welcome back, ${authResult.user.displayName}!`,
          });
          router.push("/dashboard");
          return;
        }
      }
      
      // If simple auth fails, try Firebase authentication
      try {
        const auth = getAuth();
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        
        // If sign-in is successful, ensure the user document exists
        const isAdminEmail = data.email === 'admin@example.com' || data.email === 'aipm.ramv@gmail.com';
        if (isAdminEmail) {
          await ensureAdminUserDocument(userCredential.user);
        }
        
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        router.push("/dashboard");
        return;
      } catch (firebaseError) {
        console.warn('Firebase authentication failed:', firebaseError);
      }
      
      // If both methods fail
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });

    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "An error occurred during login. Please try again.",
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
