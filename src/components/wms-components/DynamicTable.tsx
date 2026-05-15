import { useState, useMemo, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../../components/tables/MasterDataTable/TableComponent";
import { FaEdit, FaKey, FaPlus, FaTrash } from "react-icons/fa";
import DynamicFormModal from "./DynamicFormModal";
import { useNavigate } from "react-router-dom";
import { usePagePermissions } from "../../utils/UserPermission/UserPagePermissions";
import { showConfirmDialog } from "../../components/swal-confirm";

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
  const roleName = localStorage.getItem("role_name");
  const navigate = useNavigate();

  const handleCloseModal = () => {
    setSelectedItem(null);
    onCloseCreateModal();
  };

  const handleDelete = useCallback(
    async (id: any) => {
      if (onDelete) await onDelete(id);
      await onRefresh();
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
              {/* Add Zone / View Button - Compact Version */}
              {isView && canView && (
                <button
                  onClick={() => handleView(row.original)}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 transition-colors border border-blue-200 rounded-md hover:bg-blue-50"
                  title="Add Zone"
                >
                  <FaPlus size={10} /> <span>Add Zone</span>
                </button>
              )}

              {/* Edit Action */}
              {isEdited && canUpdate && canManage && (
                <button
                  className="p-2 text-emerald-600 transition-colors rounded-md hover:bg-emerald-50"
                  onClick={() => setSelectedItem(row.original)}
                  title="Edit"
                >
                  <FaEdit size={14} />
                </button>
              )}

              {/* Reset Password Action */}
              {onResetPassword && canCreate && canManage && (
                <button
                  className="p-2 text-amber-500 transition-colors rounded-md hover:bg-amber-50"
                  onClick={() => onResetPassword(id)}
                  title="Reset Password"
                >
                  <FaKey size={14} />
                </button>
              )}

              {/* Delete Action */}
              {/* {canShowDelete && ( */}
              <button
                onClick={() => handleDelete(id)}
                className="p-2 text-rose-500 transition-colors rounded-md hover:bg-rose-50"
                title="Delete"
              >
                <FaTrash size={14} />
              </button>
              {/* )} */}
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
