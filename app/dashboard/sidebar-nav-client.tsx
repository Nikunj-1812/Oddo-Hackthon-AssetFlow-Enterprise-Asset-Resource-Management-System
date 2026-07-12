"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  CalendarDays,
  Wrench,
  ClipboardCheck,
  Building2,
  FileBarChart,
  Activity,
} from "lucide-react";

interface SidebarLink {
  href: string;
  label: string;
  iconName: string;
  section?: string;
}

interface Props {
  links: SidebarLink[];
  sections: string[];
}

const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard,
  Boxes,
  CalendarDays,
  Wrench,
  ClipboardCheck,
  Building2,
  FileBarChart,
  Activity,
};

export default function SidebarNavClient({ links, sections }: Props) {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      {sections.map((section) => (
        <div key={section} className="space-y-1">
          <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 px-3">
            {section}
          </div>
          <div className="space-y-0.5">
            {links
              .filter((l) => l.section === section)
              .map((link) => {
                const Icon = iconMap[link.iconName] || Boxes;
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/dashboard" && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                      isActive
                        ? "bg-[#6ecfa3]/15 text-[#1a4a2e]"
                        : "text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#111827]"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={isActive ? "text-[#207a4a]" : "text-[#9CA3AF] group-hover:text-[#111827] transition-colors"}
                    />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
          </div>
        </div>
      ))}
    </nav>
  );
}
