import Link from "next/link";
import {
  SETTINGS_SECTIONS,
  type SettingsSection,
} from "@/app/settings/constants";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

type Props = {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
};

export function SettingsNav({ activeSection, onSectionChange }: Props) {
  return (
    <nav className="w-52 shrink-0 border-r p-4">
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="mt-3 text-lg font-semibold">Settings</h1>
      </div>

      <div className="space-y-0.5">
        {SETTINGS_SECTIONS.map(([id, label]) => (
          <button
            key={id}
            data-testid={`nav-${id}`}
            type="button"
            onClick={() => onSectionChange(id)}
            className={cn(
              "flex w-full items-center rounded px-3 py-2 text-sm transition-colors",
              activeSection === id
                ? "border-l-2 border-l-method-accent bg-method-accent/10 pl-[calc(0.75rem-2px)] text-method-accent font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
