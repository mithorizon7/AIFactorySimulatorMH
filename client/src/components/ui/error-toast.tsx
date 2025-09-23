import { Copy } from 'lucide-react';
import { Button } from './button';
import { toast } from '@/hooks/use-toast';
import { FrontendError } from '@/lib/logger';

export interface ErrorToastData {
  title: string;
  description: string;
  incidentId?: string;
  variant?: 'destructive' | 'default';
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Show a user-friendly error toast with incident ID
 */
export function showErrorToast(error: Error | FrontendError | string, title?: string): void {
  let errorData: ErrorToastData;
  
  if (typeof error === 'string') {
    errorData = {
      title: title || 'Error',
      description: error,
      variant: 'destructive'
    };
  } else if (error instanceof FrontendError) {
    errorData = {
      title: title || getErrorTitle(error.statusCode),
      description: error.message,
      incidentId: error.incidentId,
      variant: 'destructive'
    };
  } else {
    errorData = {
      title: title || 'Unexpected Error',
      description: 'An unexpected error occurred. Please try again.',
      variant: 'destructive'
    };
  }

  toast({
    title: errorData.title,
    description: (
      <div className="space-y-2">
        <p>{errorData.description}</p>
        {errorData.incidentId && (
          <div className="bg-gray-800 rounded p-2 mt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Incident ID:</p>
                <code className="text-xs text-green-400 font-mono">
                  {errorData.incidentId}
                </code>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(errorData.incidentId!);
                  toast({
                    title: 'Copied!',
                    description: 'Incident ID copied to clipboard',
                    duration: 1500
                  });
                }}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    ),
    variant: errorData.variant,
    duration: errorData.incidentId ? 10000 : 5000 // Show longer if there's an incident ID
  });
}

/**
 * Show a success toast
 */
export function showSuccessToast(message: string, title?: string): void {
  toast({
    title: title || 'Success',
    description: message,
    variant: 'default',
    duration: 3000
  });
}

/**
 * Show a warning toast
 */
export function showWarningToast(message: string, title?: string): void {
  toast({
    title: title || 'Warning',
    description: message,
    variant: 'default',
    duration: 5000
  });
}

/**
 * Show a network error toast with retry action
 */
export function showNetworkErrorToast(retryAction?: () => void): void {
  toast({
    title: 'Connection Problem',
    description: 'Unable to connect to the server. Please check your internet connection.',
    variant: 'destructive',
    duration: 8000,
    action: retryAction ? (
      <Button variant="outline" size="sm" onClick={retryAction}>
        Retry
      </Button>
    ) : undefined
  });
}

/**
 * Get appropriate error title based on status code
 */
function getErrorTitle(statusCode?: number): string {
  switch (statusCode) {
    case 400:
      return 'Invalid Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Access Denied';
    case 404:
      return 'Not Found';
    case 429:
      return 'Too Many Requests';
    case 500:
      return 'Server Error';
    case 503:
      return 'Service Unavailable';
    default:
      return 'Error Occurred';
  }
}