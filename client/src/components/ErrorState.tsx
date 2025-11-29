/**
 * ErrorState Component
 * 
 * UX Principle: Helpful error messages with clear recovery options
 * Never leave users stuck - always provide a way forward
 */

import React from 'react';
import { AlertCircle, RefreshCw, Home, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showSupport?: boolean;
  variant?: 'card' | 'alert' | 'inline';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "We couldn't complete your request. Please try again.",
  error,
  onRetry,
  onGoHome,
  showSupport = true,
  variant = 'card'
}) => {
  const handleContactSupport = () => {
    // Open help center or support chat
    window.open('/help', '_blank');
  };

  const errorDetails = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
    ? error 
    : undefined;

  // Inline variant for small errors
  if (variant === 'inline') {
    return (
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-900">{title}</p>
          <p className="text-sm text-red-700 mt-1">{message}</p>
          {onRetry && (
            <Button 
              onClick={onRetry} 
              size="sm" 
              variant="outline" 
              className="mt-2 text-red-700 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Alert variant for warnings
  if (variant === 'alert') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">
          {message}
          {errorDetails && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs opacity-75">Technical details</summary>
              <pre className="mt-1 text-xs opacity-75 whitespace-pre-wrap">
                {errorDetails}
              </pre>
            </details>
          )}
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <Button onClick={onRetry} size="sm" variant="outline">
                <RefreshCw className="w-3 h-3 mr-1" />
                Try Again
              </Button>
            )}
            {showSupport && (
              <Button onClick={handleContactSupport} size="sm" variant="ghost">
                <HelpCircle className="w-3 h-3 mr-1" />
                Get Help
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Card variant for full page errors
  return (
    <Card className="border-red-200">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="mb-4 rounded-full bg-red-100 p-6">
          <AlertCircle className="w-12 h-12 text-red-600" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-6 max-w-md">
          {message}
        </p>
        
        {errorDetails && (
          <details className="mb-6 text-left max-w-md w-full">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
              Technical details
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-auto max-h-40">
              {errorDetails}
            </pre>
          </details>
        )}
        
        <div className="flex gap-3">
          {onRetry && (
            <Button onClick={onRetry} size="lg">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          
          {onGoHome && (
            <Button onClick={onGoHome} variant="outline" size="lg">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          )}
          
          {showSupport && (
            <Button onClick={handleContactSupport} variant="ghost" size="lg">
              <HelpCircle className="w-4 h-4 mr-2" />
              Get Help
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Usage examples:

// Full page error
// <ErrorState
//   title="Couldn't load patients"
//   message="We had trouble connecting to the database. Please check your connection and try again."
//   onRetry={() => refetch()}
//   onGoHome={() => navigate('/')}
// />

// Inline error
// <ErrorState
//   variant="inline"
//   title="Save failed"
//   message="Check all required fields and try again"
//   onRetry={() => handleSubmit()}
// />

// Alert error
// <ErrorState
//   variant="alert"
//   title="Session expired"
//   message="Please log in again to continue"
//   showSupport={false}
// />
