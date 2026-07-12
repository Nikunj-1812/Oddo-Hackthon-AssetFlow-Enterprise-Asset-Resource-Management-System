import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createDepartment,
  createCategory,
  promoteUser,
} from "@/features/organization/actions";
import OrganizationTabsClient from "./tabs-client";

export default async function OrganizationPage() {
  const session = await auth();

  // Enforce ADMIN role verification at route level
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch directory data
  const [departments, categories, employees] = await Promise.all([
    prisma.department.findMany({
      include: { manager: true, parent: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      include: { department: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
          Organization Setup
        </h1>
        <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
          Manage corporate structure, asset classifications, and promote employees to active roles.
        </p>
      </div>

      <OrganizationTabsClient
        departments={departments}
        categories={categories}
        employees={employees}
      />
    </div>
  );
}
