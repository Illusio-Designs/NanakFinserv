import { cn } from "@/lib/cn";

export default function Avatar({ name = "", size = 40, className }) {
  const initials = name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full bg-brand-600 font-semibold text-white", className)}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  );
}
