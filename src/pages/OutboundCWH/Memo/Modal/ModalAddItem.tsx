import React, { useEffect, useState } from "react";
import Button from "../../../../components/ui/button/Button";
import {
  useStoreItem,
  useStoreUom,
  useStoreClassification,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import Select from "../../../../components/form/Select";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";

interface ItemData {
  item_id: string;
  sku: string;
  item_number: string;
  item_name: string;
  item_description: string;
  quantity_plan: number;
  uom_id: string;
  uom_name: string;
  classification_id: string;
  classification_name: string;
  notes: string;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: ItemData) => void;
  organizationName?: string;
  requireOrganizationName?: boolean;
};

type ValidateStatus = "idle" | "loading" | "valid" | "invalid";

type ValidatedItem = {
  item_code?: string;
  item_number?: string;
  item_description?: string;
  inventory_item_id?: number;
  organization_code?: string;
};

const ModalAddItem: React.FC<Props> = ({
  open,
  onClose,
  onSubmit,
  organizationName,
  requireOrganizationName = false,
}) => {
  const { fetchAll, list } = useStoreItem();
  const { fetchAll: fetchAllUom, list: uomList } = useStoreUom();
  const { fetchAll: fetchAllClassification, list: classificationList } =
    useStoreClassification();

  useEffect(() => {
    fetchAll();
    fetchAllUom();
    fetchAllClassification();
  }, []);

  const [selectedSku, setSelectedSku] = useState("");
  const [selectedUom, setSelectedUom] = useState("");
  const [selectedClassification, setSelectedClassification] = useState("");
  const [qty, setQty] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [validateStatus, setValidateStatus] = useState<ValidateStatus>("idle");
  const [validateMessage, setValidateMessage] = useState("");
  const [validatedItem, setValidatedItem] = useState<ValidatedItem | null>(
    null,
  );

  const resolvedOrganizationName = String(organizationName ?? "").trim();
  const hasOrganizationName = Boolean(resolvedOrganizationName);
  const needsOrgValidation = requireOrganizationName || hasOrganizationName;

  const selectedItem = list.find((i: any) => i.sku === selectedSku);
  const inventoryItemId =
    selectedItem?.inventory_item_id ??
    (selectedItem as any)?.inventoryItemId ??
    null;

  // Defaultkan UOM ke DUS kalau ada
  useEffect(() => {
    if (uomList.length > 0 && !selectedUom) {
      const dus = uomList.find((u: any) => u.code === "DUS");
      if (dus) setSelectedUom(String(dus.id));
    }
  }, [uomList, selectedUom]);

  // Reset pilihan SKU jika organization AMO berubah
  useEffect(() => {
    setSelectedSku("");
    setValidateStatus("idle");
    setValidateMessage("");
    setValidatedItem(null);
  }, [resolvedOrganizationName]);

  // Validasi item ke cabang (AMO)
  useEffect(() => {
    if (!open || !needsOrgValidation) {
      setValidateStatus("idle");
      setValidateMessage("");
      setValidatedItem(null);
      return;
    }

    if (!selectedSku) {
      setValidateStatus("idle");
      setValidateMessage("");
      setValidatedItem(null);
      return;
    }

    if (!hasOrganizationName) {
      setValidateStatus("invalid");
      setValidateMessage("Organization code tidak tersedia.");
      setValidatedItem(null);
      return;
    }

    if (inventoryItemId == null || inventoryItemId === "") {
      setValidateStatus("invalid");
      setValidateMessage(
        "inventory_item_id tidak ditemukan pada item yang dipilih.",
      );
      setValidatedItem(null);
      return;
    }

    let cancelled = false;

    const validateItem = async () => {
      setValidateStatus("loading");
      setValidateMessage("");
      setValidatedItem(null);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.sku;
        return next;
      });

      try {
        const res = await axiosInstance.get("master-item/validate-item", {
          params: {
            organization_code: resolvedOrganizationName,
            inventory_item_id: inventoryItemId,
          },
        });

        if (cancelled) return;

        const rows = (res.data?.data ?? []) as ValidatedItem[];
        if (!Array.isArray(rows) || rows.length === 0) {
          setValidateStatus("invalid");
          setValidateMessage(
            res.data?.message ||
              "Item tidak tersedia untuk organization ini.",
          );
          setValidatedItem(null);
          setErrors((prev) => ({
            ...prev,
            sku: "Item tidak tersedia untuk cabang ini.",
          }));
          return;
        }

        setValidateStatus("valid");
        setValidatedItem(rows[0]);
        setValidateMessage(res.data?.message || "Item tersedia untuk cabang.");
      } catch (err: any) {
        if (cancelled) return;
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Gagal validasi item ke cabang.";
        setValidateStatus("invalid");
        setValidateMessage(message);
        setValidatedItem(null);
        setErrors((prev) => ({
          ...prev,
          sku: message,
        }));
      }
    };

    validateItem();
    return () => {
      cancelled = true;
    };
  }, [
    open,
    needsOrgValidation,
    hasOrganizationName,
    resolvedOrganizationName,
    selectedSku,
    inventoryItemId,
  ]);

  if (!open) return null;
  if (requireOrganizationName && !hasOrganizationName) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedSku) newErrors.sku = "SKU wajib dipilih";
    if (!qty || qty <= 0) newErrors.qty = "Qty harus lebih besar dari 0";
    if (!selectedUom) newErrors.uom = "UOM wajib dipilih";
    if (needsOrgValidation) {
      if (validateStatus === "loading") {
        newErrors.sku = "Sedang memvalidasi item ke cabang...";
      } else if (validateStatus !== "valid") {
        newErrors.sku =
          validateMessage ||
          "Item tidak tersedia untuk organization/cabang ini.";
      }
    }
    return newErrors;
  };

  const resetForm = () => {
    setSelectedSku("");
    setSelectedUom("");
    setSelectedClassification("");
    setQty("");
    setNotes("");
    setErrors({});
    setValidateStatus("idle");
    setValidateMessage("");
    setValidatedItem(null);
  };

  const handleSubmit = () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    const itemData: ItemData = {
      item_id: selectedItem?.id ?? "",
      sku: validatedItem?.item_code || selectedItem?.sku || "",
      item_number:
        validatedItem?.item_number || selectedItem?.item_number || "",
      item_name: validatedItem?.item_code || selectedItem?.sku || "",
      item_description:
        validatedItem?.item_description || selectedItem?.description || "",
      quantity_plan: Number(qty),
      uom_id: selectedUom,
      uom_name: uomList.find((u: any) => u.id === selectedUom)?.code || "",
      classification_id: selectedClassification,
      classification_name:
        classificationList.find((c: any) => c.id === selectedClassification)
          ?.classification_name || "",
      notes,
    };

    onSubmit(itemData);
    onClose();
    resetForm();
  };

  const canSubmit = !needsOrgValidation || validateStatus === "valid";

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center"
      style={{ zIndex: 2147483647 }}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-xl shadow-lg w-[450px] p-6 space-y-4 relative"
        style={{ zIndex: 2147483648 }}
      >
        <h2 className="text-xl font-bold text-indigo-800">Add Item Memo</h2>
        {hasOrganizationName && (
          <p className="text-xs text-slate-500 -mt-2">
            Organization/Cabang{" "}
            <span className="font-bold text-indigo-700">
              {resolvedOrganizationName}
            </span>
          </p>
        )}

        <div className="space-y-3">
          {/* SKU Dropdown */}
          <div>
            <label className="block text-sm font-medium">SKU</label>

            <Select
              options={list.map((s: any) => ({
                value: s.sku,
                label: s.sku,
              }))}
              value={selectedSku}
              onChange={(val) => {
                setSelectedSku(val);
                setValidateStatus("idle");
                setValidateMessage("");
                setValidatedItem(null);
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.sku;
                  return next;
                });
              }}
              placeholder="-- Select SKU --"
              className="w-full"
              width={"100%"}
            />

            {needsOrgValidation && validateStatus === "loading" && (
              <p className="text-xs text-blue-600 mt-1 font-medium">
                Memvalidasi item ke cabang {resolvedOrganizationName}...
              </p>
            )}
            {needsOrgValidation && validateStatus === "valid" && (
              <p className="text-xs text-emerald-600 mt-1 font-medium">
                ✓  Item tersedia untuk cabang ini.
              </p>
            )}
            {(errors.sku ||
              (needsOrgValidation && validateStatus === "invalid")) && (
              <p className="text-xs text-red-500 mt-1">
                X Item tidak tersedia untuk cabang ini.
              </p>
            )}
          </div>

          {/* Item Description */}
          <div>
            <label className="block text-sm font-medium">Item Description</label>
            <input
              className="border rounded p-2 w-full bg-gray-100"
              value={
                validatedItem?.item_description ??
                selectedItem?.description ??
                ""
              }
              readOnly
            />
          </div>

          {/* Item Number */}
          <div>
            <label className="block text-sm font-medium">Item Number</label>
            <input
              className="border rounded p-2 w-full bg-gray-100"
              value={
                validatedItem?.item_number ?? selectedItem?.item_number ?? ""
              }
              readOnly
            />
          </div>

          {/* UOM Dropdown */}
          <div>
            <label className="block text-sm font-medium">UOM</label>
            <Select
              options={uomList.map((u: any) => ({
                value: u.id,
                label: u.code,
              }))}
              value={selectedUom}
              onChange={(val) => setSelectedUom(val)}
              placeholder="-- Select UOM --"
              className="w-full"
              width={"100%"}
            />
            {errors.uom && (
              <p className="text-xs text-red-500 mt-1">{errors.uom}</p>
            )}
          </div>

          {/* Qty */}
          <div>
            <label className="block text-sm font-medium">Qty Plan</label>
            <input
              type="number"
              value={qty}
              onChange={(e) =>
                setQty(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="Masukkan qty"
              className="border rounded p-2 w-full"
            />
            {errors.qty && (
              <p className="text-xs text-red-500 mt-1">{errors.qty}</p>
            )}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-3 mt-4">
          <Button
            variant="secondary"
            onClick={() => {
              onClose();
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit || validateStatus === "loading"}
          >
            {validateStatus === "loading" ? "Validating..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModalAddItem;
