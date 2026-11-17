"use client";

/**
 * Zone éditable pour les écrans tactiles : un appui long dessus fait apparaître « Coller ».
 * Le collage est intercepté globalement (PresseVue) ; ici on se contente de garder la zone vide.
 */
export function PasteZone({ className = "", placeholder, label, children }: {
  className?: string; placeholder?: string; label: string; children?: React.ReactNode;
}) {
  return (
    <div className={`relative ${className}`}>
      {children}
      <div
        data-pastezone
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={label}
        data-placeholder={placeholder}
        onInput={(e) => { e.currentTarget.textContent = ""; }}
        className={placeholder
          ? "field-zone rounded-2xl min-h-[64px] px-4 py-5 text-center text-sm caret-transparent"
          : "absolute inset-0 rounded-2xl text-transparent caret-transparent overflow-hidden"}
      />
    </div>
  );
}
