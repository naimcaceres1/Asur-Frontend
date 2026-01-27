"use client";

import { useThemeConfig } from "./active-theme";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BASE_THEMES = [
  { name: "Default", value: "default" },
  { name: "Azul", value: "azul" },
  { name: "Amarillo", value: "amarillo" },
  { name: "Rojo", value: "rojo" },
];

const SCALED_THEMES = [
  { name: "Default", value: "default-scaled" },
  { name: "Azul", value: "azul-scaled" },
  { name: "Amarillo", value: "amarillo-scaled" },
  { name: "Rojo", value: "rojo-scaled" },
];

export function ThemeSelector() {
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const currentValue = activeTheme || "default";

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="theme-selector" className="sr-only">
        Theme
      </Label>
      <Select value={currentValue} onValueChange={setActiveTheme}>
        <SelectTrigger
          id="theme-selector"
          size="sm"
          className="justify-start min-w-[220px] sm:min-w-[260px]"
        >
          <span className="text-muted-foreground hidden sm:block">
            Selecciona tema:
          </span>
          <span className="text-muted-foreground block sm:hidden">
            Theme
          </span>
          <SelectValue placeholder="Selecciona tema" />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            <SelectLabel>Base</SelectLabel>
            {BASE_THEMES.map((theme) => (
              <SelectItem key={theme.value} value={theme.value}>
                {theme.name}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Escalado</SelectLabel>
            {SCALED_THEMES.map((theme) => (
              <SelectItem key={theme.value} value={theme.value}>
                {theme.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
