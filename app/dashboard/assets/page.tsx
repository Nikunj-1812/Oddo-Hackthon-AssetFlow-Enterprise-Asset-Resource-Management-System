import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AssetsClient from "./assets-client";

export default async function AssetsPage() {
  const session = await auth();
  const user = session?.user;
  const role = (user as any)?.role || "EMPLOYEE";
  const canManage = role === "ADMIN" || role === "ASSET_MANAGER";

  // Fetch initial directory parameters
  const [assets, categories] = await Promise.all([
    prisma.asset.findMany({
      include: {
        category: true,
        allocations: {
          include: { user: true },
          where: { status: "APPROVED" },
          take: 1,
        },
      },
      orderBy: { tag: "asc" },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
            Asset Directory
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
            Track and search all physical and shared resources, check conditions, and monitor lifecycles.
          </p>
        </div>
      </div>

      <AssetsClient
        initialAssets={assets}
        categories={categories}
        canManage={canManage}
      />
    </div>
  );
}
