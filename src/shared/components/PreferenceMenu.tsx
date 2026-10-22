import type { ComponentProps } from "react";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Props<T extends string> {
  label: string;
  icon: ComponentProps<typeof Icon>["name"];
  value: T;
  choices: { value: T; label: string; lang?: string }[];
  onChange: (value: T) => void;
}

export function PreferenceMenu<T extends string>({ label, icon, value, choices, onChange }: Props<T>) {
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <IconButton label={label}><Icon name={icon} /></IconButton>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" sideOffset={8} collisionPadding={12} aria-label={label} className="w-44 border-border">
      <DropdownMenuRadioGroup value={value} onValueChange={next => {
        const choice = choices.find(item => item.value === next);
        if (choice) onChange(choice.value);
      }}>
        {choices.map(choice => <DropdownMenuRadioItem key={choice.value} value={choice.value}
          lang={choice.lang} className="min-h-9 cursor-pointer text-xs data-[state=checked]:text-primary">
          {choice.label}
        </DropdownMenuRadioItem>)}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}
