const API_BASE_URL = "http://localhost:8000";

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
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user_name", data.user_name);
    localStorage.setItem("user_email", data.user_email);
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
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user_name", data.user_name);
    localStorage.setItem("user_email", data.user_email);
  }
  return data;
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
  }
}

export async function uploadImage(file: File, projectId?: number | null): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  if (projectId !== undefined && projectId !== null) {
    formData.append("project_id", projectId.toString());
  }

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

export async function getUserProfile(): Promise<any> {
  const response = await authFetch(`${API_BASE_URL}/users/me`);
  if (!response.ok) {
    throw new Error("Failed to fetch user profile.");
  }
  return response.json();
}

export async function getProjects(): Promise<any> {
  const response = await authFetch(`${API_BASE_URL}/projects`);
  if (!response.ok) {
    throw new Error("Failed to fetch projects.");
  }
  return response.json();
}

export async function createProject(name: string): Promise<any> {
  const response = await authFetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error("Failed to create project.");
  }
  return response.json();
}

export async function getProject(projectId: number): Promise<any> {
  const response = await authFetch(`${API_BASE_URL}/projects/${projectId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch project details.");
  }
  return response.json();
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
  return response.json();
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

export async function deleteProject(projectId: number): Promise<any> {
  const response = await authFetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete project.");
  }
  return response.json();
}

export async function renameProject(projectId: number, name: string): Promise<any> {
  const response = await authFetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error("Failed to rename project.");
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
