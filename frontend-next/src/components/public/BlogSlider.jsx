"use client";
import { useEffect, useState } from "react";
import { API_URL, BASE_URL } from "@/lib/api";

export default function BlogSlider({ title = "Recent Blogs" }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/public/blog/list`);
        const json = await res.json();
        setPosts((json?.data || []).slice(0, 6));
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <h2 className="mb-8 text-center text-[24px] font-bold tracking-tight text-brand-700">{title}</h2>
      <div className="flex snap-x gap-5 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
        {(loading ? [...Array(3)] : posts).map((p, i) => {
          if (loading) return <div key={i} className="skeleton h-64 w-72 shrink-0 rounded-lg sm:w-auto" />;
          const img = p.image || p.thumbnail || p.banner;
          const t = p.title || p.heading || "Untitled";
          const desc = (p.description || p.content || "").replace(/<[^>]+>/g, "").slice(0, 120);
          return (
            <article key={p.id || p.blog_id || i} className="ui-card w-72 shrink-0 snap-start overflow-hidden p-0 transition-shadow hover:shadow-pop sm:w-auto">
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.startsWith("http") ? img : `${BASE_URL}/${img}`} alt={t} className="h-40 w-full object-cover" />
              )}
              <div className="p-5">
                <h3 className="text-[15px] font-semibold text-ink line-clamp-2">{t}</h3>
                {desc && <p className="mt-2 text-[13px] text-muted">{desc}…</p>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
