"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { deleteMemory } from "../lib/api";

export default function MemoryList({ memories, onUpdate }) {
  const [deleting, setDeleting] = useState(null);

  async function handleDelete(id) {
    if (!confirm("Delete this memory? This action cannot be undone.")) return;

    setDeleting(id);
    try {
      await deleteMemory(id);
      onUpdate?.();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    } finally {
      setDeleting(null);
    }
  }

  if (memories.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No memories yet.</p>
        <Link
          href="/admin/memories/new"
          className="text-rose-600 hover:text-rose-700 font-medium"
        >
          Create your first one
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {memories.map((memory) => (
        <motion.div
          key={memory.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 hover:bg-gray-50 transition"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {memory.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {memory.date && (
                  <>
                    {new Date(memory.date).toLocaleDateString()}
                    {memory.location && ` • ${memory.location}`}
                  </>
                )}
              </p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs rounded capitalize">
                  {memory.section.replace("_", " ")}
                </span>
                {memory.images?.length > 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    📸 {memory.images.length}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <Link
                href={`/admin/memories/${memory.id}`}
                className="px-3 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(memory.id)}
                disabled={deleting === memory.id}
                className="px-3 py-2 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200 transition disabled:opacity-50"
              >
                {deleting === memory.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
