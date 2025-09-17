import React, { useState, useMemo, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../../components/tables/MasterDataTable/TableComponent";
import Badge from "../../components/ui/badge/Badge";
import { FaEye, FaTrash } from "react-icons/fa";
import DynamicFormModal from "./DynamicFormModal";

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
}: Props) => {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const enhancedColumns = useMemo(() => {
    if (noActions) {
      return columns;
    }
    return [
      ...columns,
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              className="text-green-600"
              onClick={() => setSelectedItem(row.original)}
            >
              <FaEye />
            </button>
            <button
              onClick={() => handleDelete(getRowId(row.original))}
              className="text-red-500"
            >
              <FaTrash />
            </button>
          </div>
        ),
      },
    ];
  }, [columns]);

  const handleDelete = useCallback(
    async (id: any) => {
      await onDelete(id);
      await onRefresh();
    },
    [onDelete, onRefresh]
  );

  const handleCloseModal = () => {
    setSelectedItem(null);
    onCloseCreateModal();
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
      />
    </>
  );
};

export default DynamicTable;
