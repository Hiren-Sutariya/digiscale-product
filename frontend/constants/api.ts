const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return `http://${window.location.hostname}:8000`;
    }
  }
  return "https://digiscale-backend-j8zz.onrender.com";
};
export const API_BASE_URL = getApiBaseUrl();