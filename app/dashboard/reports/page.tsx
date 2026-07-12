import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AnalyticsClient from "./analytics-client";

export const dynamic = "force-dynamic";

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function getMonthLabel(date: Date) {
  return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userRole = (session.user as any).role || "EMPLOYEE";
  if (!["ADMIN", "ASSET_MANAGER"].includes(userRole)) redirect("/dashboard");

  const now = new Date();
  const twelveMonthsAgo = new Date(now); twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const threeYearsAgo = new Date(now); threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  const in30Days = new Date(now); in30Days.setDate(in30Days.getDate() + 30);
  const in90Days = new Date(now); in90Days.setDate(in90Days.getDate() + 90);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const [
    totalAssets, availableAssets, allocatedAssets, maintenanceAssets,
    retiredAssets, disposedAssets, lostAssets, reservedAssets,
    allAssetsForValue, nearRetirementCount,
    warrantyExpired, warrantyExpiring30, warrantyExpiring90, warrantyActive,
    openMaintenanceCount, pendingMaintenance, inProgressMaintenance,
    maintenanceThisMonth, maintenanceLastMonth,
    bookingsToday, bookingsThisMonth, bookingsLastMonth,
    pendingTransfers, transfersToday, activeAudits,
    assetsByCategory, assetsByCondition,
    allAssets, allocationsAllTime, maintenanceAllTime, bookingsAllTime,
    departments, departmentAllocations,
    recentActivity, transferRequests, overdueAllocations,
  ] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.count({ where: { status: "AVAILABLE" } }),
    prisma.asset.count({ where: { status: "ALLOCATED" } }),
    prisma.asset.count({ where: { status: "UNDER_MAINTENANCE" } }),
    prisma.asset.count({ where: { status: "RETIRED" } }),
    prisma.asset.count({ where: { status: "DISPOSED" } }),
    prisma.asset.count({ where: { status: "LOST" } }),
    prisma.asset.count({ where: { status: "RESERVED" } }),
    prisma.asset.findMany({ select: { cost: true, currentValue: true } }),
    prisma.asset.count({ where: { OR: [{ condition: { in: ["POOR","DAMAGED"] } }, { acquisitionDate: { lt: threeYearsAgo } }], status: { notIn: ["RETIRED","DISPOSED"] } } }),
    prisma.asset.count({ where: { warrantyEnd: { lt: now } } }),
    prisma.asset.count({ where: { warrantyEnd: { gte: now, lt: in30Days } } }),
    prisma.asset.count({ where: { warrantyEnd: { gte: in30Days, lt: in90Days } } }),
    prisma.asset.count({ where: { warrantyEnd: { gte: in90Days } } }),
    prisma.maintenanceRequest.count({ where: { status: { in: ["PENDING","TECHNICIAN_ASSIGNED","IN_PROGRESS"] } } }),
    prisma.maintenanceRequest.count({ where: { status: "PENDING" } }),
    prisma.maintenanceRequest.count({ where: { status: "IN_PROGRESS" } }),
    prisma.maintenanceRequest.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.maintenanceRequest.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    prisma.booking.count({ where: { status: { in: ["UPCOMING","ONGOING"] }, startTime: { gte: todayStart, lt: todayEnd } } }),
    prisma.booking.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.booking.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    (prisma as any).transferRequest?.count({ where: { status: { in: ["PENDING","DEPARTMENT_APPROVED"] } } }) ?? Promise.resolve(0),
    (prisma as any).transferRequest?.count({ where: { createdAt: { gte: todayStart, lt: todayEnd } } }) ?? Promise.resolve(0),
    prisma.auditCycle.count({ where: { status: "ACTIVE" } }),
    prisma.category.findMany({ include: { assets: { select: { cost: true, status: true } } } }),
    prisma.asset.findMany({ select: { condition: true } }),
    prisma.asset.findMany({
      select: {
        id: true, tag: true, name: true, cost: true, status: true, condition: true,
        acquisitionDate: true, location: true, vendorName: true, warrantyEnd: true,
        category: { select: { id: true, name: true } },
        allocations: { select: { departmentId: true, status: true } },
        maintenanceRequests: { select: { id: true } },
        bookings: { select: { id: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.allocation.findMany({
      select: { id: true, createdAt: true, status: true, departmentId: true },
      where: { createdAt: { gte: twelveMonthsAgo } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.maintenanceRequest.findMany({
      select: { id: true, createdAt: true, status: true, priority: true, assetId: true },
      where: { createdAt: { gte: twelveMonthsAgo } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.booking.findMany({
      select: { id: true, createdAt: true, status: true, assetId: true },
      where: { createdAt: { gte: twelveMonthsAgo } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.department.findMany({ select: { id: true, name: true, employees: { select: { id: true } } } }),
    prisma.allocation.findMany({
      where: { status: "APPROVED" },
      select: { departmentId: true, assetId: true, asset: { select: { cost: true } } },
    }),
    prisma.activityLog.findMany({ take: 40, orderBy: { timestamp: "desc" } }),
    (prisma as any).transferRequest?.findMany({
      select: { id: true, status: true, createdAt: true, priority: true },
      where: { createdAt: { gte: twelveMonthsAgo } },
      orderBy: { createdAt: "asc" },
    }) ?? Promise.resolve([]),
    prisma.allocation.findMany({
      where: { status: "APPROVED", expectedReturnDate: { lt: now, not: null }, actualReturnDate: null },
      include: { asset: { select: { name: true, tag: true } }, user: { select: { name: true } } },
      take: 10,
    }),
  ]);

  // Month labels
  const months: string[] = [];
  const monthLabels: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(getMonthKey(d));
    monthLabels.push(getMonthLabel(d));
  }

  // Registration trend
  const regByMonth: Record<string,number> = {};
  const costByMonth: Record<string,number> = {};
  months.forEach(m => { regByMonth[m]=0; costByMonth[m]=0; });
  allAssets.forEach(a => {
    const mk = getMonthKey(new Date(a.createdAt));
    if (regByMonth[mk] !== undefined) { regByMonth[mk]++; costByMonth[mk] += a.cost??0; }
  });
  const registrationTrend = months.map((m,i) => ({ month: monthLabels[i], registrations: regByMonth[m]||0, costAdded: Math.round(costByMonth[m]||0) }));

  // Allocation trend
  const allocByMonth: Record<string,number> = {};
  months.forEach(m => { allocByMonth[m]=0; });
  allocationsAllTime.forEach(a => { const mk=getMonthKey(new Date(a.createdAt)); if(allocByMonth[mk]!==undefined) allocByMonth[mk]++; });
  const allocationTrend = months.map((m,i) => ({ month: monthLabels[i], allocations: allocByMonth[m]||0 }));

  // Maintenance trend
  const mntByMonth: Record<string,{count:number,high:number,critical:number}> = {};
  months.forEach(m => { mntByMonth[m]={count:0,high:0,critical:0}; });
  maintenanceAllTime.forEach(r => {
    const mk=getMonthKey(new Date(r.createdAt));
    if(mntByMonth[mk]){ mntByMonth[mk].count++; if(r.priority==="HIGH") mntByMonth[mk].high++; if(r.priority==="CRITICAL") mntByMonth[mk].critical++; }
  });
  const maintenanceTrend = months.map((m,i) => ({ month: monthLabels[i], total: mntByMonth[m]?.count||0, high: mntByMonth[m]?.high||0, critical: mntByMonth[m]?.critical||0 }));

  // Bookings trend
  const bkByMonth: Record<string,number> = {};
  months.forEach(m => { bkByMonth[m]=0; });
  bookingsAllTime.forEach(b => { const mk=getMonthKey(new Date(b.createdAt)); if(bkByMonth[mk]!==undefined) bkByMonth[mk]++; });
  const bookingsTrend = months.map((m,i) => ({ month: monthLabels[i], bookings: bkByMonth[m]||0 }));

  // Transfer trend
  const trByMonth: Record<string,number> = {};
  months.forEach(m => { trByMonth[m]=0; });
  (transferRequests as any[]).forEach(t => { const mk=getMonthKey(new Date(t.createdAt)); if(trByMonth[mk]!==undefined) trByMonth[mk]++; });
  const transferTrend = months.map((m,i) => ({ month: monthLabels[i], transfers: trByMonth[m]||0 }));

  const totalAssetValue = Math.round(allAssetsForValue.reduce((s,a)=>s+(a.currentValue??a.cost??0),0));
  const totalOriginalValue = Math.round(allAssetsForValue.reduce((s,a)=>s+(a.cost??0),0));

  const statusDistribution = [
    { name: "Available", value: availableAssets, color: "#059669" },
    { name: "Allocated", value: allocatedAssets, color: "#2563eb" },
    { name: "Maintenance", value: maintenanceAssets, color: "#d97706" },
    { name: "Reserved", value: reservedAssets, color: "#0284c7" },
    { name: "Retired", value: retiredAssets, color: "#6b7280" },
    { name: "Disposed", value: disposedAssets, color: "#374151" },
    { name: "Lost", value: lostAssets, color: "#dc2626" },
  ].filter(s=>s.value>0);

  const categoryBreakdown = assetsByCategory.map(cat => ({
    name: cat.name,
    count: cat.assets.length,
    totalCost: Math.round(cat.assets.reduce((s,a)=>s+a.cost,0)),
    allocated: cat.assets.filter(a=>a.status==="ALLOCATED").length,
    available: cat.assets.filter(a=>a.status==="AVAILABLE").length,
  })).sort((a,b)=>b.totalCost-a.totalCost);

  const conditionMap: Record<string,number> = {NEW:0,GOOD:0,FAIR:0,POOR:0,DAMAGED:0};
  assetsByCondition.forEach(a=>{ if(conditionMap[a.condition]!==undefined) conditionMap[a.condition]++; });
  const conditionBreakdown = Object.entries(conditionMap).map(([name,value])=>({name,value}));

  const warrantyBreakdown = [
    { name: "Expired", value: warrantyExpired, color: "#dc2626" },
    { name: "< 30 days", value: warrantyExpiring30, color: "#d97706" },
    { name: "30–90 days", value: warrantyExpiring90, color: "#0284c7" },
    { name: "> 90 days", value: warrantyActive, color: "#059669" },
  ].filter(w=>w.value>0);

  const deptMap: Record<string,{name:string,assets:number,value:number,employees:number}> = {};
  departments.forEach(d=>{ deptMap[d.id]={name:d.name,assets:0,value:0,employees:d.employees.length}; });
  departmentAllocations.forEach(al=>{ if(al.departmentId&&deptMap[al.departmentId]){ deptMap[al.departmentId].assets++; deptMap[al.departmentId].value+=al.asset?.cost??0; } });
  const departmentPerformance = Object.values(deptMap).filter(d=>d.assets>0||d.employees>0).sort((a,b)=>b.assets-a.assets).slice(0,10);

  const vendorMap: Record<string,{count:number,value:number}> = {};
  allAssets.forEach(a=>{ const v=a.vendorName||"Unknown"; if(!vendorMap[v]) vendorMap[v]={count:0,value:0}; vendorMap[v].count++; vendorMap[v].value+=a.cost??0; });
  const vendorBreakdown = Object.entries(vendorMap).map(([name,d])=>({name,count:d.count,value:Math.round(d.value)})).sort((a,b)=>b.count-a.count).slice(0,8);

  const assetMntCount: Record<string,{name:string,tag:string,count:number}> = {};
  maintenanceAllTime.forEach(r=>{ const asset=allAssets.find(a=>a.id===r.assetId); if(!asset) return; if(!assetMntCount[r.assetId]) assetMntCount[r.assetId]={name:asset.name,tag:asset.tag,count:0}; assetMntCount[r.assetId].count++; });
  const topMaintainedAssets = Object.values(assetMntCount).sort((a,b)=>b.count-a.count).slice(0,10);

  const assetBkCount: Record<string,{name:string,tag:string,count:number}> = {};
  bookingsAllTime.forEach(b=>{ const asset=allAssets.find(a=>a.id===b.assetId); if(!asset) return; if(!assetBkCount[b.assetId]) assetBkCount[b.assetId]={name:asset.name,tag:asset.tag,count:0}; assetBkCount[b.assetId].count++; });
  const topBookedAssets = Object.values(assetBkCount).sort((a,b)=>b.count-a.count).slice(0,10);

  const priorityMap: Record<string,number> = {LOW:0,MEDIUM:0,HIGH:0,CRITICAL:0};
  maintenanceAllTime.forEach(r=>{ if(priorityMap[r.priority]!==undefined) priorityMap[r.priority]++; });
  const maintenancePriorityBreakdown = Object.entries(priorityMap).map(([name,value])=>({name,value}));

  const transferStatusMap: Record<string,number> = {};
  (transferRequests as any[]).forEach(t=>{ transferStatusMap[t.status]=(transferStatusMap[t.status]||0)+1; });
  const transferStatusBreakdown = Object.entries(transferStatusMap).map(([name,value])=>({name,value}));

  const locationMap: Record<string,number> = {};
  allAssets.forEach(a=>{ locationMap[a.location]=(locationMap[a.location]||0)+1; });
  const locationBreakdown = Object.entries(locationMap).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count).slice(0,8);

  const ageBuckets: Record<string,number> = {"<1yr":0,"1-2yr":0,"2-3yr":0,"3-5yr":0,">5yr":0};
  allAssets.forEach(a=>{ const yrs=(now.getTime()-new Date(a.acquisitionDate).getTime())/(1000*60*60*24*365.25); if(yrs<1) ageBuckets["<1yr"]++; else if(yrs<2) ageBuckets["1-2yr"]++; else if(yrs<3) ageBuckets["2-3yr"]++; else if(yrs<5) ageBuckets["3-5yr"]++; else ageBuckets[">5yr"]++; });
  const ageDistribution = Object.entries(ageBuckets).map(([name,count])=>({name,count}));

  const maintenancePct = maintenanceLastMonth>0 ? Math.round(((maintenanceThisMonth-maintenanceLastMonth)/maintenanceLastMonth)*100) : maintenanceThisMonth>0?100:0;
  const bookingsPct = bookingsLastMonth>0 ? Math.round(((bookingsThisMonth-bookingsLastMonth)/bookingsLastMonth)*100) : bookingsThisMonth>0?100:0;

  // AI Insights
  const ninetyDaysAgo = new Date(now); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate()-90);
  const idleAssets = allAssets.filter(a=>a.status==="AVAILABLE"&&new Date(a.createdAt)<ninetyDaysAgo&&a.allocations.filter(al=>al.status==="APPROVED").length===0);
  const criticalOpen = maintenanceAllTime.filter(m=>m.priority==="CRITICAL"&&["PENDING","IN_PROGRESS","TECHNICIAN_ASSIGNED"].includes(m.status)).length;

  const aiInsights: Array<{id:string,icon:string,risk:"LOW"|"MEDIUM"|"HIGH"|"CRITICAL",title:string,message:string,recommendation:string,count:number}> = [];
  if(idleAssets.length>0) aiInsights.push({id:"idle",icon:"📦",risk:idleAssets.length>10?"HIGH":"MEDIUM",title:"Idle Assets Detected",message:`${idleAssets.length} assets unallocated for 90+ days.`,recommendation:`Review and reallocate these ${idleAssets.length} idle assets.`,count:idleAssets.length});
  if(warrantyExpiring30>0) aiInsights.push({id:"warranty30",icon:"🛡️",risk:warrantyExpiring30>5?"HIGH":"MEDIUM",title:"Warranty Expiring Soon",message:`${warrantyExpiring30} assets warranty expires within 30 days.`,recommendation:"Contact vendors for renewal.",count:warrantyExpiring30});
  if(warrantyExpired>0) aiInsights.push({id:"warrantyExp",icon:"⚠️",risk:"HIGH",title:"Expired Warranties",message:`${warrantyExpired} assets operating with expired warranties.`,recommendation:"Prioritize renewal or insurance.",count:warrantyExpired});
  if(maintenancePct>20) aiInsights.push({id:"mntSpike",icon:"🔧",risk:maintenancePct>50?"HIGH":"MEDIUM",title:"Maintenance Spike",message:`Maintenance tickets up ${maintenancePct}% vs last month.`,recommendation:"Investigate root cause and consider proactive replacement.",count:maintenanceThisMonth});
  if(overdueAllocations.length>0) aiInsights.push({id:"overdue",icon:"⏰",risk:overdueAllocations.length>5?"HIGH":"MEDIUM",title:"Overdue Returns",message:`${overdueAllocations.length} allocations past return date.`,recommendation:"Send reminders and escalate.",count:overdueAllocations.length});
  if(nearRetirementCount>0) aiInsights.push({id:"nearRet",icon:"📉",risk:nearRetirementCount>15?"HIGH":"LOW",title:"Assets Near End of Life",message:`${nearRetirementCount} assets in poor condition or over 3 years old.`,recommendation:"Plan replacement budget.",count:nearRetirementCount});
  if(criticalOpen>0) aiInsights.push({id:"critMnt",icon:"🚨",risk:"CRITICAL",title:"Critical Maintenance Open",message:`${criticalOpen} critical maintenance requests unresolved.`,recommendation:"Assign technicians immediately.",count:criticalOpen});
  if(departmentPerformance[0]) aiInsights.push({id:"topDept",icon:"🏢",risk:"LOW",title:`${departmentPerformance[0].name} — Highest Utilization`,message:`${departmentPerformance[0].assets} assets for ${departmentPerformance[0].employees} employees.`,recommendation:"Monitor for resource saturation.",count:departmentPerformance[0].assets});

  const sparkAssets = registrationTrend.slice(-6).map(d=>({m:d.month,v:d.registrations}));
  const sparkMaintenance = maintenanceTrend.slice(-6).map(d=>({m:d.month,v:d.total}));
  const sparkBookings = bookingsTrend.slice(-6).map(d=>({m:d.month,v:d.bookings}));

  return (
    <AnalyticsClient
      totalAssets={totalAssets}
      availableAssets={availableAssets}
      allocatedAssets={allocatedAssets}
      maintenanceAssets={maintenanceAssets}
      retiredAssets={retiredAssets}
      disposedAssets={disposedAssets}
      lostAssets={lostAssets}
      nearRetirementCount={nearRetirementCount}
      totalAssetValue={totalAssetValue}
      totalOriginalValue={totalOriginalValue}
      totalDepreciated={totalOriginalValue-totalAssetValue}
      openMaintenanceCount={openMaintenanceCount}
      pendingMaintenance={pendingMaintenance}
      inProgressMaintenance={inProgressMaintenance}
      maintenanceThisMonth={maintenanceThisMonth}
      maintenancePct={maintenancePct}
      bookingsToday={bookingsToday}
      bookingsThisMonth={bookingsThisMonth}
      bookingsPct={bookingsPct}
      pendingTransfers={pendingTransfers}
      transfersToday={transfersToday}
      activeAudits={activeAudits}
      warrantyExpired={warrantyExpired}
      warrantyExpiring30={warrantyExpiring30}
      warrantyExpiring90={warrantyExpiring90}
      warrantyActive={warrantyActive}
      registrationTrend={registrationTrend}
      allocationTrend={allocationTrend}
      maintenanceTrend={maintenanceTrend}
      bookingsTrend={bookingsTrend}
      transferTrend={transferTrend}
      statusDistribution={statusDistribution}
      categoryBreakdown={categoryBreakdown}
      conditionBreakdown={conditionBreakdown}
      warrantyBreakdown={warrantyBreakdown}
      departmentPerformance={departmentPerformance}
      vendorBreakdown={vendorBreakdown}
      locationBreakdown={locationBreakdown}
      ageDistribution={ageDistribution}
      maintenancePriorityBreakdown={maintenancePriorityBreakdown}
      transferStatusBreakdown={transferStatusBreakdown}
      topBookedAssets={topBookedAssets}
      topMaintainedAssets={topMaintainedAssets}
      sparkAssets={sparkAssets}
      sparkMaintenance={sparkMaintenance}
      sparkBookings={sparkBookings}
      aiInsights={aiInsights}
      combinedTimeline={recentActivity.map(l=>({id:l.id,action:l.action,targetType:l.targetType,timestamp:l.timestamp.toISOString(),userId:l.userId}))}
      overdueAllocations={overdueAllocations.map(a=>({id:a.id,assetName:a.asset.name,assetTag:a.asset.tag,userName:a.user?.name||"Unknown",expectedReturnDate:a.expectedReturnDate?.toISOString()||""}))}
    />
  );
}
