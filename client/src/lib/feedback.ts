/**
 * Centralized Feedback System
 * 
 * Provides standardized user feedback mechanisms including toasts, 
 * loading states, and error handling. Ensures consistent UX across
 * the entire application.
 */

import { toast } from "@/hooks/use-toast";

export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface FeedbackOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
  id?: string;
}

/**
 * Standardized feedback messages for common actions
 */
export const FEEDBACK_MESSAGES = {
  // Success messages
  SUCCESS: {
    CREATED: 'Created successfully',
    UPDATED: 'Updated successfully',
    DELETED: 'Deleted successfully',
    SAVED: 'Saved successfully',
    SENT: 'Sent successfully',
    COMPLETED: 'Completed successfully',
    APPROVED: 'Approved successfully',
    REJECTED: 'Rejected successfully',
    UPLOADED: 'Uploaded successfully',
    DOWNLOADED: 'Downloaded successfully',
    COPIED: 'Copied to clipboard',
    MOVED: 'Moved successfully',
  },
  
  // Error messages
  ERROR: {
    GENERIC: 'Something went wrong',
    NETWORK: 'Network error occurred',
    VALIDATION: 'Please check your input',
    PERMISSION: 'You don\'t have permission',
    NOT_FOUND: 'Item not found',
    SERVER: 'Server error occurred',
    TIMEOUT: 'Request timed out',
    OFFLINE: 'You appear to be offline',
  },
  
  // Loading messages
  LOADING: {
    GENERIC: 'Loading...',
    SAVING: 'Saving...',
    UPLOADING: 'Uploading...',
    DOWNLOADING: 'Downloading...',
    PROCESSING: 'Processing...',
    SEARCHING: 'Searching...',
  },
  
  // Warning messages
  WARNING: {
    UNSAVED: 'You have unsaved changes',
    DELETE: 'This action cannot be undone',
    LIMITED: 'Limited functionality available',
  },
} as const;

/**
 * Show a toast notification with standardized styling
 */
export const showFeedback = (
  type: FeedbackType,
  options: FeedbackOptions
) => {
  const { title, description, duration, action, persistent } = options;
  
  // Set default duration based on type
  const defaultDuration = {
    success: 4000,
    error: 6000,
    warning: 5000,
    info: 4000,
    loading: persistent ? Infinity : 10000,
  }[type];

  const toastId = options.id || `toast-${Date.now()}`;

  return toast({
    title,
    description,
    duration: duration ?? defaultDuration,
    variant: type === 'error' ? 'destructive' : 'default',
  });
};

/**
 * Convenience methods for different feedback types
 */
export const feedback = {
  success: (options: FeedbackOptions) => showFeedback('success', options),
  error: (options: FeedbackOptions) => showFeedback('error', options),
  warning: (options: FeedbackOptions) => showFeedback('warning', options),
  info: (options: FeedbackOptions) => showFeedback('info', options),
  loading: (options: FeedbackOptions) => showFeedback('loading', options),
};

/**
 * Standardized success feedback for common operations
 */
export const success = {
  created: (item: string) => feedback.success({
    title: FEEDBACK_MESSAGES.SUCCESS.CREATED,
    description: `${item} has been created successfully.`,
  }),
  
  updated: (item: string) => feedback.success({
    title: FEEDBACK_MESSAGES.SUCCESS.UPDATED,
    description: `${item} has been updated successfully.`,
  }),
  
  deleted: (item: string) => feedback.success({
    title: FEEDBACK_MESSAGES.SUCCESS.DELETED,
    description: `${item} has been deleted successfully.`,
  }),
  
  saved: (item: string) => feedback.success({
    title: FEEDBACK_MESSAGES.SUCCESS.SAVED,
    description: `${item} has been saved successfully.`,
  }),
  
  sent: (item: string) => feedback.success({
    title: FEEDBACK_MESSAGES.SUCCESS.SENT,
    description: `${item} has been sent successfully.`,
  }),
  
  uploaded: (item: string) => feedback.success({
    title: FEEDBACK_MESSAGES.SUCCESS.UPLOADED,
    description: `${item} has been uploaded successfully.`,
  }),
  
  copied: () => feedback.success({
    title: FEEDBACK_MESSAGES.SUCCESS.COPIED,
    description: 'Text copied to clipboard.',
    duration: 2000,
  }),
};

/**
 * Standardized error feedback for common errors
 */
export const error = {
  generic: (description?: string) => feedback.error({
    title: FEEDBACK_MESSAGES.ERROR.GENERIC,
    description: description || 'Please try again or contact support if the problem persists.',
  }),
  
  network: () => feedback.error({
    title: FEEDBACK_MESSAGES.ERROR.NETWORK,
    description: 'Please check your internet connection and try again.',
    action: {
      label: 'Retry',
      onClick: () => window.location.reload(),
    },
  }),
  
  validation: (field?: string) => feedback.error({
    title: FEEDBACK_MESSAGES.ERROR.VALIDATION,
    description: field ? `Please check the ${field} field.` : 'Please check your input and try again.',
  }),
  
  permission: () => feedback.error({
    title: FEEDBACK_MESSAGES.ERROR.PERMISSION,
    description: 'You don\'t have permission to perform this action.',
  }),
  
  notFound: (item: string) => feedback.error({
    title: FEEDBACK_MESSAGES.ERROR.NOT_FOUND,
    description: `${item} could not be found.`,
  }),
  
  server: () => feedback.error({
    title: FEEDBACK_MESSAGES.ERROR.SERVER,
    description: 'A server error occurred. Please try again later.',
    action: {
      label: 'Report Issue',
      onClick: () => {
        // Open support email or issue tracker
        window.location.href = 'mailto:support@example.com?subject=Server Error Report';
      },
    },
  }),
  
  offline: () => feedback.error({
    title: FEEDBACK_MESSAGES.ERROR.OFFLINE,
    description: 'You appear to be offline. Some features may not be available.',
    persistent: true,
  }),
};

/**
 * Dismiss all toasts (placeholder - actual dismiss must be done in React components)
 */
export const dismissToast = () => {
  console.log('Toast dismiss requested - use useToast().dismiss() in React components');
};

/**
 * Standardized loading feedback
 */
export const loading = {
  generic: (id?: string) => feedback.loading({
    title: FEEDBACK_MESSAGES.LOADING.GENERIC,
    id,
  }),
  
  saving: (item: string, id?: string) => feedback.loading({
    title: FEEDBACK_MESSAGES.LOADING.SAVING,
    description: `Saving ${item}...`,
    id,
  }),
  
  uploading: (item: string, id?: string) => feedback.loading({
    title: FEEDBACK_MESSAGES.LOADING.UPLOADING,
    description: `Uploading ${item}...`,
    id,
  }),
  
  processing: (item: string, id?: string) => feedback.loading({
    title: FEEDBACK_MESSAGES.LOADING.PROCESSING,
    description: `Processing ${item}...`,
    id,
  }),
  
  dismiss: () => dismissToast(),
};

/**
 * Standardized warning feedback
 */
export const warning = {
  unsaved: () => feedback.warning({
    title: FEEDBACK_MESSAGES.WARNING.UNSAVED,
    description: 'You have unsaved changes that will be lost if you leave this page.',
    action: {
      label: 'Save Changes',
      onClick: () => {
        // Trigger save action - this would be customized per component
        console.log('Save changes triggered');
      },
    },
  }),
  
  delete: (item: string) => feedback.warning({
    title: FEEDBACK_MESSAGES.WARNING.DELETE,
    description: `Are you sure you want to delete this ${item}? This action cannot be undone.`,
    persistent: true,
  }),
};

/**
 * Standardized info feedback
 */
export const info = {
  copied: () => feedback.info({
    title: 'Link Copied',
    description: 'Share link has been copied to your clipboard.',
    duration: 3000,
  }),
  
  feature: (feature: string) => feedback.info({
    title: 'New Feature',
    description: `${feature} is now available!`,
    action: {
      label: 'Learn More',
      onClick: () => {
        // Navigate to help documentation
        window.open('/help', '_blank');
      },
    },
  }),
};

/**
 * Mutation feedback wrapper for TanStack Query
 */
export const createMutationFeedback = <TVariables, TData>(
  mutationName: string,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    loadingMessage?: string;
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
  }
) => {
  const loadingId = `${mutationName}-loading`;
  
  return {
    onMutate: async (variables: TVariables) => {
      if (options?.loadingMessage) {
        loading.generic(loadingId);
      }
      return { variables };
    },
    
    onSuccess: (data: TData, variables: TVariables) => {
      if (options?.successMessage) {
        feedback.success({
          title: options.successMessage,
        });
      } else {
        success.updated(mutationName);
      }
      
      options?.onSuccess?.(data);
    },
    
    onError: (error: Error, variables: TVariables) => {
      if (options?.errorMessage) {
        feedback.error({
          title: options.errorMessage,
          description: error.message,
        });
      } else {
        feedback.error({
          title: 'Error occurred',
          description: error.message,
        });
      }
      
      options?.onError?.(error);
    },
  };
};

/**
 * Progress feedback for long-running operations
 */
export const progress = {
  start: (operation: string, id?: string) => {
    return feedback.loading({
      title: `${operation} in progress...`,
      description: 'This may take a few moments.',
      id,
      persistent: true,
    });
  },
  
  update: (progress: number, id: string) => {
    // Update existing progress toast by dismissing and recreating
    dismissToast();
    feedback.loading({
      title: `Progress: ${Math.round(progress)}%`,
      description: 'Please wait...',
    });
  },
  
  complete: (operation: string, id: string) => {
    dismissToast();
    success.updated(operation);
  },
  
  error: (operation: string, err: Error, id: string) => {
    dismissToast();
    feedback.error({
      title: `${operation} failed`,
      description: err.message,
    });
  },
};

/**
 * Batch operation feedback
 */
export const batch = {
  start: (operation: string, count: number) => {
    return feedback.loading({
      title: `${operation} ${count} items...`,
      description: 'Processing items in batch.',
      persistent: true,
    });
  },
  
  progress: (completed: number, total: number, id: string) => {
    dismissToast();
    feedback.loading({
      title: `Progress: ${completed}/${total} completed`,
      description: `${Math.round((completed / total) * 100)}% complete`,
    });
  },
  
  complete: (operation: string, count: number, id: string) => {
    dismissToast();
    feedback.success({
      title: 'Batch Operation Complete',
      description: `${count} items ${operation.toLowerCase()} successfully.`,
    });
  },
  
  error: (operation: string, errors: string[], id: string) => {
    dismissToast();
    feedback.error({
      title: 'Batch Operation Failed',
      description: `${errors.length} items failed to ${operation.toLowerCase()}.`,
      action: {
        label: 'View Details',
        onClick: () => {
          console.log('Batch errors:', errors);
        },
      },
    });
  },
};

// Export the main feedback system
export default {
  feedback,
  success,
  error,
  warning,
  info,
  loading,
  progress,
  batch,
  createMutationFeedback,
  FEEDBACK_MESSAGES,
};
