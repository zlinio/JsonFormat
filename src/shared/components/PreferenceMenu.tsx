import { useEffect, useId, useRef, useState } from "react";
import type { ComponentProps } from "react";
import { Icon } from "./Icon";

interface Props<T extends string> {
  label: string;
  icon: ComponentProps<typeof Icon>["name"];
  value: T;
  choices: { value: T; label: string; lang?: string }[];
  onChange: (value: T) => void;
}

export function PreferenceMenu<T extends string>({ label, icon, value, choices, onChange }: Props<T>) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return <div className="preference-switcher" ref={root}>
    <button ref={trigger} type="button" className="icon-button" aria-label={label} title={label}
      aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => setOpen(current => !current)}><Icon name={icon} /></button>
    {open && <div id={id} className="preference-menu" role="menu" aria-label={label}
      onKeyDown={event => {
        if (event.key === "Tab") { setOpen(false); return; }
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === "ArrowDown" ? (index + 1) % items.length
          : event.key === "ArrowUp" ? (index + items.length - 1) % items.length
          : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : -1;
        if (next >= 0) { event.preventDefault(); items[next]?.focus(); }
      }}>
      {choices.map(choice => <button key={choice.value} type="button" role="menuitemradio"
        aria-checked={value === choice.value} lang={choice.lang} tabIndex={value === choice.value ? 0 : -1}
        onClick={() => { onChange(choice.value); setOpen(false); trigger.current?.focus(); }}>
        <span>{choice.label}</span>
        {value === choice.value && <Icon name="check" width={15} height={15} />}
      </button>)}
    </div>}
  </div>;
}
