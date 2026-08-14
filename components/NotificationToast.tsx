'use client';

import React from 'react';
import { ToastMessage } from '@/hooks/use5w2h';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface NotificationToastProps {
  toast: ToastMessage | null;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toast }) => {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-destructive shrink-0" />,
    info: <Info className="w-5 h-5 text-info shrink-0" />,
  };

  const borderColors = {
    success: 'border-l-primary',
    error: 'border-l-destructive',
    info: 'border-l-info',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-200">
      <div className={`bg-card border-l-4 ${borderColors[toast.type]} border border-border p-4 shadow-2xl flex items-start gap-3`}>
        {icons[toast.type]}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            {toast.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed font-body-md">
            {toast.message}
          </p>
        </div>
      </div>
    </div>
  );
};

