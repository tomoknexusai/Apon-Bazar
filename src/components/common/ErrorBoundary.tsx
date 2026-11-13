/**
 * Enterprise Global React Error Boundary Component
 * Prevents blank white screens and provides instant error recovery.
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught React ErrorBoundary Exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetAndReload = (): void => {
    try {
      window.location.href = window.location.origin + window.location.pathname;
    } catch (e) {
      window.location.reload();
    }
  };

  private handleClearDataAndReload = (): void => {
    try {
      localStorage.removeItem('gb_bd_is_logged_in');
      localStorage.removeItem('gb_bd_active_role');
      window.location.href = window.location.origin + window.location.pathname;
    } catch (e) {
      window.location.reload();
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4 text-neutral-900 dark:text-neutral-100 font-sans">
          <div className="max-w-md w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-fade-in">
            
            <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                সাময়িক ত্রুটি দেখা দিয়েছে
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                অ্যাপ্লিকেশনটি লোড করার সময় একটি অপ্রত্যাশিত সিস্টেম ত্রুটি ঘটেছে। অনুগ্রহ করে পেজটি রিফ্রেশ করুন বা হোম পেজে ফিরে যান।
              </p>
            </div>

            {this.state.error && (
              <div className="bg-neutral-100 dark:bg-neutral-800/80 p-3 rounded-xl text-left border border-neutral-200 dark:border-neutral-700">
                <p className="text-[10px] font-mono text-red-600 dark:text-red-400 font-bold overflow-x-auto whitespace-pre-wrap break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>পেজ রিফ্রেশ করুন (Reload Page)</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearDataAndReload}
                className="w-full py-2.5 px-4 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>হোম পেজে ফিরে যান (Go to Home)</span>
              </button>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-center gap-1.5 text-[10px] text-neutral-400">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
              <span>Apon Bazar নিরাপদ ফলব্যাক সিস্টেম সক্রিয় রয়েছে</span>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
