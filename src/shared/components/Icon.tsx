import type { SVGProps } from "react";

const paths = {
  back: "M20 12H4m6-6-6 6 6 6",
  braces: "M9 3H7a2 2 0 0 0-2 2v4a3 3 0 0 1-2 3 3 3 0 0 1 2 3v4a2 2 0 0 0 2 2h2M15 3h2a2 2 0 0 1 2 2v4a3 3 0 0 0 2 3 3 3 0 0 0-2 3v4a2 2 0 0 1-2 2h-2",
  language: "M3 5h12M9 3v2M5 5c0 5 4 9 8 11M13 5c0 5-4 9-10 11M13 21l4-11 4 11m-6.5-4h5",
  copy: "M9 9h11v11H9z M15 9V4H4v11h5",
  download: "M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7m4-7v7",
  check: "m5 12 4 4L19 6",
  shield: "M12 3 4 6v6c0 4 4 7 8 9 4-2 8-5 8-9V6z m-4 9 3 3 5-6",
  sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  moon: "M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  wrap: "M4 6h16M4 11h12a4 4 0 0 1 0 8h-4m3-3-3 3 3 3M4 17h3",
  unfold: "m8 7 4-4 4 4M4 10h16M4 14h16m-12 3 4 4 4-4",
  fold: "m8 3 4 4 4-4M4 10h16M4 14h16m-12 7 4-4 4 4",
  alert: "M12 3 2 21h20zM12 9v5m0 3v.5",
  close: "m6 6 12 12M6 18 18 6",
} as const;

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: keyof typeof paths }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
