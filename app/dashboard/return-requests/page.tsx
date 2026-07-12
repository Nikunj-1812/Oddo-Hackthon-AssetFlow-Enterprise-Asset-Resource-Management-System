/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReturnRequestsClient from "./return-requests-client";

export default async function ReturnRequestsPage() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const user = session.user;
  const role = (user as any).role || "EMPLOYEE";
  const isManager = ["ADMIN", "ASSET_MANAGER"].includes(role);

  // Fetch Return Requests
  const requests = await prisma.returnRequest.findMany({
    where: isManager ? {} : {
      userId: user.id
    },
    include: {
      allocation: {
        include: {
          asset: true,
          user: true
        }
      },
      asset: true,
      user: true,
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
          Equipment Return Requests
        </h1>
        <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
          Submit equipment check-in reviews, process manager approvals, and run return condition checks.
        </p>
      </div>

      <ReturnRequestsClient
        initialRequests={requests}
        isManager={isManager}
      />
    </div>
  );
}
