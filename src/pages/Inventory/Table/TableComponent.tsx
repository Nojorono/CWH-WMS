import { useState, useMemo, useCallback, use } from "react";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../../../components/tables/MasterDataTable/TableComponent";
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router";
// import DynamicFormModal from "./DynamicFormModal";

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
  onSelectedChange?: (ids: any[]) => void; // ✅ callback ke parent
}

const DynamicTable = ({
  data,
  globalFilter,
  columns,
  onDelete,
  onRefresh,
  getRowId = (row) => row.id,
  noActions,
  isDeleted = true,
  isEdited = true,
  isView = false,
  onSelectedChange,
}: Props) => {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<any[]>([]);

  const handleDelete = useCallback(
    async (id: any) => {
      if (onDelete) {
        await onDelete(id);
      }
      await onRefresh();
    },
    [onDelete, onRefresh]
  );

  const handleViewDetail = (id: any) => {
    navigate(`/inventory/detail`, { state: { invListId: id } });
  };

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

            {isView && (
              <button
                onClick={() => handleViewDetail(getRowId(row.original))}
                className="text-blue-500"
              >
                <FaEye />
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
    [onSelectedChange]
  );

  return (
    <>
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
