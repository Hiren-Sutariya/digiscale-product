const API_BASE_URL = "http://localhost:8000";

export async function uploadImage(file: File, projectId?: string | null): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  if (projectId) {
    formData.append("project_id", projectId);
  }

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
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
