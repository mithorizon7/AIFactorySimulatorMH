import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { logger, FrontendError } from "./logger";
import { toast } from "@/hooks/use-toast";
import { showErrorToast } from "@/components/ui/error-toast";

async function throwIfResNotOk(res: Response, method?: string, url?: string, requestBody?: any) {
  if (!res.ok) {
    let errorData: any;
    let userMessage = 'An unexpected error occurred. Please try again.';
    let incidentId: string | undefined;
    
    try {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await res.json();
        userMessage = errorData.message || userMessage;
        incidentId = errorData.incidentId;
      } else {
        const text = await res.text();
        userMessage = text || res.statusText || userMessage;
      }
    } catch (parseError) {
      // If we can't parse the error response, use default message
      userMessage = `Request failed with status ${res.status}`;
    }
    
    // Log the error with context
    const loggedIncidentId = logger.logApiError(
      method || 'UNKNOWN',
      url || 'UNKNOWN',
      res.status,
      new Error(userMessage),
      requestBody,
      { incidentId }
    );
    
    // Use the incident ID from the response if available, otherwise use the logged one
    const finalIncidentId = incidentId || loggedIncidentId;
    
    throw new FrontendError(userMessage, res.status, finalIncidentId);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res, method, url, data);
    return res;
  } catch (error) {
    // Handle network errors and other fetch failures
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new FrontendError(
        'Unable to connect to the server. Please check your internet connection and try again.',
        0
      );
      logger.logNetworkError(networkError, {
        operation: 'fetch_network_error',
        method,
        url,
        requestBody: data
      });
      throw networkError;
    }
    
    // Re-throw if it's already a FrontendError
    if (error instanceof FrontendError) {
      throw error;
    }
    
    // Handle unexpected errors
    const unexpectedError = new FrontendError(
      'An unexpected error occurred. Please try again.',
      500
    );
    logger.error('Unexpected API request error', error as Error, {
      operation: 'api_request_unexpected_error',
      method,
      url,
      requestBody: data
    });
    throw unexpectedError;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const url = queryKey[0] as string;
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res, 'GET', url);
      return await res.json();
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new FrontendError(
          'Unable to connect to the server. Please check your internet connection and try again.',
          0
        );
        logger.logNetworkError(networkError, {
          operation: 'query_network_error',
          queryKey: queryKey[0]
        });
        throw networkError;
      }
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
