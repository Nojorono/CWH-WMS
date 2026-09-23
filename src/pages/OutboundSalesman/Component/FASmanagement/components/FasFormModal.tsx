import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import type { FasUser, FasUserPayload } from "../types";
import Button from "../../../../../components/ui/button/Button";

type FasFormModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  initial?: FasUser | null;
  organizationOptions: { label: string; value: string }[];
  defaultOrganizationId?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: FasUserPayload) => Promise<void> | void;
};

const emptyForm = (orgId = ""): FasUserPayload => ({
  organization_id: orgId,
  name: "",
  email: "",
});

export const FasFormModal = ({
  isOpen,
  mode,
  initial,
  organizationOptions,
  defaultOrganizationId = "",
  isSubmitting = false,
  onClose,
  onSubmit,
}: FasFormModalProps) => {
  const [form, setForm] = useState<FasUserPayload>(emptyForm(defaultOrganizationId));
  const [errors, setErrors] = useState<Partial<Record<keyof FasUserPayload, string>>>({});

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" && initial) {
      setForm({
        organization_id:
          initial.organization_id ||
          initial.organization?.id ||
          defaultOrganizationId,
        name: initial.name || "",
        email: initial.email || "",
      });
    } else {
      setForm(emptyForm(defaultOrganizationId));
    }
    setErrors({});
  }, [isOpen, mode, initial, defaultOrganizationId]);

  if (!isOpen) return null;

  const validate = () => {
    const next: Partial<Record<keyof FasUserPayload, string>> = {};
    if (!form.organization_id.trim()) next.organization_id = "Organization wajib dipilih";
    if (!form.name.trim()) next.name = "Name wajib diisi";
    if (!form.email.trim()) next.email = "Email wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Format email tidak valid";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;
    await onSubmit({
      organization_id: form.organization_id.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[15000] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              FAS Management
            </p>
            <h3 className="text-lg font-bold text-slate-800">
              {mode === "create" ? "Tambah User FAS" : "Edit User FAS"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Organization
            </label>
            <select
              value={form.organization_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, organization_id: e.target.value }))
              }
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50"
            >
              <option value="">Pilih Organization</option>
              {organizationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.organization_id && (
              <p className="mt-1 text-xs text-red-600">{errors.organization_id}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={isSubmitting}
              placeholder="fas.admin"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              disabled={isSubmitting}
              placeholder="fas.admin@nna-id.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting
                ? "Menyimpan..."
                : mode === "create"
                  ? "Simpan"
                  : "Update"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
