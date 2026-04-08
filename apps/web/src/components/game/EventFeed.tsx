export function EventFeed({ text }: { text: string }) {
  return (
    <article className="rounded-[2rem] border border-stone-300/70 bg-white/85 p-5 shadow-sm backdrop-blur">
      <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Current Echo</p>
      <p className="mt-3 text-base leading-8 text-stone-700">{text}</p>
    </article>
  );
}
