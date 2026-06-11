"use client";
import { useEffect, useState } from "react";
import { API_URL, BASE_URL } from "@/lib/api";
import EmptyState from "@/components/ui/EmptyState";
import { FileText } from "lucide-react";
import { TiltCard, ScrollReveal, StaggerReveal, RevealItem, FloatingOrbs } from "@/components/public/Motion3D";

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
    <div className="relative overflow-hidden">
      <FloatingOrbs className="opacity-60" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <h1 className="text-[34px] font-bold tracking-tight text-ink">Insights & <span className="text-gradient">updates</span></h1>
            <p className="mt-2 text-[15px] text-muted">Recent insights & updates from Nanak Finserv.</p>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-64 rounded-lg" />)}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState icon={FileText} title="No posts yet" subtitle="Check back soon for updates." />
        ) : (
          <StaggerReveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" gap={0.08}>
            {posts.map((p, i) => {
              const img = p.image || p.thumbnail || p.banner;
              const title = p.title || p.heading || "Untitled";
              const desc = (p.description || p.content || p.shortDescription || "").replace(/<[^>]+>/g, "").slice(0, 140);
              return (
                <RevealItem key={p.id || p.blog_id || i}>
                  <TiltCard className="ui-card h-full overflow-hidden p-0" max={7}>
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.startsWith("http") ? img : `${BASE_URL}/${img}`} alt={title} className="h-44 w-full object-cover" />
                    )}
                    <div className="p-5">
                      <h3 className="text-[16px] font-semibold text-ink line-clamp-2">{title}</h3>
                      {desc && <p className="mt-2 text-[13px] text-muted">{desc}…</p>}
                    </div>
                  </TiltCard>
                </RevealItem>
              );
            })}
          </StaggerReveal>
        )}
      </div>
    </div>
  );
}
