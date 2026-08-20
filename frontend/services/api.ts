const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return `http://${window.location.hostname}:8000`;
    }
  }
  return "https://digiscale-backend-j8zz.onrender.com";
};
const API_BASE_URL = getApiBaseUrl();
import { getCache, setCache, clearCache } from "@/lib/cache";

// Helper to get auth header
function getAuthHeader(): Record<string, string> {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

// Authenticated fetch wrapper
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...options.headers,
    ...getAuthHeader(),
  };
  return fetch(url, { ...options, headers });
}

export function clearDigiscaleCache(): void {
  // Clear shared in-memory cache
  clearCache();

  if (typeof window !== "undefined") {
    localStorage.removeItem("digiscale_cached_user_id");
    localStorage.removeItem("digiscale_cached_collections");
    localStorage.removeItem("digiscale_cached_all_products");
    localStorage.removeItem("digiscale_cached_warehouse_rows");
    localStorage.removeItem("digiscale_cached_warehouse_slots");
    localStorage.removeItem("digiscale_cached_warehouse_assignments");
  }
}

export async function login(email: string, password: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Login failed.");
  }

  const data = await response.json();
  if (typeof window !== "undefined") {
    clearDigiscaleCache();
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user_name", data.user_name);
    localStorage.setItem("user_email", data.user_email);
    document.cookie = `token=${data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }
  return data;
}

export async function signup(name: string, email: string, password: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Signup failed.");
  }

  const data = await response.json();
  if (typeof window !== "undefined") {
    clearDigiscaleCache();
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user_name", data.user_name);
    localStorage.setItem("user_email", data.user_email);
    document.cookie = `token=${data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }
  return data;
}

export function logout(): void {
  if (typeof window !== "undefined") {
    clearDigiscaleCache();
    localStorage.removeItem("token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

export async function uploadImage(file: File, projectId?: number | null, autoRemove: boolean = false): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  if (projectId !== undefined && projectId !== null) {
    formData.append("project_id", projectId.toString());
  }
  formData.append("auto_remove", autoRemove ? "true" : "false");

  const headers = { ...getAuthHeader() };
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    let errMsg = "Image upload failed.";
    if (err && err.detail) {
      if (typeof err.detail === "string") {
        errMsg = err.detail;
      } else if (Array.isArray(err.detail)) {
        errMsg = err.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
      } else {
        errMsg = JSON.stringify(err.detail);
      }
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export async function getImageStatus(projectId: number, imageId: number): Promise<any> {
  const headers = { ...getAuthHeader() };
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/images/${imageId}/status`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch image status");
  }

  return response.json();
}

export async function getUserProfile(forceFetch: boolean = false): Promise<any> {
  if (!forceFetch && getCache("profile")) return getCache("profile");
  
  const response = await authFetch(`${API_BASE_URL}/users/me`);
  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.location.href = "/login";
      }
      return null;
    }
    throw new Error("Failed to fetch user profile.");
  }
  const data = await response.json();
  setCache("profile", data);
  if (typeof window !== "undefined") {
    localStorage.setItem("digiscale_profile", JSON.stringify(data));
  }
  return data;
}

export async function getUserSettings(forceFetch: boolean = false): Promise<any> {
  if (!forceFetch && getCache("settings")) return getCache("settings");

  const response = await authFetch(`${API_BASE_URL}/settings/`);
  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }
    throw new Error("Failed to fetch user settings.");
  }
  const data = await response.json();
  setCache("settings", data);
  if (typeof window !== "undefined") {
    localStorage.setItem("digiscale_settings", JSON.stringify(data));
  }
  return data;
}

export async function updateUserSettings(data: any): Promise<any> {
  const response = await authFetch(`${API_BASE_URL}/settings/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update user settings.");
  }
  const result = await response.json();
  setCache("settings", result);
  if (typeof window !== "undefined") {
    localStorage.setItem("digiscale_settings", JSON.stringify(result));
  }
  return result;
}


export async function updateUserProfile(name: string, email: string): Promise<any> {
  const response = await authFetch(`${API_BASE_URL}/users/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  if (!response.ok) {
    throw new Error("Failed to update profile.");
  }
  const result = await response.json();
  setCache("profile", result);
  return result;
}

export async function deleteAccount(): Promise<any> {
  const response = await authFetch(`${API_BASE_URL}/users/me`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to schedule account deletion.");
  }
  return response.json();
}

export async function changePassword(current_password: string, new_password: string): Promise<any> {
  const response = await authFetch(`${API_BASE_URL}/users/me/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_password, new_password }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Failed to change password.");
  }
  return response.json();
}



export function formatUserUuid(userId: any): string | null {
  if (!userId) return null;
  const idStr = userId.toString().trim();
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (uuidRegex.test(idStr)) {
    return idStr;
  }
  const paddedId = idStr.padStart(12, "0");
  return `00000000-0000-0000-0000-${paddedId}`;
}

export async function listUsers(): Promise<any> {
  const response = await authFetch(`${API_BASE_URL}/users/list`);
  if (!response.ok) {
    throw new Error("Failed to fetch user list.");
  }
  return response.json();
}

export async function createUser(data: any): Promise<any> {
  const response = await authFetch(`${API_BASE_URL}/users/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Failed to create user.");
  }
  return response.json();
}

export async function updateUser(userId: number, data: any): Promise<any> {
  const response = await authFetch(`${API_BASE_URL}/users/update/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Failed to update user.");
  }
  return response.json();
}

export async function deleteUser(userId: number): Promise<any> {
  const response = await authFetch(`${API_BASE_URL}/users/delete/${userId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Failed to delete user.");
  }
  return response.json();
}
