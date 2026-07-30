"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../../../components/ui/button/Button";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import ModalAddItem from "../Modal/ModalAddItem";
import DynamicForm, {
  FieldConfig,
} from "../../../../components/wms-components/inbound-component/form/DynamicForm";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import Swal from "sweetalert2";
import {
  useStoreItem,
  useStoreOutboundMemo,
  useStoreUom,
} from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useLocation, useNavigate } from "react-router";
import { EndPoint } from "../../../../utils/EndPoint";
import { useCustomerByOutboundType } from "./FetchCustomer";
import Select from "../../../../components/form/Select";
import { FaArrowLeft, FaCheck, FaSearch, FaUndo } from "react-icons/fa";
import { formatDateIndo } from "../../../../helper/FormatDate";
import { showConfirmDialog } from "../../../../components/swal-confirm";
import TableComponent from "../../../../components/tables/ActionTable/TableComponent";
import { SOsearchService } from "../../../../DynamicAPI/services/Service/SOsearchService";
import { SOHeaderInfo } from "../../../../DynamicAPI/types/searchSO";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";

// ✅ Tambahkan selected_destination
type MemoFormValues = {
  requestor: string;
  origin: string;
  ship_to: string;
  destination: string;
  delivery_date: string;
  notes: string;
  address?: string;

  type_outbound?: {
    label: string;
    value: string;
  } | null;

  selected_destination?: {
    label: string;
    value: string;
    id?: string;
  } | null;
};

type ItemRow = {
  item_id: string;
  item_name: string;
  classification_name?: string;
  quantity_plan: number;
  uom?: string;
  uom_name?: string;
  notes?: string;
  address?: string;
  /** true jika item berasal dari hasil Search SO (SUBDIST) */
  from_so?: boolean;
  /** Batas max qty dari API SO — quantity_plan tidak boleh melebihi ini */
  max_quantity_plan?: number;
};

const escapeHtml = (value?: string | null) =>
  String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const buildMemoSoValidationSwalHtml = ({
  message,
  headerInfo,
  expectedLabel,
  expectedValue,
  orgName,
  soNo,
}: {
  message: string;
  headerInfo?: SOHeaderInfo | null;
  expectedLabel: string;
  expectedValue: string;
  orgName?: string;
  soNo?: string;
}) => {
  const rows: Array<{
    label: string;
    value?: string | null;
    highlight?: boolean;
  }> = [
    { label: "Nomor SO", value: soNo || headerInfo?.orderNumber?.toString() },
    { label: "User Current Organization Name", value: orgName },
    { label: "SO Type", value: headerInfo?.soType },
    {
      label: "Organization Code From",
      value: headerInfo?.organizationCodeFrom,
    },
    { label: "Organization Code To", value: headerInfo?.organizationCodeTo },
    {
      label: expectedLabel,
      value: expectedValue,
      highlight: true,
    },
  ];

  const tableRows = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;font-weight:600;white-space:nowrap;width:42%;">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;color:${row.highlight ? "#1d4ed8" : "#0f172a"};font-weight:${row.highlight ? "700" : "600"};">
            ${escapeHtml(row.value)}
          </td>
        </tr>
      `,
    )
    .join("");

  return `
    <p style="text-align:left;font-size:13px;color:#334155;line-height:1.55;margin:0 0 14px;">
      ${escapeHtml(message)}
    </p>
    <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;text-align:left;">
      <table style="width:100%;border-collapse:collapse;background:#ffffff;">
        <thead>
          <tr>
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#475569;background:#f8fafc;border-bottom:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.04em;">
              Field
            </th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#475569;background:#f8fafc;border-bottom:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.04em;">
              Value
            </th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
  `;
};

const showMemoSoValidationSwal = async ({
  title,
  message,
  headerInfo,
  expectedLabel,
  expectedValue,
  orgName,
  soNo,
}: {
  title: string;
  message: string;
  headerInfo?: SOHeaderInfo | null;
  expectedLabel: string;
  expectedValue: string;
  orgName?: string;
  soNo?: string;
}) => {
  await Swal.fire({
    icon: "warning",
    title,
    html: buildMemoSoValidationSwalHtml({
      message,
      headerInfo,
      expectedLabel,
      expectedValue,
      orgName,
      soNo,
    }),
    confirmButtonText: "Mengerti",
    confirmButtonColor: "#3085d6",
    width: 620,
  });
};

const showMemoSoValidationSuccessSwal = async ({
  headerInfo,
  expectedLabel,
  expectedValue,
  orgName,
  soNo,
}: {
  headerInfo?: SOHeaderInfo | null;
  expectedLabel: string;
  expectedValue: string;
  orgName?: string;
  soNo?: string;
}) => {
  return Swal.fire({
    icon: "success",
    title: "SO Valid untuk Memo SUBDIST",
    html: buildMemoSoValidationSwalHtml({
      message:
        "Nomor SO telah tervalidasi dan memenuhi kriteria Memo SUBDIST. Klik OK untuk lanjut mapping item ke tabel SKU.",
      headerInfo,
      expectedLabel,
      expectedValue,
      orgName,
      soNo,
    }),
    confirmButtonText: "OK, Lanjutkan",
    confirmButtonColor: "#16a34a",
    width: 620,
  });
};

const warnQtyExceedsSoApi = (itemName?: string, max?: number) => {
  const maxLabel = max != null ? String(max) : "-";
  return Swal.fire({
    icon: "warning",
    title: "Qty Melebihi Batas",
    text: itemName
      ? `Item "${itemName}" tidak boleh melebihi qty dari data SO (${maxLabel}).`
      : `Qty Plan tidak boleh melebihi qty dari data SO (${maxLabel}).`,
    confirmButtonText: "Mengerti",
    confirmButtonColor: "#3085d6",
  });
};

const LoadingIndicator = () => (
  <div className="flex justify-center items-center min-h-[300px]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500 border-solid"></div>
  </div>
);

const TableCellInput = ({
  initialValue,
  onUpdate,
  max,
  itemName,
}: {
  initialValue: any;
  onUpdate: (val: any) => void;
  max?: number;
  itemName?: string;
}) => {
  // State lokal: menahan ketikan secara instan tanpa menunggu parent render
  const [value, setValue] = useState(initialValue);

  // Tetap sinkron jika data tiba-tiba berubah dari luar (misal hasil Search SO)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const applyValue = (raw: string, fromBlur = false) => {
    if (raw === "") {
      setValue("");
      onUpdate("");
      return;
    }

    let next = Number(raw);
    if (Number.isNaN(next)) return;
    if (next < 0) next = 0;

    // Jangan force ke max — beri warning, kembalikan ke nilai sebelumnya
    if (max != null && next > max) {
      warnQtyExceedsSoApi(itemName, max);
      setValue(initialValue ?? "");
      return;
    }

    setValue(next);
    onUpdate(next);
  };

  return (
    <input
      type="number"
      min={0}
      className="w-28 px-2 py-1 border rounded focus:ring-2 focus:ring-orange-500 outline-none transition-all"
      value={value ?? ""}
      onChange={(e) => {
        // Izinkan ketikan bebas di UI; validasi max saat blur / Enter
        setValue(e.target.value);
      }}
      onBlur={(e) => applyValue(e.target.value, true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          applyValue((e.target as HTMLInputElement).value, true);
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
};

const CreateMemo: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = usePersistAuthStore((state) => state.user);
  const roleName = user?.role?.name;
  const NIK = user?.userDetail?.employee_id;
  const orgId =
    user?.userDetail?.organizationId || user?.userDetail?.organization?.id;
  const orgCode = user?.userDetail?.organization?.organization_code;
  const orgName = user?.userDetail?.organization?.organization_name;

  const { data: memoId, mode, title } = location.state || {};
  const isDetail = mode === "detail";
  const isEdit = mode === "edit";

  const [isLoading, setIsLoading] = useState(false);
  const [soHeaderData, setSoHeaderData] = useState<SOHeaderInfo | null>(null);
  const prevTypeOutbound = React.useRef<string | undefined>(undefined);

  // store
  const { fetchAll: fetchAllUom, list: uomList } = useStoreUom();
  const { fetchAll: fetchAllItems, list: masterItemList } = useStoreItem();
  const {
    createData,
    fetchById,
    detail: detailDataMemo,
    resetDetail,
    updateData,
  } = useStoreOutboundMemo();

  useEffect(() => {
    fetchAllUom();
    fetchAllItems();
  }, [fetchAllUom, fetchAllItems]);

  const methods = useForm<MemoFormValues>({
    defaultValues: {
      requestor: "",
      origin: "",
      ship_to: "",
      destination: "",
      delivery_date: "",
      notes: "",
      selected_destination: null,
    },
  });

  const [items, setItems] = useState<ItemRow[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [soSearchNumber, setSoSearchNumber] = useState("");
  const [isLoadingSO, setIsLoadingSO] = useState(false);

  // ✅ Watch type_outbound
  const typeOutbound = methods.watch("type_outbound");

  // ✅ Fetch customer berdasarkan type_outbound
  const {
    customerList,
    customerRaw,
    loading: loadingCustomer,
  } = useCustomerByOutboundType(typeOutbound, methods);

  console.log("customerList", customerList);
  console.log("customerRaw", customerRaw);

  // ✅ Watch selected_destination
  const selectedCustomer = methods.watch("selected_destination");

  /** AMO: organization_name dari customerRaw berdasarkan destination terpilih */
  const amoOrganizationName = useMemo(() => {
    if (typeOutbound?.value !== "AMO" || !selectedCustomer) return "";

    const found = customerRaw.find((x: any) => {
      if (selectedCustomer.id && x.id === selectedCustomer.id) return true;
      return x.organization_code === selectedCustomer.value;
    });

    return String(found?.organization_name ?? "").trim();
  }, [typeOutbound?.value, selectedCustomer, customerRaw]);

  const isAmoType = typeOutbound?.value === "AMO";
  const hasAmoOrganizationName = Boolean(amoOrganizationName);
  /** AMO wajib punya Organization Name; selain AMO boleh lanjut */
  const canProceedAddItem = !isAmoType || hasAmoOrganizationName;

  const handleOpenAddItem = () => {
    if (!canProceedAddItem) {
      showErrorToast(
        "Organization Name tidak tersedia. Pilih AMO Destination yang valid terlebih dahulu.",
      );
      return;
    }
    setOpenModal(true);
  };

  // Tutup modal jika Organization Name hilang (ganti destination / type)
  useEffect(() => {
    if (isAmoType && !hasAmoOrganizationName && openModal) {
      setOpenModal(false);
    }
  }, [isAmoType, hasAmoOrganizationName, openModal]);

  // ✅ Auto set ship_to setelah pilih customer
  useEffect(() => {
    if (
      !selectedCustomer ||
      typeOutbound?.value !== "AMO" ||
      customerRaw.length === 0
    )
      return;

    const found = customerRaw.find((x: any) => {
      if (typeOutbound.value === "AMO") {
        return x.organization_code === selectedCustomer.value;
      }
      return x.shipToLocation === selectedCustomer.label;
    });

    if (!found) return;

    const isAMO = typeOutbound.value === "AMO";
    const newShipTo = isAMO ? found.organization_code : found.shipToLocation;
    const newAddress = isAMO ? found.address : found.address1;

    // ✅ HANYA setValue jika datanya memang berubah
    if (methods.getValues("ship_to") !== newShipTo) {
      methods.setValue("ship_to", newShipTo || "");
    }

    if (methods.getValues("address") !== newAddress) {
      methods.setValue("address", newAddress || "");
    }

    // ✅ KHUSUS AMO: Update ID tanpa memicu loop pada object selected_destination
    if (isAMO && selectedCustomer.id !== found.id) {
      methods.setValue("selected_destination", {
        ...selectedCustomer,
        id: found.id,
      });
    }
  }, [selectedCustomer, typeOutbound, customerRaw]);

  // useEffect(() => {
  //   setSoHeaderData(null);
  //   setSoSearchNumber("");
  //   setItems([]);

  //   methods.setValue("ship_to", "");
  //   methods.setValue("address", "");
  //   methods.setValue("selected_destination", null);
  // }, [typeOutbound?.value, methods]);

  useEffect(() => {
    const currentType = typeOutbound?.value;

    if (
      prevTypeOutbound.current !== undefined &&
      currentType !== prevTypeOutbound.current
    ) {
      setSoHeaderData(null);
      setSoSearchNumber("");
      setItems([]);
      methods.setValue("ship_to", "");
      methods.setValue("address", "");
      methods.setValue("selected_destination", null);
    }

    prevTypeOutbound.current = currentType;
  }, [typeOutbound?.value, methods]);

  // konfigurasi fields dynamic form
  const fieldsConfig: FieldConfig[] = [
    {
      name: "delivery_date",
      label: "Delivery Date",
      type: "date",
      validation: { required: "Delivery Date is required" },
    },

    ...(isDetail
      ? [
          {
            name: "origin",
            label: "Origin",
            type: "text" as const,
            disabled: true,
          },
          {
            name: "requestor",
            label: "Requestor",
            type: "text" as const,
          },
        ]
      : []),

    ...(!isDetail
      ? [
          {
            name: "type_outbound",
            label: "Type Outbound",
            type: "select",
            options: [
              { label: "AMO", value: "AMO" },
              { label: "SUBDIST", value: "SUBDIST" },
            ],
          } as FieldConfig,
        ]
      : []),

    ...(!isDetail && typeOutbound?.value === "AMO"
      ? [
          {
            name: "selected_destination",
            label: loadingCustomer ? "Loading..." : "Select AMO Destination",
            type: "select",
            options: customerList,
            validation: { required: "Destination is required" },
          } as FieldConfig,
        ]
      : []),

    {
      name: "ship_to",
      label: "Ship To",
      type: "text",
      disabled: true,
      validation: { required: "Ship To is required" },
    },
    {
      name: "address",
      label: "Ship Address",
      type: "textarea",
      disabled: true,
    },
    {
      name: "notes",
      label: "Notes",
      type: "textarea",
    },
  ];

  // 1️⃣ Reset saat mode create
  useEffect(() => {
    if (!isDetail && !isEdit) {
      // Hapus detail di store
      resetDetail();

      // Reset form react-hook-form
      methods.reset({
        requestor: "",
        origin: "",
        ship_to: "",
        destination: "",
        delivery_date: "",
        notes: "",
      });

      // Kosongkan item list
      setItems([]);
    }
  }, [isDetail, isEdit, resetDetail, methods]);

  // 2️⃣ Fetch detail jika mode edit/detail
  useEffect(() => {
    if ((isDetail || isEdit) && memoId) {
      fetchById(memoId);
    }
  }, [isDetail, isEdit, memoId, fetchById]);

  // 3️⃣ Populate form hanya kalau detail ada & mode bukan create
  useEffect(() => {
    // jika tidak ada detail atau sedang create, stop
    if (!detailDataMemo || (!isDetail && !isEdit)) return;
    const dateOnly = formatDateIndo(detailDataMemo.delivery_date);

    methods.reset({
      requestor: detailDataMemo.requestor || "",
      origin: detailDataMemo.origin || "",
      ship_to: detailDataMemo.destination || "",
      address: detailDataMemo.ship_to || "",
      delivery_date: dateOnly,
      notes: detailDataMemo.notes || "",
      type_outbound: detailDataMemo.type
        ? { label: detailDataMemo.type, value: detailDataMemo.type }
        : null,
      selected_destination: detailDataMemo.destination
        ? {
            label: detailDataMemo.destination,
            value: detailDataMemo.destination,
          }
        : null,
    });

    if (detailDataMemo.type === "SUBDIST" && detailDataMemo.so_number) {
      const fetchExistingSO = async () => {
        try {
          const { headerInfo } = await SOsearchService(
            String(detailDataMemo.so_number),
            masterItemList,
            uomList,
          );
          if (headerInfo) {
            setSoHeaderData(headerInfo);
            setSoSearchNumber(String(detailDataMemo.so_number));
            methods.setValue("ship_to", headerInfo.locationShip || "", {
              shouldValidate: true,
            });
            methods.setValue("address", headerInfo.invoiceToAddress || "", {
              shouldValidate: true,
            });
          }
        } catch (error) {
          console.error("Gagal menarik ulang data SO existing:", error);
        }
      };
      fetchExistingSO();
    }

    const mappedItems: ItemRow[] = (
      detailDataMemo.outbound_memo_items || []
    ).map((it: any) => ({
      item_id: it.item_id || it.item?.id || "",
      item_name: it.item?.sku || "",
      quantity_plan: Number(it.quantity_plan ?? 0),
      uom: typeof it.uom === "string" ? it.uom : (it.uom_name ?? ""),
      uom_name: it.uom_name ?? (typeof it.uom === "string" ? it.uom : ""),
      classification_name:
        it.classification_name ?? it.classification?.classification_name ?? "",
      notes: it.notes ?? "",
    }));

    setItems(mappedItems);
  }, [detailDataMemo, isDetail, isEdit, methods, masterItemList, uomList]);

  // add / delete item handlers
  const handleAddItem = (item: ItemRow) => {
    setItems((prev) => [...prev, item]);
    setOpenModal(false);
  };

  const handleDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemField = (
    index: number,
    field: keyof ItemRow,
    value: any,
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      if (field === "uom") {
        copy[index] = {
          ...copy[index],
          uom: value ?? "",
          uom_name: value ?? "",
        };
      } else if (field === "quantity_plan") {
        const row = copy[index];
        let nextQty: number | "" =
          value === "" || value === null || value === undefined
            ? ""
            : Number(value);

        if (nextQty !== "" && Number.isNaN(nextQty as number)) return prev;
        if (typeof nextQty === "number" && nextQty < 0) nextQty = 0;

        // Item dari SO: jangan force qty — tolak + warning jika melebihi API
        if (
          typeof nextQty === "number" &&
          row.from_so &&
          row.max_quantity_plan != null &&
          nextQty > row.max_quantity_plan
        ) {
          warnQtyExceedsSoApi(row.item_name, row.max_quantity_plan);
          return prev;
        }

        copy[index] = {
          ...copy[index],
          quantity_plan: nextQty as number,
        };
      } else {
        copy[index] = {
          ...copy[index],
          [field]: value,
        };
      }
      return copy;
    });
  };

  // SUBMIT HANDLER (CREATE & UPDATE)
  const onFinalSubmit = async (data: MemoFormValues) => {
    if (items.length === 0) {
      showErrorToast("Item tak boleh kosong! Pilih minimal 1 item.");
      return;
    }

    // Validasi qty SO: tidak boleh melebihi qty dari API
    const overQty = items.find(
      (i) =>
        i.from_so &&
        i.max_quantity_plan != null &&
        Number(i.quantity_plan) > Number(i.max_quantity_plan),
    );
    if (overQty) {
      warnQtyExceedsSoApi(overQty.item_name, overQty.max_quantity_plan);
      return;
    }

    // ✅ Check for empty required fields
    const requiredFields = [
      data.ship_to,
      data.delivery_date,
      data.type_outbound?.value,
    ];

    if (requiredFields.some((field) => !field)) {
      showErrorToast("Please fill in all required fields!");
      return;
    }

    // Tampilkan konfirmasi sebelum hit API
    showConfirmDialog(
      async () => {
        const isSubdist = data.type_outbound?.value === "SUBDIST";

        const basePayload = {
          organization_id: orgId,
          requestor: NIK,
          origin: orgCode,
          destination: data.ship_to,
          destination_io_id: data.selected_destination?.id,
          ship_to: data.address,
          delivery_date: formatDateIndo(data.delivery_date),
          notes: data.notes,
          status: "PENDING",
          type: data.type_outbound?.value || "",
          outbound_memo_items: items.map((i) => ({
            item_id: i.item_id,
            quantity_plan: Number(i.quantity_plan ?? 0),
            uom: i.uom ?? i.uom_name ?? "",
          })),

          ...(!isSubdist && {
            destination_io_id: data.selected_destination?.id || null,
          }),

          ...(isSubdist && soHeaderData
            ? {
                so_organization_id: String(soHeaderData.orgId),
                so_number: String(soHeaderData.orderNumber),
                header_id: Number(soHeaderData.headerId),
              }
            : {}),
        };

        try {
          let res: any = null;

          if (isEdit && memoId) {
            const { requestor, ...updatePayload } = basePayload;
            res = await updateData(memoId, updatePayload as any);
          } else {
            res = await createData(basePayload as any);
          }

          if (res && res.success) {
            methods.reset();
            setItems([]);
            navigate("/memo");
          } else {
            showErrorToast(res?.message || "Operation failed");
          }
        } catch (err: any) {
          console.error("Submit error:", err);
          showErrorToast("Gagal menyimpan data.");
        }
      },
      {
        title: isEdit ? "Konfirmasi Update?" : "Simpan Memo?",
        text: "Pastikan semua data item dan tujuan sudah benar.",
        confirmButtonText: "Ya, Simpan",
      },
    );
  };

  const isSubdistType = typeOutbound?.value === "SUBDIST";
  const hasSoImportedItems = items.some((i) => i.from_so);

  const columnsTableItem = useMemo(
    () => [
      { accessorKey: "item_name", header: "Item Name" },
      {
        accessorKey: "quantity_plan",
        header: "Qty Plan",
        cell: ({ row, getValue }: any) => {
          const val = getValue() ?? row.original?.quantity_plan ?? "";
          const maxQty = row.original?.from_so
            ? row.original?.max_quantity_plan
            : undefined;

          return !isDetail ? (
            <div className="flex flex-col gap-0.5">
              <TableCellInput
                initialValue={val}
                max={maxQty}
                itemName={row.original?.item_name}
                onUpdate={(newValue) =>
                  handleUpdateItemField(row.index, "quantity_plan", newValue)
                }
              />
              {maxQty != null && (
                <span className="text-[10px] text-slate-400">
                  Max dari API SO: {maxQty}
                </span>
              )}
            </div>
          ) : (
            <span>{val}</span>
          );
        },
      },
      {
        accessorKey: "uom_name",
        header: "UOM",
        cell: ({ row, getValue }: any) => {
          const val = getValue() ?? row.original?.uom_name ?? "";

          return !isDetail ? (
            <Select
              options={uomList.map((u) => ({
                value: u.code,
                label: u.code,
              }))}
              value={val}
              onChange={(val) => handleUpdateItemField(row.index, "uom", val)}
              placeholder="-- Select UOM --"
              className="w-40"
            />
          ) : (
            <span>{row.original?.uom ?? ""}</span>
          );
        },
      },
      // SUBDIST + item dari Search SO: tidak ada tombol Delete
      ...(!isDetail && !(isSubdistType && hasSoImportedItems)
        ? [
            {
              accessorKey: "action",
              header: "Action",
              cell: ({ row }: any) => (
                <button
                  className="text-red-600 hover:text-red-800 font-semibold"
                  onClick={() => handleDeleteItem(row.index)}
                >
                  Delete
                </button>
              ),
            },
          ]
        : []),
    ],
    [isDetail, uomList, isSubdistType, hasSoImportedItems],
  );

  const handleReset = () => {
    showConfirmDialog(
      () => {
        if (isEdit && detailDataMemo) {
          const dateOnly = formatDateIndo(detailDataMemo.delivery_date);
          methods.reset({
            requestor: detailDataMemo.requestor || "",
            origin: detailDataMemo.origin || "",
            ship_to: detailDataMemo.ship_to || "",
            destination: detailDataMemo.destination || "",
            delivery_date: dateOnly,
            notes: detailDataMemo.notes || "",
          });
          const mappedItems: ItemRow[] = (
            detailDataMemo.outbound_memo_items || []
          ).map((it: any) => ({
            item_id: it.item_id || it.item?.id || "",
            item_name: it.item?.sku || "",
            quantity_plan: Number(it.quantity_plan ?? 0),
            uom: typeof it.uom === "string" ? it.uom : (it.uom_name ?? ""),
            uom_name: it.uom_name ?? (typeof it.uom === "string" ? it.uom : ""),
            classification_name:
              it.classification_name ??
              it.classification?.classification_name ??
              "",
            notes: it.notes ?? "",
          }));
          setItems(mappedItems);
        } else {
          methods.reset({
            requestor: "",
            origin: "",
            ship_to: "",
            destination: "",
            delivery_date: "",
            notes: "",
          });
          setItems([]);
        }
      },
      {
        title: "Reset Form?",
        text: "Semua data yang telah diinput akan hilang.",
        confirmButtonText: "Ya, Reset!",
      },
    );
  };

  const handleApproveMemo = async (memoId: string) => {
    try {
      await axiosInstance.post(`outbound-memo/${memoId}/approved`);
      showSuccessToast("Memo approved successfully");
      navigate("/memo");
    } catch (error: any) {
      console.error("Error approving memo via axiosInstance:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to approve memo";
      showErrorToast(errorMsg);
    }
  };

  const handleRejectedMemo = async (memoId: string) => {
    try {
      await axiosInstance.post(`outbound-memo/${memoId}/cancelled`);

      showSuccessToast("Memo rejected successfully");
      navigate("/memo");
    } catch (error: any) {
      console.error("Error rejecting memo via axiosInstance:", error);
      const errorMsg = error.response?.data?.message || "Failed to reject memo";
      showErrorToast(errorMsg);
    }
  };

  if (isLoading && (isEdit || isDetail)) {
    return (
      <div className="p-6">
        <PageBreadcrumb
          breadcrumbs={[
            { title: "All Memo", path: "/memo" },
            { title: title || "Loading...", path: "#" },
          ]}
        />
        <LoadingIndicator />
      </div>
    );
  }

  const handleBack = () => {
    navigate(-1); // Ini akan membawa kembali ke /memo?page=x
  };

  // ✅ SEARCH SO berdasarkan inputan user
  const handleSearchSO = async () => {
    if (!soSearchNumber)
      return showErrorToast("Masukkan nomor SO terlebih dahulu!");

    setIsLoadingSO(true);
    try {
      // Menggunakan service searchSO yang sudah diimport
      const { items: soItems, headerInfo } = await SOsearchService(
        soSearchNumber,
        masterItemList,
        uomList,
      );

      if (!soItems || soItems.length === 0) {
        showErrorToast(
          `Data SO ${soSearchNumber} tidak ditemukan atau item tidak terdaftar di master data.`,
        );
        return;
      }

      // =========================================================
      // Validasi akses SO untuk Memo SUBDIST berdasarkan Org Login
      // - Login CWH     → ORGANIZATION_CODE_FROM harus CWH
      // - Login NON_CWH → ORGANIZATION_CODE_FROM harus NON_CWH
      // - SO harus tipe SO SUB-DIST
      // =========================================================
      const normalize = (value?: string | null) =>
        String(value || "")
          .trim()
          .toUpperCase()
          .replace(/\s+/g, " ");

      const loginOrgName = normalize(orgName);
      const isLoginCwh = loginOrgName === "CWH" || loginOrgName.includes("CWH");

      const soType = normalize(headerInfo?.soType);
      const organizationCodeFrom = normalize(headerInfo?.organizationCodeFrom);

      const isSoSubdistType =
        soType === "SO SUB-DIST" ||
        soType.includes("SUB-DIST") ||
        soType.includes("SUBDIST");

      if (!isSoSubdistType) {
        await showMemoSoValidationSwal({
          title: "SO SUBDIST Tidak Valid",
          message:
            "Memo SUBDIST hanya boleh memproses SO dengan tipe SO SUB-DIST.",
          headerInfo,
          expectedLabel: "SO Type (Wajib)",
          expectedValue: "SO SUB-DIST",
          orgName,
          soNo: soSearchNumber,
        });
        setSoHeaderData(null);
        setItems([]);
        return;
      }

      if (isLoginCwh) {
        if (organizationCodeFrom !== "CWH") {
          await showMemoSoValidationSwal({
            title: "Subinventory Tidak Sesuai",
            message:
              "Organisasi anda adalah CWH. Anda hanya dapat memproses SO Memo dengan Organization Code From = CWH.",
            headerInfo,
            expectedLabel: "Organization Code From (Wajib)",
            expectedValue: "CWH",
            orgName,
            soNo: soSearchNumber,
          });
          setSoHeaderData(null);
          setItems([]);
          return;
        }
      } else {
        const isNonCwhSubinv =
          organizationCodeFrom === "NON_CWH" ||
          organizationCodeFrom === "NON-CWH" ||
          organizationCodeFrom === "NON CWH";

        if (!isNonCwhSubinv) {
          await showMemoSoValidationSwal({
            title: "Subinventory Tidak Sesuai",
            message: `Login cabang (${orgName || "-"}). Anda hanya dapat memproses SO Memo dengan Organization Code From = NON_CWH.`,
            headerInfo,
            expectedLabel: "Organization Code From (Wajib)",
            expectedValue: "NON_CWH",
            orgName,
            soNo: soSearchNumber,
          });
          setSoHeaderData(null);
          setItems([]);
          return;
        }
      }

      const expectedOrganizationCodeFrom = isLoginCwh ? "CWH" : "NON_CWH";
      const validResult = await showMemoSoValidationSuccessSwal({
        headerInfo,
        expectedLabel: "Organization Code From (Wajib)",
        expectedValue: expectedOrganizationCodeFrom,
        orgName,
        soNo: soSearchNumber,
      });

      if (!validResult.isConfirmed) {
        return;
      }

      if (headerInfo) {
        setSoHeaderData(headerInfo);
        methods.setValue("ship_to", headerInfo.locationShip || "", {
          shouldValidate: true,
        });
        methods.setValue("address", headerInfo.invoiceToAddress || "", {
          shouldValidate: true,
        });
      }

      // Mapping hasil SO ke format ItemRow table
      const mappedItems: ItemRow[] = soItems.map((it: any) => {
        const soQty = Number(it.qty ?? it.qty_plan ?? 0);
        return {
          item_id: String(it.item_id),
          item_name: it.sku || "Unknown Item",
          quantity_plan: soQty,
          uom: it.uom,
          uom_name: it.uom,
          classification_name: "",
          notes: `Imported from SO: ${soSearchNumber}`,
          from_so: true,
          max_quantity_plan: soQty,
        };
      });

      setItems(mappedItems);
      showSuccessToast(
        `Berhasil menarik ${mappedItems.length} item dari SO ${soSearchNumber}`,
      );
    } catch (err: any) {
      console.error("SO Search Error:", err);
      showErrorToast(err?.message || "Terjadi kesalahan saat mencari SO.");
    } finally {
      setIsLoadingSO(false);
    }
  };

  const soDetails = soHeaderData
    ? [
        { label: "Header Id", value: soHeaderData.headerId },
        { label: "SO Number", value: soHeaderData.orderNumber },
        {
          label: "Ordered Date",
          value: soHeaderData.orderedDate
            ? formatDateIndo(soHeaderData.orderedDate)
            : "-",
        },
        {
          label: "Organization Code From",
          value: soHeaderData.organizationCodeFrom,
        },
        {
          label: "Organization Code To",
          value: soHeaderData.organizationCodeTo,
        },
        { label: "Location Bill", value: soHeaderData.locationBill },
        { label: "Location Ship", value: soHeaderData.locationShip },
        { label: "Organization", value: soHeaderData.orgName },
        {
          label: "Invoice Address",
          value: soHeaderData.invoiceToAddress,
          isTruncated: true,
        },
      ]
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageBreadcrumb
          breadcrumbs={[
            { title: "All Memo", path: "/memo" },
            { title: title || "Process Memo", path: "/memo/process" },
          ]}
        />

        {/* TOMBOL BACK DI ATAS */}
        <Button
          variant="primary"
          onClick={handleBack}
          startIcon={<FaArrowLeft />}
        >
          Back to List Memo
        </Button>
      </div>

      {/* FORM */}
      <section className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <DynamicForm
          fields={fieldsConfig}
          onSubmit={methods.handleSubmit(onFinalSubmit)}
          defaultValues={{}}
          control={methods.control}
          register={methods.register}
          setValue={methods.setValue}
          handleSubmit={methods.handleSubmit}
          isEditMode={!isDetail}
          watch={methods.watch}
        />

        {isDetail &&
          roleName === "TRANSPORT_SUPERVISOR" &&
          detailDataMemo?.status !== "APPROVED" && (
            <div className="flex justify-end mt-4 gap-3">
              <Button
                type="button"
                variant="danger"
                onClick={() => handleRejectedMemo(memoId)}
              >
                Reject Memo
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={() => handleApproveMemo(memoId)}
              >
                Approve Memo
              </Button>
            </div>
          )}
      </section>

      {/* SO SEARCH SECTION (Hanya muncul jika type_outbound == SUBDIST) */}
      {typeOutbound?.value === "SUBDIST" && !isDetail && (
        <section className="bg-blue-50 p-5 rounded-xl border border-blue-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-blue-900 mb-2">
                Import from Sales Order (SO)
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Contoh: SO20240001"
                value={soSearchNumber}
                onChange={(e) =>
                  setSoSearchNumber(e.target.value.toUpperCase())
                }
                onKeyDown={(e) => e.key === "Enter" && handleSearchSO()}
              />
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={handleSearchSO}
              disabled={isLoadingSO}
              startIcon={isLoadingSO ? null : <FaSearch />}
              className="h-[42px] px-6"
            >
              {isLoadingSO ? "Searching..." : "Search & Add"}
            </Button>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            * Masukkan nomor SO untuk mengisi daftar item secara otomatis. Anda
            tetap bisa menambah item manual setelahnya.
          </p>
        </section>
      )}

      {/* SO HEADER INFO (Muncul setelah pencarian SO berhasil) */}
      {soHeaderData && typeOutbound?.value === "SUBDIST" && !isDetail && (
        <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
            <h3 className="font-semibold text-lg text-gray-800">
              Sales Order Information
            </h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
              {soHeaderData.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 px-1">
            {soDetails.map((detail, index) => (
              <div key={index}>
                <p className="text-xs text-gray-500 font-medium mb-1">
                  {detail.label}
                </p>
                <p
                  className={`text-sm font-semibold text-gray-900 ${
                    detail.isTruncated ? "truncate" : ""
                  }`}
                  title={detail.isTruncated ? String(detail.value) : undefined}
                >
                  {detail.value || "-"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ITEM DETAILS */}
      <section className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-lg text-gray-700">Item Details</h3>
          {!isDetail && (
            <div className="flex flex-col items-end gap-1">
              <Button
                type="button"
                variant="primary"
                onClick={handleOpenAddItem}
                disabled={!canProceedAddItem}
              >
                + Add Item
              </Button>
              {isAmoType && !hasAmoOrganizationName && (
                <span className="text-[11px] text-rose-600 font-medium">
                  Pilih destination AMO agar Organization Name terisi.
                </span>
              )}
            </div>
          )}
        </div>

        <TableComponent data={items} columns={columnsTableItem} pageSize={10} />
      </section>

      {/* ACTIONS */}
      {!isDetail && (
        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="danger"
            onClick={() => handleReset()}
            startIcon={<FaUndo />}
          >
            Reset Form
          </Button>

          <Button
            type="button"
            variant="secondary"
            startIcon={<FaCheck />}
            onClick={methods.handleSubmit(onFinalSubmit)}
            disabled={items.length === 0}
          >
            {isEdit ? "Update Memo" : "Confirm Memo"}
          </Button>
        </div>
      )}

      {/* MODAL */}
      <ModalAddItem
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={handleAddItem}
        organizationName={
          typeOutbound?.value === "AMO" ? amoOrganizationName : undefined
        }
      />
    </div>
  );
};

export default CreateMemo;
