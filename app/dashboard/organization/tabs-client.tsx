"use client";

import { useState } from "react";
import { 
  createDepartment, updateDepartment, deleteDepartment,
  createCategory, updateCategory, deleteCategory,
  promoteUser
} from "@/features/organization/actions";
import { Edit2, Trash2, FileSpreadsheet, PlusCircle } from "lucide-react";

interface Props {
  departments: any[];
  categories: any[];
  employees: any[];
}

export default function TabsClient({ departments, categories, employees }: Props) {
  const [activeTab, setActiveTab] = useState<"departments" | "categories" | "employees">("departments");

  // Selection states for Edit modals
  const [selectedDept, setSelectedDept] = useState<any | null>(null);
  const [selectedCat, setSelectedCat] = useState<any | null>(null);
  const [showEditDeptModal, setShowEditDeptModal] = useState(false);
  const [showEditCatModal, setShowEditCatModal] = useState(false);

  // Form error states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Creation forms submit feedback
  const [deptError, setDeptError] = useState<string | null>(null);
  const [deptSuccess, setDeptSuccess] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [catSuccess, setCatSuccess] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState(false);

  const handleCreateDept = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDeptError(null);
    setDeptSuccess(false);
    
    const formData = new FormData(e.currentTarget);
    const result = await createDepartment(formData);

    if (result?.error) {
      setDeptError(result.error);
    } else {
      setDeptSuccess(true);
      e.currentTarget.reset();
      window.location.reload();
    }
  };

  const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCatError(null);
    setCatSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await createCategory(formData);

    if (result?.error) {
      setCatError(result.error);
    } else {
      setCatSuccess(true);
      e.currentTarget.reset();
      window.location.reload();
    }
  };

  const handlePromote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPromoError(null);
    setPromoSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await promoteUser(formData);

    if (result?.error) {
      setPromoError(result.error);
    } else {
      setPromoSuccess(true);
      e.currentTarget.reset();
      window.location.reload();
    }
  };

  // Department Edit/Delete submit handlers
  const handleUpdateDept = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDept) return;
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateDepartment(selectedDept.id, formData);

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSubmitting(false);
        setShowEditDeptModal(false);
        window.location.reload();
      }, 1000);
    }
  };

  const handleDeleteDept = async (deptId: string) => {
    if (!confirm("Are you sure you want to delete this department? This action checks active personnel or allocated assets first.")) return;
    const result = await deleteDepartment(deptId);
    if (result?.error) {
      alert(result.error);
    } else {
      alert("Department deleted successfully.");
      window.location.reload();
    }
  };

  // Category Edit/Delete submit handlers
  const handleUpdateCat = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCat) return;
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateCategory(selectedCat.id, formData);

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSubmitting(false);
        setShowEditCatModal(false);
        window.location.reload();
      }, 1000);
    }
  };

  const handleDeleteCat = async (catId: string) => {
    if (!confirm("Are you sure you want to delete this category? This action validates that no registered assets are linked to it.")) return;
    const result = await deleteCategory(catId);
    if (result?.error) {
      alert(result.error);
    } else {
      alert("Category deleted successfully.");
      window.location.reload();
    }
  };

  // Export employee directory roster to CSV
  const exportRosterCSV = () => {
    const headers = ["Name", "Email", "System Role", "Department"];
    const rows = employees.map((e) => [
      e.name,
      e.email,
      e.role,
      e.department?.name || "-"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employee_roster_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", fontFamily: "'Inter', sans-serif" }}>
      {/* TABS SELECTOR */}
      <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", gap: "2rem" }}>
        {(["departments", "categories", "employees"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 4px",
              border: "none",
              background: "transparent",
              borderBottom: activeTab === tab ? "2px solid #7cd4a5" : "2px solid transparent",
              color: activeTab === tab ? "#111827" : "#6b7280",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              textTransform: "capitalize",
              transition: "all 0.2s"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: DEPARTMENTS */}
      {activeTab === "departments" && (
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          {/* Create Form */}
          <div style={{ flex: 1, minWidth: "300px", backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Add New Department</h3>
            <form onSubmit={handleCreateDept} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Department Name</label>
                <input name="name" required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", outline: "none" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Parent Department</label>
                <select name="parentId" style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", color: "#374151", backgroundColor: "#ffffff", outline: "none" }}>
                  <option value="">None (Top Level)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              {deptError && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{deptError}</span>}
              {deptSuccess && <span style={{ color: "#10b981", fontSize: "0.75rem" }}>Department added successfully!</span>}
              <button
                type="submit"
                style={{
                  padding: "11px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#92E4BA",
                  color: "#1e293b",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  boxShadow: "0 4px 10px rgba(146,228,186,0.2)",
                  transition: "all 0.2s"
                }}
              >
                Save Department
              </button>
            </form>
          </div>

          {/* List Table */}
          <div style={{ flex: 2, minWidth: "400px", backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Registered Departments</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#6b7280", backgroundColor: "#fafafa" }}>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Department Name</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Parent Unit</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Head Manager</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((d) => (
                    <tr key={d.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "#111827" }}>{d.name}</td>
                      <td style={{ padding: "12px 14px", color: "#6b7280" }}>{d.parent?.name || "-"}</td>
                      <td style={{ padding: "12px 14px", color: "#374151", fontWeight: 600 }}>{d.manager?.name || "None Assigned"}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => { setSelectedDept(d); setShowEditDeptModal(true); }}
                            style={{ border: "1px solid #d1d5db", borderRadius: "6px", padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600, backgroundColor: "#ffffff" }}
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDept(d.id)}
                            style={{ border: "1px solid #fee2e2", backgroundColor: "#fef2f2", color: "#ef4444", borderRadius: "6px", padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CATEGORIES */}
      {activeTab === "categories" && (
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          {/* Create Form */}
          <div style={{ flex: 1, minWidth: "300px", backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Add New Category</h3>
            <form onSubmit={handleCreateCategory} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Category Name</label>
                <input name="name" required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", outline: "none" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Warranty Period (Months)</label>
                <input name="warrantyMonths" type="number" defaultValue="0" style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", outline: "none" }} />
              </div>
              {catError && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{catError}</span>}
              {catSuccess && <span style={{ color: "#10b981", fontSize: "0.75rem" }}>Category added successfully!</span>}
              <button
                type="submit"
                style={{
                  padding: "11px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#92E4BA",
                  color: "#1e293b",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  boxShadow: "0 4px 10px rgba(146,228,186,0.2)",
                  transition: "all 0.2s"
                }}
              >
                Save Category
              </button>
            </form>
          </div>

          {/* List Table */}
          <div style={{ flex: 2, minWidth: "400px", backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Asset Classifications</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#6b7280", backgroundColor: "#fafafa" }}>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Classification Name</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Custom Fields / Attributes</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "#111827" }}>{c.name}</td>
                      <td style={{ padding: "12px 14px", color: "#6b7280", fontFamily: "monospace", fontSize: "0.78rem" }}>
                        {c.customFieldsSchema ? JSON.stringify(c.customFieldsSchema) : "Standard attributes only"}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => { setSelectedCat(c); setShowEditCatModal(true); }}
                            style={{ border: "1px solid #d1d5db", borderRadius: "6px", padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600, backgroundColor: "#ffffff" }}
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCat(c.id)}
                            style={{ border: "1px solid #fee2e2", backgroundColor: "#fef2f2", color: "#ef4444", borderRadius: "6px", padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: EMPLOYEES */}
      {activeTab === "employees" && (
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", flexDirection: "column" }}>
          {/* Role Promotion Form */}
          <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "1.25rem" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Promote User / Assign Department</h3>
              <button
                onClick={exportRosterCSV}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ffffff",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <FileSpreadsheet size={14} /> Export Roster CSV
              </button>
            </div>
            
            <form onSubmit={handlePromote} style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: "200px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Select Employee</label>
                <select name="userId" required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", color: "#374151", backgroundColor: "#ffffff", outline: "none" }}>
                  <option value="">-- Choose Employee --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: "180px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>ERP System Role</label>
                <select name="role" required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", color: "#374151", backgroundColor: "#ffffff", outline: "none" }}>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="DEPARTMENT_HEAD">Department Head</option>
                  <option value="ASSET_MANAGER">Asset Manager</option>
                  <option value="ADMIN">System Admin</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: "180px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Department</label>
                <select name="departmentId" style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", color: "#374151", backgroundColor: "#ffffff", outline: "none" }}>
                  <option value="">No Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {promoError && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{promoError}</span>}
                {promoSuccess && <span style={{ color: "#10b981", fontSize: "0.75rem" }}>Promotion saved!</span>}
                <button
                  type="submit"
                  style={{
                    padding: "10px 24px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#92E4BA",
                    color: "#1e293b",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    boxShadow: "0 4px 10px rgba(146,228,186,0.2)",
                    transition: "all 0.2s"
                  }}
                >
                  Save Promotion
                </button>
              </div>
            </form>
          </div>

          {/* Employee Directory List */}
          <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Employee Directory</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#6b7280", backgroundColor: "#fafafa" }}>
                    <th style={{ padding: "10px 12px", fontWeight: 700 }}>Name</th>
                    <th style={{ padding: "10px 12px", fontWeight: 700 }}>Email</th>
                    <th style={{ padding: "10px 12px", fontWeight: 700 }}>ERP System Role</th>
                    <th style={{ padding: "10px 12px", fontWeight: 700 }}>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "#111827" }}>{e.name}</td>
                      <td style={{ padding: "12px 14px", color: "#4b5563" }}>{e.email}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, backgroundColor: "#f3f4f6", padding: "4px 8px", borderRadius: "6px", color: "#374151" }}>
                          {e.role.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#374151", fontWeight: 600 }}>{e.department?.name || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DEPARTMENT MODAL */}
      {showEditDeptModal && selectedDept && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "450px", padding: "2rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}>
            <h2 style={{ margin: "0 0 1.25rem 0", fontSize: "1.1rem", fontWeight: 800, color: "#111827" }}>Edit Department details</h2>
            <form onSubmit={handleUpdateDept} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Department Name</label>
                <input name="name" defaultValue={selectedDept.name} required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Parent Department</label>
                <select name="parentId" defaultValue={selectedDept.parentId || ""} style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", backgroundColor: "#ffffff" }}>
                  <option value="">None (Top Level)</option>
                  {departments.filter(d => d.id !== selectedDept.id).map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Head Manager</label>
                <select name="managerId" defaultValue={selectedDept.managerId || ""} style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", backgroundColor: "#ffffff" }}>
                  <option value="">None Assigned</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Operating Status</label>
                <select name="status" defaultValue={selectedDept.status} style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", backgroundColor: "#ffffff" }}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive (Deactivated)</option>
                </select>
              </div>

              {error && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{error}</span>}
              {success && <span style={{ color: "#10b981", fontSize: "0.75rem" }}>Department updated!</span>}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowEditDeptModal(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #d1d5db", background: "transparent", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: "8px 24px", borderRadius: "8px", border: "none", backgroundColor: "#92E4BA", color: "#1e293b", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CATEGORY MODAL */}
      {showEditCatModal && selectedCat && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "450px", padding: "2rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}>
            <h2 style={{ margin: "0 0 1.25rem 0", fontSize: "1.1rem", fontWeight: 800, color: "#111827" }}>Edit Category details</h2>
            <form onSubmit={handleUpdateCat} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Category Name</label>
                <input name="name" defaultValue={selectedCat.name} required style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Warranty Period (Months)</label>
                <input name="warrantyMonths" type="number" defaultValue={selectedCat.customFieldsSchema?.warrantyMonths || 0} style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "0.8rem", color: "#4b5563", fontWeight: 600 }}>Operating Status</label>
                <select name="status" defaultValue={selectedCat.status} style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", backgroundColor: "#ffffff" }}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive (Deactivated)</option>
                </select>
              </div>

              {error && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{error}</span>}
              {success && <span style={{ color: "#10b981", fontSize: "0.75rem" }}>Category updated!</span>}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowEditCatModal(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #d1d5db", background: "transparent", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: "8px 24px", borderRadius: "8px", border: "none", backgroundColor: "#92E4BA", color: "#1e293b", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
