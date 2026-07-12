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
    <nav className="erp-sidebar-nav">
      {sections.map((section) => (
        <div key={section}>
          <div className="erp-nav-section-label">{section}</div>
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
                  className={`erp-nav-link ${isActive ? "active" : ""}`}
                  id={`nav-${link.href.replace(/\//g, "-")}`}
                >
                  <Icon size={16} className="nav-icon" />
                  <span className="erp-nav-link-label">{link.label}</span>
                </Link>
              );
            })}
        </div>
      ))}
    </nav>
  );
}
