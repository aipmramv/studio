// src/components/auth/LoginForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Use next/navigation for App Router
import { AtSign, Lock, LogIn, Briefcase } from "lucide-react"; // Added Briefcase for KONE SSO example

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
import { useAuth } from "@/hooks/useAuth"; // Mock auth hook
import { KoneLogo } from "@/components/shared/KoneLogo"; // Import KONE Logo

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, loading } = useAuth(); // Using mock login

  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    try {
      await login(/*data.email, data.password*/); // Mock login doesn't need params
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push("/dashboard"); // Redirect to dashboard after successful login
    } catch (error) {
      toast({
        title: "Login Failed",
        description: (error as Error).message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  }

  async function handleKoneSsoLogin() {
    try {
      await login(); // Mock login doesn't need specific params for SSO
      toast({
        title: "Login Successful",
        description: "Signed in with KONE SSO (mocked).",
      });
      router.push("/dashboard");
    } catch (error) {
      toast({
        title: "KONE SSO Login Failed",
        description: (error as Error).message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="w-full max-w-md"> {/* Removed shadow-2xl for KONE's flatter design */}
      <CardHeader className="text-center">
        <KoneLogo className="h-12 w-auto mx-auto mb-6" /> {/* KONE Logo Added */}
        <CardTitle className="text-3xl font-bold font-headline">KTI Assets Login</CardTitle>
        <CardDescription>Enter your credentials or sign in with KONE SSO.</CardDescription>
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
              {loading ? "Logging in..." : <><LogIn className="w-4 h-4 mr-2" /> Login</>}
            </Button>
          </form>
        </Form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={handleKoneSsoLogin} disabled={loading}>
           <Briefcase className="w-4 h-4" /> {/* Example icon for SSO */}
          Sign in with KONE SSO
        </Button>

      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 pt-6">
        <Link href="#" className="text-sm text-primary hover:underline">
            Forgot password?
        </Link>
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
