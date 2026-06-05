import { useState, useMemo, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../../../../components/tables/MasterDataTable/TableComponent";
import { FaEdit, FaKey, FaPlus, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { usePagePermissions } from "../../../../utils/UserPermission/UserPagePermissions";
import DynamicFormModal from "../../../../components/wms-components/DynamicFormModal";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";

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
  actionPermissionOverride?: {
    canDelete?: boolean;
    canUpdate?: boolean;
    canCreate?: boolean;
    canManage?: boolean;
    canView?: boolean;
  };
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
  actionPermissionOverride,
}: Props) => {
  const { canManage, canCreate, canUpdate, canDelete, canView } =
    usePagePermissions();

  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [, setSelectedIds] = useState<any[]>([]);

  const user = usePersistAuthStore((state) => state.user);
  const roleName = user?.role?.name;

  const navigate = useNavigate();

  const handleCloseModal = () => {
    setSelectedItem(null);
    onCloseCreateModal();
  };

  const handleDelete = useCallback(
    async (id: any) => {
      if (window.confirm("Are you sure you want to delete this item?")) {
        if (onDelete) await onDelete(id);
        await onRefresh();
      }
    },
    [onDelete, onRefresh],
  );

  const handleView = useCallback(
    (WHdata: any) => {
      navigate("/master_warehouse/detail", { state: { WHdata } });
    },
    [navigate],
  );

  const enhancedColumns = useMemo(() => {
    if (noActions) return columns;

    return [
      ...columns,
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
          const id = getRowId(row.original);

          return (
            <div className="flex items-center justify-center gap-1">
              <button
                className="p-2 text-emerald-600 transition-colors rounded-md hover:bg-emerald-50"
                onClick={() => setSelectedItem(row.original)}
                title="Edit"
              >
                <FaEdit size={14} />
              </button>

              <button
                onClick={() => handleDelete(id)}
                className="p-2 text-rose-500 transition-colors rounded-md hover:bg-rose-50"
                title="Delete"
              >
                <FaTrash size={14} />
              </button>
            </div>
          );
        },
        size: 150,
      },
    ];
  }, [
    columns,
    getRowId,
    handleDelete,
    handleView,
    isDeleted,
    isEdited,
    isView,
    onResetPassword,
    roleName,
    noActions,
  ]);

  const handleSelectionChange = useCallback(
    (ids: any[]) => {
      setSelectedIds(ids);
      onSelectedChange?.(ids);
    },
    [onSelectedChange],
  );

  const pagePerm = usePagePermissions();

  const effectivePerm = {
    canDelete: actionPermissionOverride?.canDelete ?? pagePerm.canDelete,
    canUpdate: actionPermissionOverride?.canUpdate ?? pagePerm.canUpdate,
    canCreate: actionPermissionOverride?.canCreate ?? pagePerm.canCreate,
    canManage: actionPermissionOverride?.canManage ?? pagePerm.canManage,
    canView: actionPermissionOverride?.canView ?? pagePerm.canView,
  };

  const canShowDelete =
    !isDeleted && (effectivePerm.canDelete || effectivePerm.canManage);

  return (
    <div className="w-full space-y-4">
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

      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
        <TableComponent
          data={data}
          columns={enhancedColumns}
          globalFilter={globalFilter}
          onSelectionChange={handleSelectionChange}
        />
      </div>
    </div>
  );
};

export default DynamicTable;
