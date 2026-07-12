const { PrismaClient, Role, UserStatus, Condition } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Delete all existing data to prevent collisions
  await prisma.activityLog.deleteMany();
  await prisma.auditItem.deleteMany();
  await prisma.auditCycle.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // Create Departments
  const deptEng = await prisma.department.create({
    data: { name: "Engineering", status: "ACTIVE" }
  });
  const deptOps = await prisma.department.create({
    data: { name: "Operations", status: "ACTIVE" }
  });
  const deptHR = await prisma.department.create({
    data: { name: "Human Resources", status: "ACTIVE" }
  });

  console.log("Created departments.");

  // Create Admin
  const adminPasswordHash = bcrypt.hashSync("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@assetflow.com",
      name: "Admin User",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
      departmentId: deptOps.id
    }
  });

  // Create Employees
  const employeePasswordHash = bcrypt.hashSync("employee123", 10);
  const emp1 = await prisma.user.create({
    data: {
      email: "priya@assetflow.com",
      name: "Priya Sharma",
      passwordHash: employeePasswordHash,
      role: "EMPLOYEE",
      status: "ACTIVE",
      departmentId: deptEng.id
    }
  });

  const emp2 = await prisma.user.create({
    data: {
      email: "raj@assetflow.com",
      name: "Raj Patel",
      passwordHash: employeePasswordHash,
      role: "EMPLOYEE",
      status: "ACTIVE",
      departmentId: deptEng.id
    }
  });

  // Promote Department Head
  const managerPasswordHash = bcrypt.hashSync("manager123", 10);
  const deptHead = await prisma.user.create({
    data: {
      email: "head@assetflow.com",
      name: "Vikram Mehta",
      passwordHash: managerPasswordHash,
      role: "DEPARTMENT_HEAD",
      status: "ACTIVE",
      departmentId: deptEng.id
    }
  });

  await prisma.department.update({
    where: { id: deptEng.id },
    data: { managerId: deptHead.id }
  });

  // Promote Asset Manager
  const assetMgr = await prisma.user.create({
    data: {
      email: "manager@assetflow.com",
      name: "Sarah Jenkins",
      passwordHash: managerPasswordHash,
      role: "ASSET_MANAGER",
      status: "ACTIVE",
      departmentId: deptOps.id
    }
  });

  console.log("Created users & roles.");

  // Create Categories
  const catElectronics = await prisma.category.create({
    data: {
      name: "Electronics",
      customFieldsSchema: {
        fields: [
          { name: "warrantyPeriodMonths", type: "number", label: "Warranty (Months)" },
          { name: "processor", type: "string", label: "Processor" }
        ]
      }
    }
  });

  const catFurniture = await prisma.category.create({
    data: {
      name: "Furniture",
      customFieldsSchema: {
        fields: [
          { name: "material", type: "string", label: "Material" }
        ]
      }
    }
  });

  const catVehicles = await prisma.category.create({
    data: {
      name: "Vehicles",
      customFieldsSchema: {
        fields: [
          { name: "fuelType", type: "string", label: "Fuel Type" },
          { name: "insuranceExpiry", type: "string", label: "Insurance Expiry" }
        ]
      }
    }
  });

  const catSpaces = await prisma.category.create({
    data: {
      name: "Spaces",
      customFieldsSchema: {
        fields: [
          { name: "capacity", type: "number", label: "Capacity" }
        ]
      }
    }
  });

  console.log("Created categories.");

  // Register initial Assets
  const laptop = await prisma.asset.create({
    data: {
      tag: "AF-0001",
      name: "MacBook Pro M3",
      categoryId: catElectronics.id,
      serialNumber: "SN-MBP12345",
      cost: 2500,
      acquisitionDate: new Date(),
      location: "HQ - Floor 3",
      condition: "NEW",
      bookable: false,
      status: "AVAILABLE"
    }
  });

  const roomB2 = await prisma.asset.create({
    data: {
      tag: "AF-0002",
      name: "Conference Room B2",
      categoryId: catSpaces.id,
      cost: 0,
      acquisitionDate: new Date(),
      location: "HQ - Floor 1",
      condition: "GOOD",
      bookable: true,
      status: "AVAILABLE"
    }
  });

  const vehicle = await prisma.asset.create({
    data: {
      tag: "AF-0003",
      name: "Tesla Model 3",
      categoryId: catVehicles.id,
      serialNumber: "SN-TESLA789",
      cost: 45000,
      acquisitionDate: new Date(),
      location: "Basement Parking",
      condition: "NEW",
      bookable: true,
      status: "AVAILABLE"
    }
  });

  console.log("Created base assets.");

  // Seed allocation
  await prisma.allocation.create({
    data: {
      assetId: laptop.id,
      userId: emp1.id,
      departmentId: deptEng.id,
      expectedReturnDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: "APPROVED"
    }
  });

  await prisma.asset.update({
    where: { id: laptop.id },
    data: { status: "ALLOCATED" }
  });

  console.log("Seeding complete successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
