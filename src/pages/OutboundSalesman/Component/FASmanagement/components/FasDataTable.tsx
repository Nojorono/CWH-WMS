import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { FaEdit, FaPlus, FaSearch, FaTrash, FaSyncAlt } from "react-icons/fa";
import {
  fasManagementService,
  parseFasApiError,
} from "../services/FasManagementService";
import type { FasListMeta, FasUser, FasUserPayload } from "../types";
import { FasFormModal } from "./FasFormModal";
import { usePersistAuthStore } from "../../../../../API/store/AuthStore/PersistAuthStore";
import { useDebounce } from "../../../../../helper/useDebounce";
import { showErrorToast, showSuccessToast } from "../../../../../components/toast";
import Button from "../../../../../components/ui/button/Button";
import { showConfirmDialog } from "../../../../../components/swal-confirm";

const LIMIT_OPTIONS = [10, 20, 50, 100];

export const FasDataTable = () => {
  const user = usePersistAuthStore((s) => s.user);
  const globalIoList = usePersistAuthStore((s) => s.ioList) || [];

  const defaultOrganizationId =
    user?.userDetail?.organizationId ||
    user?.userDetail?.organization?.id ||
    "";

  const organizationOptions = useMemo(() => {
    const orgId = user?.userDetail?.organization?.id || null;
    const list = orgId
      ? globalIoList.filter((io: any) => String(io?.id) === String(orgId))
      : globalIoList;

    return (list || []).map((io: any) => ({
      label: [io.organization_name, io.organization_code]
        .filter(Boolean)
        .join(" — "),
      value: String(io.id),
    }));
  }, [globalIoList, user]);

  const [rows, setRows] = useState<FasUser[]>([]);
  const [meta, setMeta] = useState<FasListMeta | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState(
    defaultOrganizationId || "",
  );
  const debouncedName = useDebounce(nameFilter, 400);
  const debouncedEmail = useDebounce(emailFilter, 400);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRow, setEditingRow] = useState<FasUser | null>(null);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fasManagementService.getList({
        page,
        limit,
        sortOrder,
        organization_id: organizationFilter || undefined,
        name: debouncedName || undefined,
        email: debouncedEmail || undefined,
      });
      setRows(result.data);
      setMeta(result.meta);
    } catch (error) {
      setRows([]);
      setMeta(null);
      showErrorToast(parseFasApiError(error, "Gagal memuat data FAS User"));
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    limit,
    sortOrder,
    organizationFilter,
    debouncedName,
    debouncedEmail,
  ]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  // Reset ke halaman 1 saat filter/limit/sort berubah (tanpa fetch dobel di halaman lama)
  useEffect(() => {
    setPage((prev) => (prev === 1 ? prev : 1));
  }, [debouncedName, debouncedEmail, organizationFilter, limit, sortOrder]);

  const openCreate = () => {
    setModalMode("create");
    setEditingRow(null);
    setModalOpen(true);
  };

  const openEdit = (row: FasUser) => {
    setModalMode("edit");
    setEditingRow(row);
    setModalOpen(true);
  };

  const handleSubmit = async (payload: FasUserPayload) => {
    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        await fasManagementService.create(payload);
        showSuccessToast("User FAS berhasil ditambahkan");
      } else if (editingRow?.id) {
        await fasManagementService.update(editingRow.id, payload);
        showSuccessToast("User FAS berhasil diupdate");
      }
      setModalOpen(false);
      setEditingRow(null);
      await fetchList();
    } catch (error) {
      showErrorToast(parseFasApiError(error, "Gagal menyimpan User FAS"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (row: FasUser) => {
    showConfirmDialog(async () => {
      try {
        await fasManagementService.remove(row.id);
        showSuccessToast(`User FAS "${row.name}" berhasil dihapus`);
        await fetchList();
      } catch (error) {
        showErrorToast(parseFasApiError(error, "Gagal menghapus User FAS"));
      }
    });
  };

  const columns = useMemo<ColumnDef<FasUser>[]>(
    () => [
      {
        id: "no",
        header: "No",
        cell: ({ row }) => (page - 1) * limit + row.index + 1,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-800">
            {row.original.name || "-"}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.original.email || "-",
      },
      {
        id: "organization",
        header: "Organization",
        cell: ({ row }) => {
          const { organization_name, organization_code, organization, organization_id } =
            row.original;
          const name = organization_name || organization?.organization_name;
          const code = organization_code || organization?.organization_code;
          if (name || code) {
            return [name, code].filter(Boolean).join(" — ");
          }
          const matched = organizationOptions.find(
            (o) => o.value === String(organization_id),
          );
          return matched?.label || organization_id || "-";
        },
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openEdit(row.original)}
              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              title="Edit"
            >
              <FaEdit size={11} /> Edit
            </button>
            <button
              type="button"
              onClick={() => handleDelete(row.original)}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              title="Delete"
            >
              <FaTrash size={11} /> Delete
            </button>
          </div>
        ),
      },
    ],
    [page, limit, organizationOptions],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: meta?.totalPages || 1,
  });

  const totalPages = meta?.totalPages || 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Outbound Salesman
          </p>
          <h2 className="text-xl font-bold text-slate-800">FAS Management</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchList()}
            disabled={isLoading}
            startIcon={<FaSyncAlt size={12} />}
          >
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={openCreate}
            startIcon={<FaPlus size={12} />}
          >
            Tambah User
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-500 uppercase">
            Organization
          </label>
          <select
            value={organizationFilter}
            onChange={(e) => setOrganizationFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          >
            <option value="">Semua Organization</option>
            {organizationOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-500 uppercase">
            Name
          </label>
          <div className="relative">
            <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={12} />
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Cari name..."
              className="w-full rounded-lg border border-slate-300 py-2 pr-3 pl-9 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-500 uppercase">
            Email
          </label>
          <input
            type="text"
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            placeholder="Cari email..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>
        {/* <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-500 uppercase">
            Sort
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "ASC" | "DESC")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          >
            <option value="DESC">Terbaru (DESC)</option>
            <option value="ASC">Terlama (ASC)</option>
          </select>
        </div> */}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 font-semibold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="text-slate-700">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    Memuat data FAS User...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-10 text-center italic text-slate-400"
                  >
                    Tidak ada data FAS User
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 hover:bg-slate-50/70"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Halaman {meta?.page ?? page} dari {totalPages} ({meta?.total ?? 0}{" "}
              data)
            </span>
            <label className="inline-flex items-center gap-2">
              <span className="text-slate-500">Rows per page</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                disabled={isLoading}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none disabled:opacity-50"
              >
                {LIMIT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!meta?.hasPreviousPage || isLoading || page <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!meta?.hasNextPage || isLoading || page >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <FasFormModal
        isOpen={modalOpen}
        mode={modalMode}
        initial={editingRow}
        organizationOptions={organizationOptions}
        defaultOrganizationId={
          organizationFilter || defaultOrganizationId || ""
        }
        isSubmitting={isSubmitting}
        onClose={() => {
          if (isSubmitting) return;
          setModalOpen(false);
          setEditingRow(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
