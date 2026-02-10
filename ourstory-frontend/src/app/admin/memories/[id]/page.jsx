"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  checkAuth,
  fetchMemories,
  createMemory,
  updateMemory,
} from "../../../../lib/api";
import ImageUpload from "../../../../components/ImageUpload";

const SECTIONS = [
  { value: "first_meeting", label: "First Meeting" },
  { value: "first_date", label: "First Date" },
  { value: "trips", label: "Trips" },
  { value: "engagement", label: "Engagement" },
  { value: "wedding", label: "Wedding" },
  { value: "inside_jokes", label: "Inside Jokes" },
  { value: "other", label: "Other" },
];

export default function MemoryEditorPage() {
  const params = useParams();
  const memoryId = params?.id;
  const isNew = memoryId === "new";

  const [memory, setMemory] = useState({
    title: "",
    date: "",
    section: "other",
    body: "",
    location: "",
    images: [],
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const loadMemory = async () => {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/admin/login");
        return;
      }

      if (!isNew && memoryId) {
        const memories = await fetchMemories();
        const found = memories.find((m) => m.id === memoryId);
        if (found) {
          setMemory(found);
        }
      }

      setLoading(false);
    };

    loadMemory().catch(() => router.push("/admin/login"));
  }, []); // Empty dependency array - only run on mount

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (isNew) {
        await createMemory(memory);
      } else {
        await updateMemory(memoryId, memory);
      }
      router.push("/admin");
    } catch (err) {
      setError(err.message || "Failed to save memory");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/admin"
            className="text-rose-600 hover:text-rose-700 font-medium"
          >
            ← Back
          </Link>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-6 space-y-6"
        >
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? "New Memory" : "Edit Memory"}
          </h1>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={memory.title}
              onChange={(e) => setMemory({ ...memory, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
              placeholder="e.g., First Date"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date (YYYY-MM-DD)
            </label>
            <input
              type="date"
              value={memory.date}
              onChange={(e) => setMemory({ ...memory, date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
            />
          </div>

          {/* Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section *
            </label>
            <select
              value={memory.section}
              onChange={(e) =>
                setMemory({ ...memory, section: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
              required
            >
              {SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={memory.location}
              onChange={(e) =>
                setMemory({ ...memory, location: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
              placeholder="e.g., Paris"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={memory.body}
              onChange={(e) => setMemory({ ...memory, body: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600 h-32"
              placeholder="Tell the story..."
              required
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos
            </label>
            <ImageUpload
              memoryId={memoryId}
              initialImages={memory.images}
              onImagesChange={(newImages) =>
                setMemory({ ...memory, images: newImages })
              }
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Memory"}
            </button>
            <Link
              href="/admin"
              className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition text-center"
            >
              Cancel
            </Link>
          </div>
        </motion.form>
      </main>
    </div>
  );
}
