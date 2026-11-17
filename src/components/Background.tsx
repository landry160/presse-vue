/** Fond signature : dégradé, trois orbes lumineuses (en pause quand un élément est affiché) et grain. */
export function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-linear-to-br from-slate-100 via-white to-slate-50 opacity-90 dark:from-slate-950 dark:via-[#0d1422] dark:to-slate-950" />
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="orb orb3" />
      <div className="absolute inset-0 grain" />
    </div>
  );
}
