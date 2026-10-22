import {
  ArrowLeft, ArrowRight, Braces, Check, Copy, Download, FoldVertical,
  Languages, Moon, ShieldCheck, Sun, Trash2, TriangleAlert, UnfoldVertical,
  WrapText, X,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

const icons = {
  back: ArrowLeft, braces: Braces, language: Languages, copy: Copy,
  download: Download, trash: Trash2, check: Check, shield: ShieldCheck,
  sun: Sun, moon: Moon, arrow: ArrowRight, wrap: WrapText,
  unfold: UnfoldVertical, fold: FoldVertical, alert: TriangleAlert, close: X,
} as const;

export function Icon({ name, ...props }: LucideProps & { name: keyof typeof icons }) {
  const Component = icons[name];
  return <Component width={18} height={18} strokeWidth={1.65} aria-hidden="true" {...props} />;
}
