import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrganizationClient from "./organization-client";

export default async function OrganizationPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role || "EMPLOYEE";
  if (userRole !== "ADMIN" && userRole !== "ASSET_MANAGER") {
    redirect("/dashboard");
  }

  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      include: {
        department: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.department.findMany({
      include: {
        manager: true,
        employees: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <OrganizationClient
      initialUsers={users}
      departments={departments}
    />
  );
}

///this is the comment by the jil
