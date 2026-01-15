/**
 * API Routes Helper
 * 
 * This file provides helper functions for making API calls
 * if you decide to add server-side API routes later.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'An error occurred',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Upload and analyze resume via API endpoint
 * (This would be used if you create a server-side API route)
 */
export async function apiAnalyzeResume(
  file: File,
  metadata: {
    jobTitle?: string;
    jobDescription?: string;
    companyName?: string;
  },
  token: string
): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append('resume', file);
  formData.append('metadata', JSON.stringify(metadata));

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Analysis failed',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Get user's resumes via API
 */
export async function apiGetResumes(token: string): Promise<ApiResponse> {
  return apiFetch('/api/resumes', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Get specific resume with analysis
 */
export async function apiGetResume(
  resumeId: string,
  token: string
): Promise<ApiResponse> {
  return apiFetch(`/api/resumes/${resumeId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Delete a resume
 */
export async function apiDeleteResume(
  resumeId: string,
  token: string
): Promise<ApiResponse> {
  return apiFetch(`/api/resumes/${resumeId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Get user subscription info
 */
export async function apiGetSubscription(token: string): Promise<ApiResponse> {
  return apiFetch('/api/subscription', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Update subscription plan
 */
export async function apiUpdateSubscription(
  planType: string,
  token: string
): Promise<ApiResponse> {
  return apiFetch('/api/subscription', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ planType }),
  });
}

// Export all API functions
export const api = {
  analyzeResume: apiAnalyzeResume,
  getResumes: apiGetResumes,
  getResume: apiGetResume,
  deleteResume: apiDeleteResume,
  getSubscription: apiGetSubscription,
  updateSubscription: apiUpdateSubscription,
};
