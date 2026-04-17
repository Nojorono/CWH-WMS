import { useState, useMemo, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../../components/tables/MasterDataTable/TableComponent";
import { FaEdit, FaEye, FaKey, FaPlus, FaTrash } from "react-icons/fa";
import DynamicFormModal from "./DynamicFormModal";
import { useNavigate } from "react-router-dom";

interface Props {
  data: any[];
  globalFilter?: string;
  isCreateModalOpen: boolean;
  onCloseCreateModal: () => void;
  columns: ColumnDef<any>[];
  formFields: any[];
  onSubmit?: (data: any) => Promise<any>;
  onUpdate?: (data: any) => Promise<any>;
  onDelete?: (id: any) => Promise<void>;
  onRefresh: () => void;
  getRowId?: (row: any) => any;
  title?: string;
  noActions?: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
  isView?: boolean;
  onSelectedChange?: (ids: any[]) => void;
  updateFormFields?: any[];
  onResetPassword?: (id: any) => void;
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
  isDeleted = true,
  isEdited = true,
  isView = false,
  onSelectedChange,
  updateFormFields,
  onResetPassword,
}: Props) => {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<any[]>([]);
  const navigate = useNavigate();

  const handleCloseModal = () => {
    setSelectedItem(null);
    onCloseCreateModal();
  };

  const handleDelete = useCallback(
    async (id: any) => {
      if (onDelete) {
        await onDelete(id);
      }
      await onRefresh();
    },
    [onDelete, onRefresh],
  );

  const enhancedColumns = useMemo(() => {
    if (noActions) return columns;
    return [
      ...columns,
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex gap-2">
            {isEdited && (
              <button
                className="text-green-600"
                onClick={() => setSelectedItem(row.original)}
              >
                <FaEdit />
              </button>
            )}

            {isDeleted && (
              <button
                onClick={() => handleDelete(getRowId(row.original))}
                className="text-red-500"
              >
                <FaTrash />
              </button>
            )}
            
            {/* 
            {isView && (
              <button
                onClick={() => handleView(getRowId(row.original))}
                className="text-blue-500"
              >
                <FaPlus />
              </button>
            )} */}

            {onResetPassword && (
              <button
                className="text-yellow-500"
                onClick={() => onResetPassword(getRowId(row.original))}
              >
                <FaKey />
              </button>
            )}
          </div>
        ),
      },
    ];
  }, [columns, getRowId, handleDelete]);

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

  // const handleView = (id: any) => {
  //   console.log("selected id", id);
  // };

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
        updateFormFields={updateFormFields}
      />

      <TableComponent
        data={data}
        columns={enhancedColumns}
        globalFilter={globalFilter}
        onSelectionChange={handleSelectionChange}
      />
    </>
  );
};

export default DynamicTable;
