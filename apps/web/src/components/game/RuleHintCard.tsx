export function RuleHintCard({
  title,
  body,
  subtle,
}: {
  title: string;
  body: string;
  subtle?: boolean;
}) {
  return (
    <article
      className={`rounded-3xl border p-4 shadow-sm ${
        subtle
          ? "border-stone-300/70 bg-white/70 text-stone-600"
          : "border-rose-200/80 bg-rose-50/70 text-stone-700"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.3em] text-stone-400">{title}</p>
      <p className="mt-2 text-sm leading-6">{body}</p>
    </article>
  );
}
