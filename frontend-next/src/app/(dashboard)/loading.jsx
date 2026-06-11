export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-8 w-52 rounded-lg" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-[78px] rounded-lg" />)}
      </div>
      <div className="skeleton h-64 rounded-lg" />
    </div>
  );
}
