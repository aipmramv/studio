import React, { useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState<{
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
  } | null>(null);

  const showToast = (message: {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  return { toast, showToast };
}
