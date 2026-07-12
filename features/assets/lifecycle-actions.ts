"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

/**
 * Ensures user is authenticated and has required role.
 */
async function verifyUser(allowedRoles?: string[]) {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    throw new Error("Unauthorized: Please sign in again.");
  }
  const user = session.user as any;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error("Forbidden: You do not have permission for this action.");
  }
  return user;
}

/**
 * Fallback-safe history logger. Writes to database even if Prisma Client lacks type cache.
 */
async function createHistoryEntry(
  tx: any,
  assetId: string,
  userId: string,
  userName: string | null,
  action: string,
  description: string,
  prevStatus?: string,
  nextStatus?: string
) {
  if (tx.assetHistory) {
    await tx.assetHistory.create({
      data: { assetId, userId, userName, action, description, prevStatus, nextStatus }
    });
  } else {
    try {
      await tx.$executeRawUnsafe(
        `INSERT INTO "AssetHistory" (id, "assetId", "userId", "userName", action, description, "prevStatus", "nextStatus", timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        crypto.randomUUID(),
        assetId,
        userId,
        userName || "",
        action,
        description,
        prevStatus || null,
        nextStatus || null
      );
    } catch (err) {
      console.error("Failed to run raw INSERT into AssetHistory:", err);
    }
  }
}

/**
 * Lifecycle state transitions mapping.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  PURCHASED: ["REGISTERED", "RETIRED"],
  REGISTERED: ["AVAILABLE", "RETIRED"],
  AVAILABLE: ["RESERVED", "ALLOCATED", "UNDER_MAINTENANCE", "RETIRED"],
  RESERVED: ["AVAILABLE", "ALLOCATED", "UNDER_MAINTENANCE"],
  ALLOCATED: ["AVAILABLE", "UNDER_MAINTENANCE", "RETIRED", "LOST"],
  UNDER_MAINTENANCE: ["AVAILABLE", "RETIRED"],
  LOST: ["AVAILABLE", "RETIRED", "DISPOSED"],
  RETIRED: ["DISPOSED", "AVAILABLE"],
  DISPOSED: [] // Terminal state
};

/**
 * Transitions an asset to a new lifecycle state.
 */
export async function transitionAssetStatus(assetId: string, nextStatus: string, comment: string = "") {
  try {
    const user = await verifyUser(["ADMIN", "ASSET_MANAGER"]);
    
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return { error: "Asset not found." };

    const currentStatus = asset.status;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus) && user.role !== "ADMIN") {
      return { error: `Invalid transition: Cannot move from ${currentStatus} to ${nextStatus}.` };
    }

    await prisma.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id: assetId },
        data: { status: nextStatus as any }
      });
      await createHistoryEntry(tx, assetId, user.id, user.name, "STATUS_CHANGE", `Transitioned status. ${comment}`, currentStatus, nextStatus);
    });

    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to transition status." };
  }
}

/**
 * Calculates asset depreciation dynamically.
 */
export async function getAssetDepreciationData(assetId: string) {
  try {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return { error: "Asset not found." };

    const cost = asset.cost || 0;
    const method = (asset as any).depreciationMethod || "STRAIGHT_LINE";
    const rate = (asset as any).depreciationRate || 10; // 10% default
    const acqDate = new Date(asset.acquisitionDate || new Date());
    const years = Math.max(0, (new Date().getTime() - acqDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

    let currentValue = cost;
    let depreciatedValue = 0;

    if (method === "STRAIGHT_LINE") {
      depreciatedValue = cost * (rate / 100) * years;
      currentValue = Math.max(0, cost - depreciatedValue);
    } else {
      // Reducing Balance
      currentValue = cost * Math.pow(1 - (rate / 100), years);
      currentValue = Math.max(0, currentValue);
      depreciatedValue = cost - currentValue;
    }

    // Generate trend chart projection data
    const chartData = [];
    for (let i = 0; i <= 5; i++) {
      let val = cost;
      if (method === "STRAIGHT_LINE") {
        val = Math.max(0, cost - (cost * (rate / 100) * i));
      } else {
        val = Math.max(0, cost * Math.pow(1 - (rate / 100), i));
      }
      chartData.push({
        year: acqDate.getFullYear() + i,
        value: Math.round(val),
        depreciated: Math.round(cost - val)
      });
    }

    return {
      success: true,
      originalCost: cost,
      currentValue: Math.round(currentValue),
      depreciatedValue: Math.round(depreciatedValue),
      depreciationRate: rate,
      depreciationMethod: method,
      chartData
    };
  } catch (err: any) {
    return { error: err.message || "Depreciation calculation failed." };
  }
}

/**
 * Updates comprehensive warranty, vendor, and purchase properties.
 */
export async function updateAssetProfileDetails(assetId: string, formData: FormData) {
  try {
    const user = await verifyUser(["ADMIN", "ASSET_MANAGER"]);

    const updateData: any = {};

    // Warranty
    const warrantyStart = formData.get("warrantyStart") ? new Date(formData.get("warrantyStart") as string) : null;
    const warrantyEnd = formData.get("warrantyEnd") ? new Date(formData.get("warrantyEnd") as string) : null;
    if (warrantyStart && isNaN(warrantyStart.getTime())) return { error: "Invalid warranty start date." };
    if (warrantyEnd && isNaN(warrantyEnd.getTime())) return { error: "Invalid warranty end date." };

    updateData.warrantyStart = warrantyStart;
    updateData.warrantyEnd = warrantyEnd;
    updateData.warrantyProvider = formData.get("warrantyProvider") as string || null;
    updateData.warrantyNumber = formData.get("warrantyNumber") as string || null;

    // Vendor
    updateData.vendorName = formData.get("vendorName") as string || null;
    updateData.vendorContact = formData.get("vendorContact") as string || null;
    updateData.vendorEmail = formData.get("vendorEmail") as string || null;
    updateData.vendorPhone = formData.get("vendorPhone") as string || null;
    updateData.poNumber = formData.get("poNumber") as string || null;
    updateData.invoiceNumber = formData.get("invoiceNumber") as string || null;
    updateData.purchaseSource = formData.get("purchaseSource") as string || null;

    // Purchase & Value
    updateData.purchasePrice = formData.get("purchasePrice") ? parseFloat(formData.get("purchasePrice") as string) : null;
    updateData.currentValue = formData.get("currentValue") ? parseFloat(formData.get("currentValue") as string) : null;
    updateData.acquisitionMethod = formData.get("acquisitionMethod") as string || null;
    updateData.fundingSource = formData.get("fundingSource") as string || null;
    updateData.currency = formData.get("currency") as string || "INR";
    updateData.tax = formData.get("tax") ? parseFloat(formData.get("tax") as string) : 0.0;

    // Depreciation
    updateData.depreciationMethod = formData.get("depreciationMethod") as string || null;
    updateData.depreciationRate = formData.get("depreciationRate") ? parseFloat(formData.get("depreciationRate") as string) : null;

    await prisma.asset.update({
      where: { id: assetId },
      data: updateData
    });

    await createHistoryEntry(prisma, assetId, user.id, user.name, "PROFILE_UPDATE", "Updated warranty, vendor, and purchase parameters.");

    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update profile details." };
  }
}

/**
 * Retirement approval flow.
 */
export async function retireAssetAction(assetId: string, reason: string) {
  try {
    const user = await verifyUser(["ADMIN", "ASSET_MANAGER"]);
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return { error: "Asset not found." };

    await prisma.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id: assetId },
        data: { status: "RETIRED" }
      });
      await createHistoryEntry(tx, assetId, user.id, user.name, "RETIRED", `Asset retired. Reason: ${reason}`, asset.status, "RETIRED");
    });

    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to retire asset." };
  }
}

/**
 * Disposal execution workflow.
 */
export async function disposeAssetAction(assetId: string, reason: string, method: string) {
  try {
    const user = await verifyUser(["ADMIN", "ASSET_MANAGER"]);
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return { error: "Asset not found." };

    await prisma.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id: assetId },
        data: {
          status: "DISPOSED",
          disposalReason: reason,
          disposalMethod: method,
          disposedById: user.id,
          disposedDate: new Date()
        } as any
      });
      await createHistoryEntry(tx, assetId, user.id, user.name, "DISPOSED", `Asset disposed via ${method}. Reason: ${reason}`, asset.status, "DISPOSED");
    });

    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to dispose asset." };
  }
}

/**
 * Handles simulated document uploads.
 */
export async function addAssetDocument(assetId: string, name: string, url: string, type: string) {
  try {
    const user = await verifyUser(["ADMIN", "ASSET_MANAGER"]);
    const id = crypto.randomUUID();

    if (prisma.assetDocument) {
      await (prisma as any).assetDocument.create({
        data: { id, assetId, name, url, type }
      });
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "AssetDocument" (id, "assetId", name, url, type, "createdAt") VALUES ($1, $2, $3, $4, $5, NOW())`,
        id, assetId, name, url, type
      );
    }

    await createHistoryEntry(prisma, assetId, user.id, user.name, "DOCUMENT_ADDED", `Added document: ${name} (${type})`);
    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to add document." };
  }
}

/**
 * Deletes document records.
 */
export async function deleteAssetDocument(docId: string, assetId: string) {
  try {
    const user = await verifyUser(["ADMIN", "ASSET_MANAGER"]);

    if (prisma.assetDocument) {
      await (prisma as any).assetDocument.delete({ where: { id: docId } });
    } else {
      await prisma.$executeRawUnsafe(`DELETE FROM "AssetDocument" WHERE id = $1`, docId);
    }

    await createHistoryEntry(prisma, assetId, user.id, user.name, "DOCUMENT_DELETED", `Removed document ${docId}`);
    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to delete document." };
  }
}

/**
 * Handles simulated image uploads.
 */
export async function addAssetImage(assetId: string, url: string, isPrimary: boolean = false) {
  try {
    const user = await verifyUser(["ADMIN", "ASSET_MANAGER"]);
    const id = crypto.randomUUID();

    if (isPrimary) {
      if (prisma.assetImage) {
        await (prisma as any).assetImage.updateMany({
          where: { assetId },
          data: { isPrimary: false }
        });
      } else {
        await prisma.$executeRawUnsafe(`UPDATE "AssetImage" SET "isPrimary" = false WHERE "assetId" = $1`, assetId);
      }
    }

    if (prisma.assetImage) {
      await (prisma as any).assetImage.create({
        data: { id, assetId, url, isPrimary }
      });
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "AssetImage" (id, "assetId", url, "isPrimary", "createdAt") VALUES ($1, $2, $3, $4, NOW())`,
        id, assetId, url, isPrimary
      );
    }

    await createHistoryEntry(prisma, assetId, user.id, user.name, "IMAGE_ADDED", "Added image to gallery");
    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to add image." };
  }
}

/**
 * Fetch timeline and auxiliary profile objects.
 */
export async function getAssetProfileTimeline(assetId: string) {
  try {
    let historyList: any[] = [];
    let docsList: any[] = [];
    let imagesList: any[] = [];

    if ((prisma as any).assetHistory) {
      historyList = await (prisma as any).assetHistory.findMany({ where: { assetId }, orderBy: { timestamp: "desc" } });
    } else {
      try {
        historyList = await prisma.$queryRawUnsafe(`SELECT * FROM "AssetHistory" WHERE "assetId" = $1 ORDER BY timestamp DESC`, assetId);
      } catch {}
    }

    if ((prisma as any).assetDocument) {
      docsList = await (prisma as any).assetDocument.findMany({ where: { assetId }, orderBy: { createdAt: "desc" } });
    } else {
      try {
        docsList = await prisma.$queryRawUnsafe(`SELECT * FROM "AssetDocument" WHERE "assetId" = $1 ORDER BY "createdAt" DESC`, assetId);
      } catch {}
    }

    if ((prisma as any).assetImage) {
      imagesList = await (prisma as any).assetImage.findMany({ where: { assetId }, orderBy: { createdAt: "desc" } });
    } else {
      try {
        imagesList = await prisma.$queryRawUnsafe(`SELECT * FROM "AssetImage" WHERE "assetId" = $1 ORDER BY "createdAt" DESC`, assetId);
      } catch {}
    }

    return {
      success: true,
      timeline: historyList,
      documents: docsList,
      images: imagesList
    };
  } catch (err: any) {
    return { error: err.message || "Failed to load timeline parameters." };
  }
}
