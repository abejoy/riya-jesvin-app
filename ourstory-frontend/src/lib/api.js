import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Export API functions
export async function fetchMemories() {
  const response = await apiClient.get("/api/memories");
  return response.data;
}

export async function fetchMemory(id) {
  const response = await apiClient.get(`/api/memories/${id}`);
  return response.data;
}

export async function createMemory(data) {
  const response = await apiClient.post("/api/memories", data);
  return response.data;
}

export async function updateMemory(id, data) {
  const response = await apiClient.put(`/api/memories/${id}`, data);
  return response.data;
}

export async function deleteMemory(id) {
  const response = await apiClient.delete(`/api/memories/${id}`);
  return response.data;
}

export async function fetchValentine() {
  const response = await apiClient.get("/api/valentine");
  return response.data;
}

export async function updateValentine(data) {
  const response = await apiClient.put("/api/valentine", data);
  return response.data;
}

export async function uploadImages(memoryId, files) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await apiClient.post(
    `/uploads/${memoryId}/images`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        return percentCompleted;
      },
    },
  );
  return response.data;
}

export async function deleteImage(memoryId, imageId) {
  const response = await apiClient.delete(
    `/uploads/${memoryId}/images/${imageId}`,
  );
  return response.data;
}

export async function reorderImages(memoryId, order) {
  const response = await apiClient.put(`/uploads/${memoryId}/images/reorder`, {
    order,
  });
  return response.data;
}

export async function login(username, password) {
  const response = await apiClient.post("/api/auth/login", {
    username,
    password,
  });
  if (response.data.token) {
    Cookies.set("token", response.data.token, { expires: 7 });
  }
  return response.data;
}

export async function logout() {
  await apiClient.post("/api/auth/logout");
  Cookies.remove("token");
}

export async function checkAuth() {
  try {
    const response = await apiClient.get("/api/auth/me");
    return !!response.data;
  } catch {
    return false;
  }
}
