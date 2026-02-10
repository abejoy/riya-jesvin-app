"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { uploadImages, deleteImage } from "../lib/api";

export default function ImageUpload({
  memoryId,
  initialImages = [],
  onImagesChange,
}) {
  const [images, setImages] = useState(initialImages || []);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  async function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length) uploadFiles(files);
  }

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length) uploadFiles(files);
  }

  async function uploadFiles(files) {
    if (!memoryId || memoryId === "new") {
      setError("Please save the memory first before uploading images");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError("");

    try {
      const data = await uploadImages(memoryId, files);
      const newImages = [...images, ...data.images];
      setImages(newImages);
      onImagesChange?.(newImages);
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteImage(imageId) {
    try {
      await deleteImage(memoryId, imageId);
      const newImages = images.filter((img) => img.id !== imageId);
      setImages(newImages);
      onImagesChange?.(newImages);
    } catch (err) {
      setError(err.message || "Failed to delete image");
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {memoryId !== "new" && (
        <motion.div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          whileHover={{ borderColor: "#e11d48" }}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-rose-50 transition"
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="image-input"
          />
          <label htmlFor="image-input" className="cursor-pointer block">
            <div className="text-2xl mb-2">📸</div>
            <p className="font-medium text-gray-900">
              {uploading ? "Uploading..." : "Drag & drop images here"}
            </p>
            <p className="text-sm text-gray-600">or click to select files</p>
          </label>

          {uploading && progress > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-rose-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">{progress}%</p>
            </div>
          )}
        </motion.div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative group"
            >
              <img
                src={`${apiBase}${image.url}`}
                alt="Memory"
                className="w-full aspect-square object-cover rounded-lg"
              />
              <button
                onClick={() => handleDeleteImage(image.id)}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {images.length === 0 && memoryId !== "new" && (
        <p className="text-center text-gray-500 text-sm py-4">No images yet</p>
      )}
      {memoryId === "new" && (
        <p className="text-center text-gray-500 text-sm py-4">
          Save the memory first to upload images
        </p>
      )}
    </div>
  );
}
