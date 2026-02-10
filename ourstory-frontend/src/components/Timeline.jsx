"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Timeline({ memories }) {
  const containerRef = useRef(null);
  const [visibleIds, setVisibleIds] = useState(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleIds((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.3 },
    );

    const elements = containerRef.current?.querySelectorAll("[data-memory-id]");
    elements?.forEach((el) => observer.observe(el));

    return () => {
      elements?.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  if (memories.length === 0) {
    return (
      <section className="py-20 text-center">
        <p className="text-gray-500">
          No memories yet. Add your first one in admin!
        </p>
      </section>
    );
  }

  return (
    <section ref={containerRef} className="relative py-20 px-4">
      {/* Timeline spine */}
      <div className="timeline-spine" />

      {/* Memories */}
      <div className="relative z-5 max-w-4xl mx-auto">
        {memories.map((memory, index) => {
          const isVisible = visibleIds.has(memory.id);

          return (
            <motion.div
              key={memory.id}
              id={memory.id}
              data-memory-id={memory.id}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={`mb-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-start ${
                index % 2 === 0 ? "md:grid-flow-dense" : ""
              }`}
            >
              {/* Timeline dot */}
              <div className="timeline-dot hidden md:block absolute left-1/2 -ml-2" />

              {/* Content */}
              <motion.div
                className={`relative ${index % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}
                initial={{ opacity: 0, x: index % 2 === 0 ? 20 : -20 }}
                animate={
                  isVisible
                    ? { opacity: 1, x: 0 }
                    : { opacity: 0, x: index % 2 === 0 ? 20 : -20 }
                }
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition p-6">
                  {memory.date && (
                    <span className="inline-block px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-semibold mb-3">
                      {new Date(memory.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  )}

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {memory.title}
                  </h3>

                  {memory.location && (
                    <p className="text-sm text-gray-500 mb-2">
                      📍 {memory.location}
                    </p>
                  )}

                  <p className="text-gray-700 mb-4 whitespace-pre-line leading-relaxed">
                    {memory.body}
                  </p>

                  {memory.images && memory.images.length > 0 && (
                    <ImageCarousel images={memory.images} />
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function ImageCarousel({ images }) {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (images.length === 0) return null;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  return (
    <>
      <div className="carousel-container mt-4">
        <motion.img
          key={current}
          src={`${apiBase}${images[current].url}`}
          alt={images[current].alt || "Memory photo"}
          className="carousel-image cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setLightboxOpen(true)}
        />

        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrent((current - 1 + images.length) % images.length)
              }
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition z-10"
            >
              ←
            </button>
            <button
              onClick={() => setCurrent((current + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition z-10"
            >
              →
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition ${
                    i === current ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {lightboxOpen && (
        <motion.div
          className="lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setLightboxOpen(false)}
        >
          <motion.img
            src={`${apiBase}${images[current].url}`}
            alt={images[current].alt || "Memory photo"}
            className="lightbox-image"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition"
          >
            ✕
          </button>
        </motion.div>
      )}
    </>
  );
}
