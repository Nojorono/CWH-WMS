import { useState, useMemo, useCallback, use } from "react";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../../../../components/tables/MasterDataTable/TableComponent";
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
import DynamicFormModal from "../../../../components/wms-components/DynamicFormModal";
import { useNavigate } from "react-router";

interface Props {
  data: any[];
  globalFilter?: string;
  isCreateModalOpen: boolean;
  onCloseCreateModal: () => void;
  columns: ColumnDef<any>[];
  formFields: any[];
  onSubmit: (data: any) => Promise<any>;
  onUpdate: (data: any) => Promise<any>;
  onDelete: (id: any) => Promise<void>;
  onRefresh: () => void;
  getRowId?: (row: any) => any;
  title?: string;
  noActions?: boolean;
  onSelectedChange?: (ids: any[]) => void; // ✅ callback ke parent
}

const DynamicTable = ({
  data,
  globalFilter,
  isCreateModalOpen,
  onCloseCreateModal,
  columns,
  formFields,
  onSubmit,
  onUpdate,
  onDelete,
  onRefresh,
  getRowId = (row) => row.id,
  title,
  noActions,
  onSelectedChange,
}: Props) => {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<any[]>([]);

  const handleDelete = useCallback(
    async (id: any) => {
      await onDelete(id);
      await onRefresh();
    },
    [onDelete, onRefresh],
  );

  const handleCloseModal = () => {
    setSelectedItem(null);
    onCloseCreateModal();
  };

  console.log("data Pallet selectedItem", selectedItem);

  const enhancedColumns = useMemo(() => {
    if (noActions) return columns;

    return [
      ...columns,
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const isDisableEdit = row.original.currentQuantity !== 0;

          return (
            <div className="flex gap-2">
              <button
                className={`text-green-600 ${isDisableEdit ? "opacity-30 cursor-not-allowed" : "hover:text-green-800"}`}
                onClick={() => setSelectedItem(row.original)}
                disabled={isDisableEdit} // Mencegah klik jika quantity bukan 0
                title={
                  isDisableEdit
                    ? "Hanya bisa edit jika stok kosong"
                    : "Edit Item"
                }
              >
                <FaEdit />
              </button>

              <button
                onClick={() => goToDetailPage(getRowId(row.original))}
                className="text-blue-500 hover:text-blue-700"
              >
                <FaEye />
              </button>
            </div>
          );
        },
      },
    ];
  }, [columns, getRowId, noActions]); // Pastikan dependensi useMemo sudah lengkap

  // ✅ hanya update saat ada event, bukan di render
  const handleSelectionChange = useCallback(
    (ids: any[]) => {
      setSelectedIds(ids);
      if (onSelectedChange) {
        onSelectedChange(ids); // kirim ke parent
      }
    },
    [onSelectedChange],
  );

  const goToDetailPage = (idPallet: string) => {
    navigate("/master_pallet/detail", {
      state: { idPallet }, // kirim state
    });
  };

  return (
    <>
      <DynamicFormModal
        isOpen={!!selectedItem || isCreateModalOpen}
        onClose={handleCloseModal}
        defaultValues={selectedItem || undefined}
        isEditMode={!!selectedItem}
        onSubmit={onSubmit}
        onUpdate={onUpdate}
        onRefresh={onRefresh}
        formFields={formFields}
        title={title}
      />

      <TableComponent
        data={data}
        columns={enhancedColumns}
        globalFilter={globalFilter}
        onSelectionChange={handleSelectionChange} // ✅ trigger saat user checklist
      />
    </>
  );
};

export default DynamicTable;
