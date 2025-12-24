// Utility function to extract error message from API response
export const getErrorMessage = (error: any): string => {
  if (!error.response?.data) {
    return error.message || 'An unexpected error occurred';
  }

  const errorData = error.response.data;
  
  // Check for different error message formats
  if (errorData.message) {
    return errorData.message;
  }
  
  if (errorData.error) {
    return errorData.error;
  }
  
  // Fallback to HTTP status text
  return error.response.statusText || 'An error occurred';
};

// Get full error details for development
export const getErrorDetails = (error: any) => {
  if (!error.response?.data) {
    return { message: error.message || 'An unexpected error occurred' };
  }

  const errorData = error.response.data;
  
  return {
    message: getErrorMessage(error),
    correlationId: errorData.correlationId || errorData.correlation_id,
    status: error.response.status,
    statusText: error.response.statusText,
    url: error.config?.url,
    method: error.config?.method,
  };
};
