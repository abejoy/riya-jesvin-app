"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { checkAuth, fetchValentine, updateValentine } from "../../../lib/api";

export default function ValentinePage() {
  const [valentine, setValentine] = useState({
    title: "",
    body: "",
    signature: "",
    typedEffect: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    checkAuth()
      .then((isAuth) => {
        if (!isAuth) {
          router.push("/admin/login");
          return;
        }
        return fetchValentine();
      })
      .then((data) => {
        if (data) {
          setValentine(data);
        }
      })
      .catch(() => router.push("/admin/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await updateValentine(valentine);
      alert("Valentine message updated!");
    } catch (err) {
      setError(err.message || "Failed to update");
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
            ❤️ Valentine Message
          </h1>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={valentine.title}
              onChange={(e) =>
                setValentine({ ...valentine, title: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
              placeholder="e.g., Happy Valentine's ❤️"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={valentine.body}
              onChange={(e) =>
                setValentine({ ...valentine, body: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600 h-40"
              placeholder="Your love message..."
            />
          </div>

          {/* Signature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Signature
            </label>
            <input
              type="text"
              value={valentine.signature}
              onChange={(e) =>
                setValentine({ ...valentine, signature: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
              placeholder="e.g., — Forever yours"
            />
          </div>

          {/* Typed Effect */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="typedEffect"
              checked={valentine.typedEffect}
              onChange={(e) =>
                setValentine({ ...valentine, typedEffect: e.target.checked })
              }
              className="w-4 h-4 text-rose-600 rounded focus:ring-2 focus:ring-rose-600"
            />
            <label
              htmlFor="typedEffect"
              className="text-sm font-medium text-gray-700"
            >
              Enable typing animation
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Message"}
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
