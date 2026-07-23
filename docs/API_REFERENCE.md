# DigiScale Product Studio API Reference

This document outlines the API endpoints hosted on the FastAPI backend server (`http://localhost:8000`).

---

## 1. Image Processing & Upload

### Upload and Process Image
Processes a raw image, performs AI-powered background removal, and optionally adds a white background.

- **URL:** `/upload`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Form Data Parameters:**
  - `file` (File, required): The image to process (PNG, JPEG, WebP, HEIC/HEIF).
  - `project_id` (string, optional): ID of the collection/project.
  - `white_bg` (boolean, optional): If `true`, applies a white background over the transparent result. Default is `false`.

- **Success Response (200 OK):**
  ```json
  {
    "message": "Image processed successfully",
    "originalImage": "uploads/originals/uuid_orig.png",
    "processedImage": "uploads/processed/uuid_proc.png",
    "imageId": null,
    "creditsRemaining": null
  }
  ```

- **Error Responses:**
  - `400 Bad Request` - No file uploaded or invalid parameters.
  - `500 Internal Server Error` - Failed to save original file or background removal pipeline crashed.

---

## 2. Server Status & Health Check

### Root Welcome Endpoint
Returns a friendly greeting.

- **URL:** `/`
- **Method:** `GET`
- **Success Response (200 OK):**
  ```json
  {
    "message": "Welcome to DigiScale Product Studio API 🚀"
  }
  ```

### Health Check
Validates that the backend FastAPI server and dependencies are active.

- **URL:** `/health`
- **Method:** `GET`
- **Success Response (200 OK):**
  ```json
  {
    "status": "OK",
    "service": "Backend Running"
  }
  ```
