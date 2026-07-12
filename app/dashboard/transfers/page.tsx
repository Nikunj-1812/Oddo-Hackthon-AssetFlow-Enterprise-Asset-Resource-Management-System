import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TransfersClient from "./transfers-client";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Transfer Requests | AssetFlow",
};

export default async function TransfersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as any;

  // Fetch Transfer Requests based on RBAC
  let whereClause = {};
  if (user.role === "EMPLOYEE") {
    // Employees see requests they made or are receiving, or their current assets being transferred away
    whereClause = {
      OR: [
        { requestedById: user.id },
        { requestedHolderId: user.id },
        { currentHolderId: user.id }
      ]
    };
  } else if (user.role === "DEPARTMENT_HEAD") {
    // Dept heads see their dept's incoming/outgoing requests + their own
    if (user.departmentId) {
       whereClause = {
         OR: [
           { requestedDepartmentId: user.departmentId },
           { currentHolder: { departmentId: user.departmentId } },
           { requestedHolder: { departmentId: user.departmentId } },
           { requestedById: user.id }
         ]
       };
    } else {
       whereClause = { requestedById: user.id };
    }
  }
  // ASSET_MANAGER and ADMIN see everything (empty whereClause)

  const rawTransfers = await (prisma as any).transferRequest?.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      asset: true,
      requestedBy: { select: { id: true, name: true, email: true, role: true } },
      currentHolder: { select: { id: true, name: true, department: { select: { name: true } } } },
      requestedHolder: { select: { id: true, name: true, department: { select: { name: true } } } },
      requestedDepartment: { select: { id: true, name: true } }
    }
  }) || [];

  // Fetch only ALLOCATED assets that the user currently holds if they are an Employee,
  // or all ALLOCATED assets if they are Admin/Manager
  let assetWhere: any = { status: "ALLOCATED" };
  if (user.role === "EMPLOYEE") {
    assetWhere = {
      status: "ALLOCATED",
      allocations: { some: { userId: user.id, actualReturnDate: null } }
    };
  } else if (user.role === "DEPARTMENT_HEAD" && user.departmentId) {
    assetWhere = {
      status: "ALLOCATED",
      allocations: { some: { user: { departmentId: user.departmentId }, actualReturnDate: null } }
    };
  }
  
  const rawAssets = await prisma.asset.findMany({
    where: assetWhere,
    include: {
      allocations: {
        where: { actualReturnDate: null },
        include: { user: true, department: true }
      }
    }
  });

  const rawUsers = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, departmentId: true, role: true, email: true }
  });

  const rawDepartments = await prisma.department.findMany({
    select: { id: true, name: true }
  });

  // Serialize dates for Client Component
  const serializeDates = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) return obj.map(serializeDates);
    if (typeof obj === "object") {
      return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, serializeDates(v)]));
    }
    return obj;
  };

  const transfers = serializeDates(rawTransfers);
  const assets = serializeDates(rawAssets);
  const users = serializeDates(rawUsers);
  const departments = serializeDates(rawDepartments);

  return (
    <TransfersClient 
      initialTransfers={transfers}
      assets={assets}
      users={users}
      departments={departments}
      currentUser={user as any}
    />
  );
}
