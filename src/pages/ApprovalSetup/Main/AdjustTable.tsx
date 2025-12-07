"use client";

import { useEffect, useMemo, useState } from "react";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../Table/TableComponent";
import { useNavigate } from "react-router-dom";
import { useStoreApprovalSetUp } from "../../../DynamicAPI/stores/Store/MasterStore";
import { MappedData } from "../constant/MappedData";
import StatusBadge from "../../../common/statusBadge";
import { STATUS_MAP_PUTAWAY } from "../../../constants/statusMaps";

type AdjustTableProps = {
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  onDetail?: (id: string) => void;
  onRefresh?: () => void;
  filteredStatus?: any;
};

const AdjustTable = ({
  globalFilter,
  setGlobalFilter,
  filteredStatus,
}: AdjustTableProps) => {
  const navigate = useNavigate();

  const { fetchUsingPagination, list, pagination } = useStoreApprovalSetUp();

  // 🔹 local state pagination
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  // 🔹 Fetch data setiap kali pagination / search berubah
  useEffect(() => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: pageIndex + 1, // jika backend 1-based
      limit: pageSize,
      search: globalFilter || "",
      status: filteredStatus || "",
    });
  }, [fetchUsingPagination, pageIndex, pageSize, globalFilter, filteredStatus]);

  const handleDetail = (data: MappedData) => {
    navigate("/putaway/process", {
      state: { data, mode: "detail" },
    });
  };

  const handleUpdate = (data: MappedData) => {
    navigate("/putaway/process", {
      state: { data, mode: "edit", title: "Update PutAway" },
    });
  };

  const handleDelete = async (id: any) => {
    // await deleteData(id);
  };

  // ✅ Updated columns to reflect full mapped structure
  const columns: ColumnDef<any>[] = useMemo(() => {
    const baseColumns: ColumnDef<any>[] = [
      { accessorKey: "name", header: "Approval Name" },
      { accessorKey: "description", header: "Description" },
      { accessorKey: "entity_type", header: "Entity Type" },
      {
        accessorKey: "is_active",
        header: "Active",
        cell: ({ row }) => (row.original.is_active ? "Yes" : "No"),
      },
      {
        accessorKey: "approval_levels",
        header: "Approval Levels",
        cell: ({ row }) => (
          <div>
            {row.original.approval_levels.map((level: any) => (
              <div key={level.id}>
                {level.level_name}
              </div>
            ))}
          </div>
        ),
      },

      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <div>
            {row.original.approval_levels.map((level: any) => (
              <div key={level.id}>{level.role.name}</div>
            ))}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {/* <FaEye
              className="size-5 cursor-pointer text-green-600"
              onClick={() => handleDetail(row.original)}
              title="Detail"
            />
            <FaEdit
              className="size-5 cursor-pointer text-blue-600"
              onClick={() => handleUpdate(row.original)}
              title="Edit"
            />
            <FaTrash
              className="size-5 cursor-pointer text-red-600"
              onClick={() => handleDelete(row.original.id)}
              title="Delete"
            /> */}
          </div>
        ),
      },
    ];

    return baseColumns;
  }, []);

  // Mapping API data to table-friendly shape
  const mappedList = list.map((item: any) => ({
    id: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt,
    name: item.name,
    description: item.description,
    entity_type: item.entity_type,
    is_active: item.is_active,
    require_all_levels: item.require_all_levels,
    total_levels: item.total_levels,
    approval_levels: item.approval_levels.map((level: any) => ({
      id: level.id,
      level: level.level,
      level_name: level.level_name,
      description: level.description,
      role_id: level.role_id,
      role: level.role,
      is_required: level.is_required,
      can_skip: level.can_skip,
      min_approvers: level.min_approvers,
      max_approvers: level.max_approvers,
      required_approvers: level.required_approvers,
      order: level.order,
    })),
  }));

  return (
    <TableComponent
      data={mappedList}
      columns={columns}
      globalFilter={globalFilter}
      setGlobalFilter={setGlobalFilter}
      pageSize={pageSize}
      pageIndex={pageIndex}
      totalPages={pagination.totalPages}
      onPageChange={(page, size) => {
        setPageIndex(page);
        setPageSize(size);
      }}
    />
  );
};

export default AdjustTable;
