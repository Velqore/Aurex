"use client";

import React from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
          <div className="text-center p-8">
            <AlertTriangle className="h-16 w-16 text-cyber-red mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-cyber-blue mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-400 mb-6">
              The application encountered an unexpected error. Please try
              refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="cyber-button flex items-center space-x-2 mx-auto"
            >
              <RotateCw className="h-4 w-4" />
              <span>Refresh Page</span>
            </button>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-cyber-blue cursor-pointer mb-2">
                  Error Details
                </summary>
                <pre className="text-xs text-gray-400 bg-cyber-gray p-4 rounded overflow-auto">
                  {this.state.error.message}
                  {"\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;