/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { AssetStatus, Condition } from "@prisma/client";

async function verifyCanManageAssets() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized: Please sign in again.");
  }
  
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "ASSET_MANAGER") {
    throw new Error("Access denied. Asset Manager or Admin permissions required.");
  }
  return session.user;
}

export async function registerAsset(formData: FormData) {
  try {
    const user = await verifyCanManageAssets();
    
    const name = formData.get("name") as string;
    const categoryId = formData.get("categoryId") as string;
    const serialNumber = formData.get("serialNumber") as string || null;
    const cost = Number(formData.get("cost")) || 0;
    
    const acqDateStr = formData.get("acquisitionDate") as string;
    const acquisitionDate = acqDateStr ? new Date(acqDateStr) : new Date();
    
    if (isNaN(acquisitionDate.getTime())) {
      return { error: "Invalid acquisition date provided." };
    }

    const location = formData.get("location") as string;
    const condition = formData.get("condition") as Condition || "NEW";
    const bookable = formData.get("bookable") === "true";

    if (!name || !categoryId || !location) {
      return { error: "Name, Category, and Location are required." };
    }

    // Auto-generate sequential Asset Tag (AF-0001) using transaction lock
    const newAsset = await prisma.$transaction(async (tx) => {
      const lastAsset = await tx.asset.findFirst({
        orderBy: { tag: "desc" },
      });

      let nextNum = 1;
      if (lastAsset && lastAsset.tag.startsWith("AF-")) {
        const lastNum = parseInt(lastAsset.tag.replace("AF-", ""), 10);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }

      const paddedNum = String(nextNum).padStart(4, "0");
      const tag = `AF-${paddedNum}`;

      // Check serial uniqueness if provided
      if (serialNumber) {
        const existingSerial = await tx.asset.findUnique({
          where: { serialNumber }
        });
        if (existingSerial) {
          throw new Error(`An asset with Serial Number ${serialNumber} already exists.`);
        }
      }

      return await tx.asset.create({
        data: {
          tag,
          name,
          categoryId,
          serialNumber,
          cost,
          acquisitionDate,
          location,
          condition,
          bookable,
          status: "AVAILABLE",
          customFieldsData: formData.get("customFieldsData") ? JSON.parse(formData.get("customFieldsData") as string) : {}
        } as any,
      });
    });

    await logActivity({
      userId: user.id!,
      action: `Registered new asset ${newAsset.name} with Tag ${newAsset.tag}`,
      targetType: "Asset",
      targetId: newAsset.id,
      newValue: newAsset
    });

    return { success: true };
  } catch (error: any) {
    console.error("Register Asset Error:", error);
    return { error: error.message || "Failed to register asset." };
  }
}

export async function updateAsset(assetId: string, formData: FormData) {
  try {
    const user = await verifyCanManageAssets();
    
    const name = formData.get("name") as string;
    const categoryId = formData.get("categoryId") as string;
    const serialNumber = formData.get("serialNumber") as string || null;
    const cost = Number(formData.get("cost")) || 0;
    
    const acqDateStr = formData.get("acquisitionDate") as string;
    const acquisitionDate = acqDateStr ? new Date(acqDateStr) : new Date();
    
    if (isNaN(acquisitionDate.getTime())) {
      return { error: "Invalid acquisition date provided." };
    }

    const location = formData.get("location") as string;
    const condition = formData.get("condition") as Condition;
    const bookable = formData.get("bookable") === "true";
    const status = formData.get("status") as AssetStatus;

    if (!assetId || !name || !categoryId || !location) {
      return { error: "Asset ID, Name, Category, and Location are required." };
    }

    const oldAsset = await prisma.asset.findUnique({
      where: { id: assetId }
    });
    if (!oldAsset) return { error: "Asset not found." };

    if (serialNumber && serialNumber !== oldAsset.serialNumber) {
      const existingSerial = await prisma.asset.findUnique({
        where: { serialNumber }
      });
      if (existingSerial) {
        throw new Error(`An asset with Serial Number ${serialNumber} already exists.`);
      }
    }

    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        name,
        categoryId,
        serialNumber,
        cost,
        acquisitionDate,
        location,
        condition,
        bookable,
        status,
        customFieldsData: formData.get("customFieldsData") ? JSON.parse(formData.get("customFieldsData") as string) : {}
      } as any
    });

    await logActivity({
      userId: user.id!,
      action: `Updated asset details for Tag ${oldAsset.tag}`,
      targetType: "Asset",
      targetId: assetId,
      oldValue: oldAsset,
      newValue: updatedAsset
    });

    return { success: true };
  } catch (error: any) {
    console.error("Update Asset Error:", error);
    return { error: error.message || "Failed to update asset." };
  }
}

export async function deleteAsset(assetId: string) {
  try {
    const user = await verifyCanManageAssets();
    
    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    });
    if (!asset) return { error: "Asset not found." };

    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: { status: "RETIRED" }
    });

    await logActivity({
      userId: user.id!,
      action: `Retired asset Tag ${asset.tag}`,
      targetType: "Asset",
      targetId: assetId,
      oldValue: asset,
      newValue: updatedAsset
    });

    return { success: true };
  } catch (error: any) {
    console.error("Delete Asset Error:", error);
    return { error: error.message || "Failed to delete asset." };
  }
}
