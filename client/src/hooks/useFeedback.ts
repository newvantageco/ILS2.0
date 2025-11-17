/**
 * useFeedback Hook
 * 
 * Provides a convenient hook for accessing the feedback system
 * with additional component-specific utilities.
 */

import { useCallback } from 'react';
import { 
  feedback, 
  success, 
  error, 
  warning, 
  info, 
  loading, 
  progress, 
  batch,
  createMutationFeedback,
  type FeedbackOptions 
} from '@/lib/feedback';

export const useFeedback = () => {
  // Basic feedback methods
  const showSuccess = useCallback((options: FeedbackOptions) => {
    return feedback.success(options);
  }, []);

  const showError = useCallback((options: FeedbackOptions) => {
    return feedback.error(options);
  }, []);

  const showWarning = useCallback((options: FeedbackOptions) => {
    return feedback.warning(options);
  }, []);

  const showInfo = useCallback((options: FeedbackOptions) => {
    return feedback.info(options);
  }, []);

  const showLoading = useCallback((options: FeedbackOptions) => {
    return feedback.loading(options);
  }, []);

  // Standardized success messages
  const notifyCreated = useCallback((item: string) => {
    return success.created(item);
  }, []);

  const notifyUpdated = useCallback((item: string) => {
    return success.updated(item);
  }, []);

  const notifyDeleted = useCallback((item: string) => {
    return success.deleted(item);
  }, []);

  const notifySaved = useCallback((item: string) => {
    return success.saved(item);
  }, []);

  const notifyCopied = useCallback(() => {
    return success.copied();
  }, []);

  // Standardized error messages
  const notifyError = useCallback((description?: string) => {
    return error.generic(description);
  }, []);

  const notifyNetworkError = useCallback(() => {
    return error.network();
  }, []);

  const notifyValidationError = useCallback((field?: string) => {
    return error.validation(field);
  }, []);

  const notifyPermissionError = useCallback(() => {
    return error.permission();
  }, []);

  const notifyNotFoundError = useCallback((item: string) => {
    return error.notFound(item);
  }, []);

  const notifyServerError = useCallback(() => {
    return error.server();
  }, []);

  const notifyOfflineError = useCallback(() => {
    return error.offline();
  }, []);

  // Loading states
  const showLoadingState = useCallback((id?: string) => {
    return loading.generic(id);
  }, []);

  const showSavingState = useCallback((item: string, id?: string) => {
    return loading.saving(item, id);
  }, []);

  const showUploadingState = useCallback((item: string, id?: string) => {
    return loading.uploading(item, id);
  }, []);

  const dismissLoading = useCallback(() => {
    return loading.dismiss();
  }, []);

  // Progress feedback
  const startProgress = useCallback((operation: string, id?: string) => {
    return progress.start(operation, id);
  }, []);

  const updateProgress = useCallback((progressValue: number, id: string) => {
    return progress.update(progressValue, id);
  }, []);

  const completeProgress = useCallback((operation: string, id: string) => {
    return progress.complete(operation, id);
  }, []);

  const errorProgress = useCallback((operation: string, err: Error, id: string) => {
    return progress.error(operation, err, id);
  }, []);

  // Batch operations
  const startBatch = useCallback((operation: string, count: number) => {
    return batch.start(operation, count);
  }, []);

  const updateBatch = useCallback((completed: number, total: number, id: string) => {
    return batch.progress(completed, total, id);
  }, []);

  const completeBatch = useCallback((operation: string, count: number, id: string) => {
    return batch.complete(operation, count, id);
  }, []);

  const errorBatch = useCallback((operation: string, errors: string[], id: string) => {
    return batch.error(operation, errors, id);
  }, []);

  // Mutation feedback helper
  const createMutationHandlers = useCallback(createMutationFeedback, []);

  // Utility for async operations with automatic feedback
  const withFeedback = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      loading?: string;
      success?: string;
      error?: string;
    } = {}
  ): Promise<T | null> => {
    const loadingId = `operation-${Date.now()}`;
    
    try {
      if (options.loading) {
        showLoadingState(loadingId);
      }

      const result = await operation();
      
      if (options.success) {
        showSuccess({ title: options.success });
      }
      
      return result;
    } catch (err) {
      const error = err as Error;
      
      if (options.error) {
        showError({ title: options.error, description: error.message });
      } else {
        notifyError(error.message);
      }
      
      return null;
    } finally {
      dismissLoading();
    }
  }, [showLoadingState, showSuccess, showError, notifyError, dismissLoading]);

  // Form feedback utilities
  const form = {
    success: (message: string) => showSuccess({ title: message }),
    error: (message: string, description?: string) => showError({ title: message, description }),
    warning: (message: string) => showWarning({ title: message }),
    info: (message: string) => showInfo({ title: message }),
    validation: (field: string) => notifyValidationError(field),
    saved: (entity: string) => notifySaved(entity),
  };

  // API feedback utilities
  const api = {
    success: (action: string, item: string) => showSuccess({ 
      title: `${action} successful`, 
      description: `${item} has been ${action.toLowerCase()}.` 
    }),
    error: (action: string, error: Error) => showError({ 
      title: `${action} failed`, 
      description: error.message 
    }),
    networkError: () => notifyNetworkError(),
    serverError: () => notifyServerError(),
    notFound: (item: string) => notifyNotFoundError(item),
  };

  return {
    // Basic methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    
    // Standardized messages
    notifyCreated,
    notifyUpdated,
    notifyDeleted,
    notifySaved,
    notifyCopied,
    notifyError,
    notifyNetworkError,
    notifyValidationError,
    notifyPermissionError,
    notifyNotFoundError,
    notifyServerError,
    notifyOfflineError,
    
    // Loading states
    showLoadingState,
    showSavingState,
    showUploadingState,
    dismissLoading,
    
    // Progress
    startProgress,
    updateProgress,
    completeProgress,
    errorProgress,
    
    // Batch
    startBatch,
    updateBatch,
    completeBatch,
    errorBatch,
    
    // Helpers
    createMutationHandlers,
    withFeedback,
    
    // Specialized feedback
    form,
    api,
  };
};

export default useFeedback;