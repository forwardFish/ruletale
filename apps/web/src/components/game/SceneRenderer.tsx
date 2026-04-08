import type { SceneView } from "@/lib/types/game";

export function SceneRenderer({ scene }: { scene: SceneView }) {
  return (
    <section className="rounded-[2.4rem] border border-stone-300/70 bg-white/80 p-6 shadow-sm backdrop-blur">
      <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Current Scene</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">{scene.title}</h1>
      <p className="mt-5 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">{scene.description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {scene.visible_objects.map((item) => (
          <span key={item} className="rounded-full bg-stone-100 px-3 py-1.5 text-sm text-stone-700">
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
