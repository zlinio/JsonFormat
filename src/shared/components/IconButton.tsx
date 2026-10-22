import type { ComponentProps } from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type Props = Omit<ComponentProps<typeof Button>, "variant" | "size"> & { label: string };

export function IconButton({ label, className, children, ...props }: Props) {
  return <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label={label}
        className={cn("[&_svg:not([class*='size-'])]:size-[18px]", className)} {...props}>
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom">{label}</TooltipContent>
  </Tooltip>;
}
