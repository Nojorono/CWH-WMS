import React, { useMemo } from "react";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";
import Badge from "../../../../components/ui/badge/Badge";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../../../../components/tables/MasterDataTable/TableComponent";
import { useNavigate } from "react-router-dom";
import { usePagePermissions } from "../../../../utils/UserPermission/UserPagePermissions";

type Role = {
  id?: any;
  name: string;
  description: string;
};

type RoleTableProps = {
  data: Role[];
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  onDetail: (id: any) => void;
  onDelete: (id: any) => void;
  onEdit?: (data: Role) => void;
};

const AdjustTableRole = ({
  data,
  globalFilter,
  setGlobalFilter,
  onDetail,
  onDelete,
}: RoleTableProps) => {
  const navigate = useNavigate();
  const { canUpdate, canDelete, canManage } = usePagePermissions();

  function navigateToUpdateRole(roleData: Role) {
    const { id } = roleData;
    navigate(`/master_role/update`, { state: { id } });
  }

  console.log("Data in AdjustTableRole:", data);

  const columns: ColumnDef<Role>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: (info) => String(info.getValue()),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (info) => String(info.getValue()),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="space-x-4">
            {canUpdate && canManage && (
              <button
                className="text-blue-600"
                onClick={() => {
                  const roleData = row.original;
                  navigateToUpdateRole(roleData);
                }}
              >
                <FaEdit />
              </button>
            )}

            {canDelete && canManage && (
              <button
                className="text-red-600"
                onClick={() => onDelete(row.original.id)}
              >
                <FaTrash />
              </button>
            )}
          </div>
        ),
      },
    ],
    [onDelete, canUpdate, canDelete, canManage, navigateToUpdateRole],
  );

  return (
    <TableComponent
      data={data}
      columns={columns}
      globalFilter={globalFilter}
      setGlobalFilter={setGlobalFilter}
      onDetail={onDetail}
    />
  );
};

export default AdjustTableRole;
