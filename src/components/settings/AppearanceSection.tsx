import { THEME_OPTIONS } from "@/app/settings/constants";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  theme: string | undefined;
  onThemeChange: (theme: string) => void;
};

export function AppearanceSection({ theme, onThemeChange }: Props) {
  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-base font-semibold">Appearance & Theme</h2>

      <div className="grid grid-cols-3 gap-3">
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
          const isActive = theme === value;
          return (
            <Card
              key={value}
              data-testid={`theme-${value}`}
              className={cn(
                "cursor-pointer transition-[color,box-shadow,border-color] duration-200",
                isActive
                  ? "border-method-accent ring-2 ring-method-accent/30"
                  : "hover:border-method-accent/50",
              )}
              onClick={() => onThemeChange(value)}
            >
              <CardContent className="flex flex-col items-center gap-2 py-4">
                <Icon
                  className={cn("h-6 w-6", isActive && "text-method-accent")}
                />
                <span className="text-xs font-medium">{label}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
