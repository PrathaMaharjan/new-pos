"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Store,
  Plus,
  Search,
  Phone,
  MapPin,
  Building2,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Mail,
} from "lucide-react";
import api from "@/lib/api";
import { useAppSelector } from "@/lib/store/hooks";
import { useGetMeQuery } from "@/lib/store/services/authApi";

export interface OutletLocation {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt?: string;
}

const ITEMS_PER_PAGE = 8;

export default function OutletsPage() {
  const auth = useAppSelector((state) => state.auth);
  const { data: meData } = useGetMeQuery();

  const currentRole = (auth.role || meData?.role || "owner").toLowerCase();
  const canManageOutlets = ["owner", "admin", "manager"].includes(currentRole);

  const [outlets, setOutlets] = useState<OutletLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<OutletLocation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OutletLocation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    isActive: true,
  });

  const fetchOutlets = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let res;
      try {
        res = await api.get("/auth/locations");
      } catch {
        res = await api.get("/locations");
      }

      const locationsList: OutletLocation[] = res.data?.locations || res.data || [];
      setOutlets(locationsList);
    } catch (err: any) {
      const msg =
        typeof err?.response?.data?.error === "string"
          ? err.response.data.error
          : "Failed to load outlets.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutlets();
  }, [fetchOutlets]);

  function resetForm() {
    setForm({
      name: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      isActive: true,
    });
    setEditingOutlet(null);
    setErrorMsg(null);
  }

  function handleOpenEdit(outlet: OutletLocation) {
    setEditingOutlet(outlet);
    setForm({
      name: outlet.name || "",
      phone: outlet.phone || "",
      address: outlet.address || "",
      city: outlet.city || "",
      state: outlet.state || "",
      country: outlet.country || "",
      postalCode: outlet.postalCode || "",
      isActive: outlet.isActive,
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMsg("Outlet name is required.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      if (editingOutlet) {
        let patchRes;
        try {
          patchRes = await api.patch(`/auth/locations/${editingOutlet.id}`, form);
        } catch {
          patchRes = await api.patch(`/locations/${editingOutlet.id}`, form);
        }
        const updated = patchRes.data?.location || patchRes.data;
        setOutlets((prev) =>
          prev.map((item) => (item.id === editingOutlet.id ? { ...item, ...updated, ...form } : item))
        );
      } else {
        let postRes;
        try {
          postRes = await api.post("/auth/locations", form);
        } catch {
          postRes = await api.post("/locations", form);
        }
        const created = postRes.data?.location || postRes.data;
        setOutlets((prev) => [created, ...prev]);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      const msg =
        typeof err?.response?.data?.error === "string"
          ? err.response.data.error
          : "Failed to save outlet.";
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleStatus(locationId: string, currentlyActive: boolean) {
    try {
      try {
        await api.patch(`/auth/locations/${locationId}`, { isActive: !currentlyActive });
      } catch {
        await api.patch(`/locations/${locationId}`, { isActive: !currentlyActive });
      }
      setOutlets((prev) =>
        prev.map((o) => (o.id === locationId ? { ...o, isActive: !currentlyActive } : o))
      );
    } catch (err: any) {
      alert(err?.response?.data?.error ?? "Failed to update status.");
    }
  }

  async function confirmDeleteOutlet() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      try {
        await api.delete(`/auth/locations/${deleteTarget.id}`);
      } catch {
        await api.delete(`/locations/${deleteTarget.id}`);
      }
      setOutlets((prev) => prev.filter((o) => o.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error ?? "Failed to delete outlet.");
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  // Filtered Outlets
  const filteredOutlets = outlets.filter((item) => {
    const query = search.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      (item.city?.toLowerCase().includes(query) ?? false) ||
      (item.state?.toLowerCase().includes(query) ?? false) ||
      (item.postalCode?.toLowerCase().includes(query) ?? false) ||
      (item.country?.toLowerCase().includes(query) ?? false) ||
      (item.phone?.toLowerCase().includes(query) ?? false) ||
      (item.address?.toLowerCase().includes(query) ?? false);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && item.isActive) ||
      (statusFilter === "INACTIVE" && !item.isActive);

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalItems = filteredOutlets.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const paginatedOutlets = filteredOutlets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeCount = outlets.filter((o) => o.isActive).length;
  const inactiveCount = outlets.filter((o) => !o.isActive).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Banner Title - matching staff page */}
      <div className="rounded-xl bg-[#6b5dd3] px-4 py-4 text-white shadow-sm sm:px-6 sm:py-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Outlets</h1>
          <p className="text-xs text-white/80 mt-1">
            Manage branch locations, street addresses, postal codes, and contact details
          </p>
        </div>
        {canManageOutlets && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-xs px-3 py-1 text-xs font-medium text-white">
            <Store className="h-3.5 w-3.5" />
            Outlet Management Active
          </span>
        )}
      </div>

      {/* Top Status Dashboards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 border-l-4 border-l-slate-400 bg-white p-4 shadow-sm flex items-center justify-between sm:p-5">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Outlets</p>
            <p className="text-2xl font-bold text-slate-800 mt-1 sm:text-3xl">{outlets.length}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-600 sm:h-12 sm:w-12">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 border-l-4 border-l-[#6b5dd3] bg-white p-4 shadow-sm flex items-center justify-between sm:p-5">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active</p>
            <p className="text-2xl font-bold text-slate-800 mt-1 sm:text-3xl">{activeCount}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6b5dd3]/10 text-[#6b5dd3] sm:h-12 sm:w-12">
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 border-l-4 border-l-amber-500 bg-white p-4 shadow-sm flex items-center justify-between sm:p-5">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Inactive</p>
            <p className="text-2xl font-bold text-slate-800 mt-1 sm:text-3xl">{inactiveCount}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 sm:h-12 sm:w-12">
            <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>
      </div>

      {/* Control Actions Panel */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full md:w-auto flex-wrap">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, address, postal code..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#6b5dd3] focus:outline-none focus:ring-1 focus:ring-[#6b5dd3]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 focus:border-[#6b5dd3] focus:outline-none focus:ring-1 focus:ring-[#6b5dd3]"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>

        {/* Add Outlet Button */}
        {canManageOutlets && (
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#6b5dd3] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5a4dbf] w-full md:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add Outlet
          </button>
        )}
      </div>

      {errorMsg && !isModalOpen && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Data Section Container */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#6b5dd3]" />
          </div>
        ) : (
          <>
            {/* Desktop and Tablet Wide Screen Data View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Outlet Name</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4">City / State</th>
                    <th className="py-3 px-4">Postal Code</th>
                    <th className="py-3 px-4">Country</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Status</th>
                    {canManageOutlets && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedOutlets.map((outlet) => (
                    <tr key={outlet.id} className="hover:bg-slate-50/50 transition-colors group">
                      {/* Outlet Name */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6b5dd3]/10 text-sm font-semibold text-[#6b5dd3] border border-[#6b5dd3]/20">
                            <Store className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">{outlet.name}</span>
                          </div>
                        </div>
                      </td>

                      {/* Street Address */}
                      <td className="py-4 px-4 text-slate-600 max-w-[200px] truncate">
                        {outlet.address ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{outlet.address}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">—</span>
                        )}
                      </td>

                      {/* City / State */}
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {outlet.city || outlet.state ? (
                          <span>
                            {[outlet.city, outlet.state].filter(Boolean).join(", ")}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">—</span>
                        )}
                      </td>

                      {/* Postal Code (Dedicated Column) */}
                      <td className="py-4 px-4">
                        {outlet.postalCode ? (
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">
                            {outlet.postalCode}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">—</span>
                        )}
                      </td>

                      {/* Country */}
                      <td className="py-4 px-4 text-slate-600">
                        {outlet.country ? (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-700">
                            <Globe className="h-3 w-3 text-slate-400" />
                            {outlet.country}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">—</span>
                        )}
                      </td>

                      {/* Contact Phone */}
                      <td className="py-4 px-4 text-slate-500 font-mono text-xs">
                        {outlet.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{outlet.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Status Toggle Button (identical to staff) */}
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => toggleStatus(outlet.id, outlet.isActive)}
                          title="Click to toggle status"
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-all hover:scale-105 active:scale-95 select-none ${outlet.isActive
                              ? "bg-[#6b5dd3]/10 text-[#6b5dd3] border border-[#6b5dd3]/20"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                        >
                          <span
                            className={`mr-1.5 h-1.5 w-1.5 rounded-full ${outlet.isActive ? "bg-[#6b5dd3]" : "bg-slate-400"
                              }`}
                          />
                          {outlet.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>

                      {/* Actions */}
                      {canManageOutlets && (
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEdit(outlet)}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                              title="Edit Outlet"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(outlet)}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Remove Outlet"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Adaptive Layout View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {paginatedOutlets.map((outlet) => (
                <div key={outlet.id} className="p-4 flex flex-col gap-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6b5dd3]/10 text-sm font-semibold text-[#6b5dd3] border border-[#6b5dd3]/20">
                        <Store className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 text-sm">{outlet.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-500 font-medium">
                            {[outlet.city, outlet.country].filter(Boolean).join(", ") || "Main Outlet"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleStatus(outlet.id, outlet.isActive)}
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-all select-none ${outlet.isActive
                          ? "bg-[#6b5dd3]/10 text-[#6b5dd3] border border-[#6b5dd3]/20"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                    >
                      <span
                        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${outlet.isActive ? "bg-[#6b5dd3]" : "bg-slate-400"
                          }`}
                      />
                      {outlet.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    {outlet.address && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{outlet.address}</span>
                      </p>
                    )}
                    <div className="flex items-center gap-4">
                      {outlet.postalCode && (
                        <p className="font-mono text-slate-500">
                          Postal: <span className="font-medium text-slate-700">{outlet.postalCode}</span>
                        </p>
                      )}
                      {outlet.phone && (
                        <p className="font-mono text-slate-500 flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {outlet.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {canManageOutlets && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenEdit(outlet)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(outlet)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-red-100 py-2 text-xs font-medium text-red-600 bg-red-50/30 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Empty Search Fallback State */}
            {filteredOutlets.length === 0 && (
              <div className="py-12 text-center text-sm text-slate-400 px-4">
                No outlets match your search or filter parameters.
              </div>
            )}
          </>
        )}

        {/* Footer Pagination Controls */}
        <div className="flex flex-col gap-4 items-center justify-between border-t border-slate-100 bg-white px-6 py-4 sm:flex-row">
          <div className="text-sm text-slate-500 hidden sm:block"></div>

          <div className="flex items-center justify-between w-full sm:w-auto gap-6">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors touch-manipulation"
                title="Previous Page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors touch-manipulation"
                title="Next Page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Modal Overlay */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-xl bg-white shadow-xl border border-slate-100 overflow-hidden my-auto"
          >
            {/* Modal Header with Purple Banner */}
            <div className="relative flex items-center justify-center bg-[#6b5dd3] p-5 text-white sm:p-6">
              <div className="hidden h-10 w-10 items-center justify-center text-white sm:flex">
                <Store className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-white text-center sm:text-2xl">
                {editingOutlet ? "Edit Outlet" : "Add New Outlet"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/80 hover:bg-white/10 hover:text-white transition-colors sm:right-6"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6 sm:mt-6">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-6">
                {/* Outlet Name */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 sm:text-sm sm:mb-2">
                    Outlet Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Main Branch, Downtown Outlet"
                    className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-[#6b5dd3] focus:outline-none focus:ring-4 focus:ring-[#6b5dd3]/10 transition-all"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 sm:text-sm sm:mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="e.g. +977 1-4221100"
                      className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-[#6b5dd3] focus:outline-none focus:ring-4 focus:ring-[#6b5dd3]/10 transition-all"
                    />
                    <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Street Address */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 sm:text-sm sm:mb-2">
                    Street Address
                  </label>
                  <div className="relative">
                    <input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="e.g. Ward 4, Durbar Marg"
                      className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-[#6b5dd3] focus:outline-none focus:ring-4 focus:ring-[#6b5dd3]/10 transition-all"
                    />
                    <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 sm:text-sm sm:mb-2">
                    City
                  </label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Kathmandu"
                    className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-[#6b5dd3] focus:outline-none focus:ring-4 focus:ring-[#6b5dd3]/10 transition-all"
                  />
                </div>

                {/* State / Province */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 sm:text-sm sm:mb-2">
                    State / Province
                  </label>
                  <input
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="e.g. Bagmati"
                    className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-[#6b5dd3] focus:outline-none focus:ring-4 focus:ring-[#6b5dd3]/10 transition-all"
                  />
                </div>

                {/* Postal Code */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 sm:text-sm sm:mb-2">
                    Postal Code
                  </label>
                  <input
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    placeholder="e.g. 44600"
                    className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-[#6b5dd3] focus:outline-none focus:ring-4 focus:ring-[#6b5dd3]/10 transition-all font-mono"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 sm:text-sm sm:mb-2">
                    Country
                  </label>
                  <input
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    placeholder="e.g. Nepal"
                    className="w-full rounded-lg border border-slate-200/80 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400/80 bg-slate-50/30 focus:bg-white focus:border-[#6b5dd3] focus:outline-none focus:ring-4 focus:ring-[#6b5dd3]/10 transition-all"
                  />
                </div>

                {/* Outlet Status */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500 sm:text-sm sm:mb-2">
                    Outlet Status
                  </label>
                  <select
                    value={form.isActive ? "active" : "inactive"}
                    onChange={(e) => setForm({ ...form, isActive: e.target.value === "active" })}
                    className="w-full rounded-lg border border-slate-200/80 bg-slate-50/30 px-3 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-[#6b5dd3] focus:outline-none focus:ring-4 focus:ring-[#6b5dd3]/10 transition-all"
                  >
                    <option value="active">Active </option>
                    <option value="inactive">Inactive </option>
                  </select>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-lg bg-[#6b5dd3] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#5a4dbf] transition-colors disabled:opacity-60"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingOutlet ? "Save Changes" : "Create Outlet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - identical to staff page */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-100 overflow-hidden my-auto"
          >
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Trash2 className="h-6 w-6" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Remove Outlet</h2>
              <p className="mt-2 text-sm text-slate-500 px-2">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-slate-700">{deleteTarget.name}</span>{" "}
                from outlets?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 border-t border-slate-100 p-4 bg-slate-50/50 sm:p-6">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteOutlet}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
