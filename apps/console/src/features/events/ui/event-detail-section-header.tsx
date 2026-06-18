export function EventDetailSectionHeader({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="border-border flex min-h-9 items-center justify-between gap-3 border-b px-3 py-2">
      <h3 className="text-xs font-semibold">{title}</h3>
      {meta ? <span className="text-muted-foreground text-[11px]">{meta}</span> : null}
    </div>
  );
}
