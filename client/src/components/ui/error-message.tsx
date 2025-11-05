import { AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

export function ErrorMessage({
  title,
  message,
  type = 'error',
  action,
  onDismiss,
}: ErrorMessageProps) {
  const icons = {
    error: XCircle,
    warning: AlertCircle,
    info: Info,
    success: CheckCircle,
  };

  const variants = {
    error: 'destructive',
    warning: 'default',
    info: 'default',
    success: 'default',
  };

  const colors = {
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
    success: 'text-green-600',
  };

  const Icon = icons[type];

  return (
    <Alert variant={variants[type] as any} className="relative">
      <Icon className={`h-4 w-4 ${colors[type]}`} />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription className="flex items-start justify-between gap-4">
        <span className="flex-1">{message}</span>
        {(action || onDismiss) && (
          <div className="flex gap-2 flex-shrink-0">
            {action && (
              <Button
                size="sm"
                variant="outline"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )}
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
              >
                Dismiss
              </Button>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

// User-friendly error messages for common API errors
export function getErrorMessage(error: any): string {
  // Network errors
  if (!error.response) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  const status = error.response?.status;
  const message = error.response?.data?.message || error.message;

  switch (status) {
    case 400:
      return message || "The information provided was invalid. Please check your input and try again.";
    case 401:
      return "Your session has expired. Please log in again to continue.";
    case 403:
      return "You don't have permission to perform this action. Contact your administrator if you believe this is an error.";
    case 404:
      return "The requested resource was not found. It may have been moved or deleted.";
    case 409:
      return message || "This action conflicts with existing data. Please check and try again.";
    case 422:
      return message || "The data provided couldn't be processed. Please check your input.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
      return "Something went wrong on our end. We've been notified and are working to fix it.";
    case 503:
      return "The service is temporarily unavailable. Please try again in a few moments.";
    default:
      return message || "An unexpected error occurred. Please try again or contact support if the problem persists.";
  }
}

// Success messages
export function getSuccessMessage(action: string): string {
  const messages: Record<string, string> = {
    create: "Successfully created! Your changes have been saved.",
    update: "Successfully updated! Your changes have been saved.",
    delete: "Successfully deleted! The item has been removed.",
    save: "Successfully saved! Your changes are now active.",
    send: "Successfully sent! The recipient will receive it shortly.",
    upload: "Successfully uploaded! Your file is now available.",
    download: "Download complete! Check your downloads folder.",
    invite: "Invitation sent! They will receive an email shortly.",
    approve: "Successfully approved! The request has been processed.",
    reject: "Successfully rejected! The request has been declined.",
  };

  return messages[action] || "Success! Your action completed successfully.";
}
