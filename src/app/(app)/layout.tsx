// src/app/(app)/layout.tsx
"use client";

import { AppLayoutBase } from "@/components/layout/AppLayoutBase";

export default function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayoutBase>{children}</AppLayoutBase>;
}
