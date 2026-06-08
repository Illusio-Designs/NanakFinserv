"use client";
import { useEffect, useState } from "react";
import { API_URL, BASE_URL } from "@/lib/api";
import EmptyState from "@/components/ui/EmptyState";
import { FileText } from "lucide-react";

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/public/blog/list`);
        const json = await res.json();
        setPosts(json?.data || []);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-[32px] font-bold tracking-tight text-brand-700">Blog</h1>
        <p className="mt-2 text-[15px] text-muted">Recent insights & updates from Nanak Finserv.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-64 rounded-lg" />)}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState icon={FileText} title="No posts yet" subtitle="Check back soon for updates." />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => {
            const img = p.image || p.thumbnail || p.banner;
            const title = p.title || p.heading || "Untitled";
            const desc = (p.description || p.content || p.shortDescription || "").replace(/<[^>]+>/g, "").slice(0, 140);
            return (
              <article key={p.id || p.blog_id || i} className="ui-card overflow-hidden p-0 transition-shadow hover:shadow-pop">
                {img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img.startsWith("http") ? img : `${BASE_URL}/${img}`} alt={title} className="h-44 w-full object-cover" />
                )}
                <div className="p-5">
                  <h3 className="text-[16px] font-semibold text-ink line-clamp-2">{title}</h3>
                  {desc && <p className="mt-2 text-[13px] text-muted">{desc}…</p>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
