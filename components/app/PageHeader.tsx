export function PageHeader({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="app-fade">
      <p className="font-raj text-sm font-semibold uppercase tracking-[0.28em] text-white/50">
        {kicker}
      </p>
      <h1 className="mt-2 font-orbitron text-[1.65rem] font-extrabold uppercase tracking-[0.12em] sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-3xl font-exo text-base leading-relaxed text-white/60">
          {description}
        </p>
      ) : null}
    </div>
  );
}
