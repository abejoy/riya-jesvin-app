"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Timeline from "../components/Timeline";
import Header from "../components/Header";
import { fetchMemories, fetchValentine } from "../lib/api";

export default function Home() {
  const [memories, setMemories] = useState([]);
  const [valentine, setValentine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [memoriesData, valentineData] = await Promise.all([
        fetchMemories(),
        fetchValentine(),
      ]);
      setMemories(memoriesData);
      setValentine(valentineData);
    } catch (err) {
      setError("Failed to load timeline");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
          </div>
          <p className="mt-4 text-gray-500">Loading our story...</p>
        </div>
      </div>
    );
  }

  if (error && memories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <p className="text-gray-500">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main
        className="bg-white relative"
        style={
          memories.length > 0 && memories[0].images?.length > 0
            ? {
                backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url('${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${memories[0].images[0].url}')`,
                backgroundAttachment: "fixed",
                backgroundPosition: "center",
                backgroundSize: "cover",
              }
            : {}
        }
      >
        {/* Hero/Cover Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-rose-50 to-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-2xl"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-rose-600 mb-4">
              Our Story ❤️
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              A timeline of our most beautiful moments together
            </p>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-gray-400 text-lg"
            >
              ↓ Scroll to begin ↓
            </motion.div>
          </motion.div>

          {/* Footer with edit button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-6 left-6 right-6 flex justify-between items-center"
          >
            <div className="text-xs text-gray-400">Forever</div>
            <Link
              href="/admin/login"
              className="text-xs text-gray-400 hover:text-rose-600 transition"
            >
              ✎ Edit
            </Link>
          </motion.div>
        </section>

        {/* Timeline Section */}
        <Timeline memories={memories} />

        {/* Valentine Message Section */}
        {valentine && (
          <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 bg-gradient-to-b from-white to-rose-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-2xl w-full"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-rose-600 mb-6">
                  {valentine.title}
                </h2>
                <div className="text-gray-700 text-lg leading-relaxed mb-8 whitespace-pre-line">
                  {valentine.body}
                </div>
                {valentine.signature && (
                  <p className="text-rose-600 font-semibold italic">
                    {valentine.signature}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Confetti effect on scroll */}
            <ConfettiEffect />

            {/* Replay button */}
            <motion.button
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 1 }}
              viewport={{ once: true }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="mt-12 px-8 py-3 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition"
            >
              Replay from start
            </motion.button>
          </section>
        )}
      </main>
    </>
  );
}

function ConfettiEffect() {
  useEffect(() => {
    const handleConfetti = () => {
      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement("div");
        confetti.className = "confetti";
        confetti.style.left = Math.random() * 100 + "%";
        confetti.style.backgroundColor = ["#e11d48", "#f43f5e", "#fca5ac"][
          Math.floor(Math.random() * 3)
        ];
        confetti.style.animation = `confetti-fall ${2 + Math.random() * 1}s ease-in forwards`;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(handleConfetti, 500);
        }
      },
      { threshold: 0.5 },
    );

    const section = document.querySelector("section:last-of-type");
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return null;
}
