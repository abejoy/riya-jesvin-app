"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Header from "../../components/Header";
import { fetchMemories, checkAuth, logout } from "../../lib/api";
import MemoryList from "../../components/MemoryList";

export default function AdminPage() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth()
      .then((authenticated) => {
        if (!authenticated) {
          router.push("/admin/login");
          return;
        }
        setIsAuth(true);
        return fetchMemories();
      })
      .then((data) => {
        if (data) setMemories(data);
      })
      .catch(() => router.push("/admin/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (!isAuth || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  async function handleLogout() {
    await logout();
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header showLogout={true} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow text-center"
          >
            <div className="text-3xl font-bold text-rose-600">
              {memories.length}
            </div>
            <div className="text-gray-600 text-sm mt-2">Memories</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow text-center"
          >
            <div className="text-3xl font-bold text-rose-600">
              {memories.reduce((sum, m) => sum + m.images.length, 0)}
            </div>
            <div className="text-gray-600 text-sm mt-2">Photos</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link
              href="/admin/memories/new"
              className="block bg-rose-600 text-white p-6 rounded-lg shadow hover:bg-rose-700 transition text-center font-medium"
            >
              + Add Memory
            </Link>
          </motion.div>
        </div>

        {/* Memory List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Memories</h2>
          </div>
          <MemoryList
            memories={memories}
            onUpdate={() => fetchMemories().then(setMemories)}
          />
        </div>

        {/* Valentine Editor Link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Link
            href="/admin/valentine"
            className="block bg-gradient-to-r from-rose-600 to-rose-700 text-white p-6 rounded-lg shadow hover:shadow-lg transition text-center font-medium"
          >
            ❤️ Edit Valentine Message
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
