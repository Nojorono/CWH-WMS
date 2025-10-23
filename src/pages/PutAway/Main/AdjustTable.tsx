"use client";

import React, { useMemo } from "react";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../../../components/tables/MasterDataTable/TableComponent";
import { useNavigate } from "react-router-dom";
import { useStorePutAway } from "../../../DynamicAPI/stores/Store/MasterStore";
import { MappedData } from "../constant/MappedData";
import StatusBadge from "../../../common/statusBadge";
import { STATUS_MAP_PUTAWAY } from "../../../constants/statusMaps";

type AdjustTableProps = {
  data: MappedData[];
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  onDetail?: (id: string) => void;
  onRefresh?: () => void;
};

const AdjustTable = ({
  data,
  globalFilter,
  setGlobalFilter,
  onDetail,
  onRefresh,
}: AdjustTableProps) => {
  const navigate = useNavigate();
  const { deleteData } = useStorePutAway();

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
    await deleteData(id);
  };

  // ✅ Updated columns to reflect full mapped structure
  // const columns: ColumnDef<MappedData>[] = useMemo(
  //   () => [
  //     {
  //       accessorKey: "palletCode",
  //       header: "Pallet Code",
  //     },
  //     {
  //       accessorKey: "sourceWarehouseSubName",
  //       header: "Source Zone",
  //     },
  //     {
  //       accessorKey: "sourceBinCode",
  //       header: "Source Bin",
  //     },
  //     {
  //       accessorKey: "destinationWarehouseSubName",
  //       header: "Destination Zone",
  //     },
  //     {
  //       accessorKey: "destinationBinCode",
  //       header: "Destination Bin",
  //     },
  //     {
  //       accessorKey: "totalSku",
  //       header: "Total SKU",
  //     },
  //     {
  //       accessorKey: "totalQty",
  //       header: "Total Qty",
  //     },
  //     {
  //       accessorKey: "palletItemUom",
  //       header: "UOM",
  //     },
  //     {
  //       accessorKey: "driverName",
  //       header: "Forklift Driver",
  //     },
  //     {
  //       accessorKey: "driverPhone",
  //       header: "Driver Phone",
  //     },
  // {
  //   accessorKey: "status",
  //   header: "Status",
  //   cell: ({ row }) => {
  //     const status = row.original.status;
  //     let color = "text-gray-500";
  //     if (status === "PENDING") color = "text-yellow-500";
  //     else if (status === "IN_PROGRESS") color = "text-blue-500";
  //     else if (status === "COMPLETED") color = "text-green-600";
  //     return <span className={`${color} font-semibold`}>{status}</span>;
  //   },
  // },
  //     {
  //       id: "actions",
  //       header: "Action",
  //       cell: ({ row }) => (
  //         <div className="flex items-center gap-3">
  //           <FaEye
  //             className="size-5 cursor-pointer text-green-600"
  //             onClick={() => handleDetail(row.original)}
  //             title="Detail"
  //           />
  //           {row.original.status !== "COMPLETED" && (
  //             <>
  //               <FaEdit
  //                 className="size-5 cursor-pointer text-blue-600"
  //                 onClick={() => handleUpdate(row.original)}
  //                 title="Edit"
  //               />
  //               <FaTrash
  //                 className="size-5 cursor-pointer text-red-600"
  //                 onClick={() => handleDelete(row.original.id)}
  //                 title="Delete"
  //               />
  //             </>
  //           )}
  //         </div>
  //       ),
  //     },
  //   ],
  //   []
  // );

  const columns: ColumnDef<MappedData>[] = useMemo(() => {
    if (!data || data.length === 0) return []; // fallback

    const hideSourceColumns = data.every((row) => row.status === "COMPLETED");

    const baseColumns: ColumnDef<MappedData>[] = [
      { accessorKey: "palletCode", header: "Pallet Code" },
      // hanya tambahkan jika tidak semua status COMPLETED
      ...(!hideSourceColumns
        ? [
            { accessorKey: "sourceWarehouseSubName", header: "Source Zone" },
            { accessorKey: "sourceBinCode", header: "Source Bin" },
          ]
        : []),
      {
        accessorKey: "destinationWarehouseSubName",
        header: "Destination Zone",
      },
      { accessorKey: "destinationBinCode", header: "Destination Bin" },
      { accessorKey: "totalSku", header: "Total SKU" },
      { accessorKey: "totalQty", header: "Total Qty" },
      { accessorKey: "palletItemUom", header: "UOM" },
      { accessorKey: "driverName", header: "Forklift Driver" },
      { accessorKey: "driverPhone", header: "Driver Phone" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          return (
            <StatusBadge
              status={row.original.status}
              colorMap={STATUS_MAP_PUTAWAY}
              variant="solid"
              size="sm"
            />
          );
        },
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <FaEye
              className="size-5 cursor-pointer text-green-600"
              onClick={() => handleDetail(row.original)}
              title="Detail"
            />
            {row.original.status !== "COMPLETED" && (
              <>
                <FaEdit
                  className="size-5 cursor-pointer text-blue-600"
                  onClick={() => handleUpdate(row.original)}
                  title="Edit"
                />
                <FaTrash
                  className="size-5 cursor-pointer text-red-600"
                  onClick={() => handleDelete(row.original.id)}
                  title="Delete"
                />
              </>
            )}
          </div>
        ),
      },
    ];

    return baseColumns;
  }, [data]);

  return (
    <TableComponent
      data={data}
      columns={columns}
      globalFilter={globalFilter}
      setGlobalFilter={setGlobalFilter}
      pageSize={10}
    />
  );
};

export default AdjustTable;

// import React, { useMemo } from "react";
// import { FaEye, FaEdit } from "react-icons/fa";
// import { ColumnDef } from "@tanstack/react-table";
// import TableComponent from "../../../components/tables/MasterDataTable/TableComponent";
// import { useNavigate } from "react-router-dom";

// type MappedData = {
//   id: string;
//   inventory_tracking_id: string;
//   destinationBinId: string;
//   forkliftDriverId: string;
//   driverName: string;
//   driverPhone: string;
//   status: string;
//   notes: string;
//   palletCode: string;
//   sourceWarehouseSubName: string;
//   destinationWarehouseSubName: string;
//   destinationBinCode: string;
//   totalSku: number;
//   totalQty: number;
//   palletItemUom: string;
// };

// type MenuTableProps = {
//   data: MappedData[];
//   globalFilter?: string;
//   setGlobalFilter?: (value: string) => void;
//   onDetail?: (id: string) => void;
//   onRefresh?: () => void;
// };

// const AdjustTable = ({
//   data,
//   globalFilter,
//   setGlobalFilter,
//   onDetail,
//   onRefresh,
// }: MenuTableProps) => {
//   const navigate = useNavigate();

//   const columns: ColumnDef<any>[] = useMemo(
//     () => [
//       {
//         accessorKey: "palletCode",
//         header: "Pallet Code",
//       },
//       {
//         accessorKey: "sourceWarehouseSubName",
//         header: "Source Zone",
//       },
//       {
//         accessorKey: "destinationWarehouseSubName",
//         header: "Destination Zone",
//       },
//       {
//         accessorKey: "destinationBinCode",
//         header: "Destination Bin",
//       },
//       {
//         accessorKey: "totalSku",
//         header: "Total SKU",
//       },
//       {
//         accessorKey: "totalQty",
//         header: "Total Qty",
//       },
//       {
//         accessorKey: "driverName",
//         header: "Forklift Driver",
//       },
//       {
//         accessorKey: "driverPhone",
//         header: "Driver Phone",
//       },
//       {
//         accessorKey: "status",
//         header: "Status",
//       },
//       {
//         id: "actions",
//         header: "Action",
//         cell: ({ row }) => (
//           <div style={{ display: "flex", gap: "8px" }}>
//             <FaEye
//               className="size-5 cursor-pointer"
//               style={{ color: "green" }}
//               onClick={() => handleDetail(row.original)}
//               title="Detail"
//             />
//             {row.original.status !== "COMPLETED" && (
//               <FaEdit
//                 className="size-5 cursor-pointer"
//                 style={{ color: "blue" }}
//                 onClick={() => handleUpdate(row.original)}
//                 title="Edit"
//               />
//             )}
//           </div>
//         ),
//       },
//     ],
//     []
//   );

//   const handleDetail = (data: MappedData) => {
//     navigate("/putaway/process", {
//       state: { data, mode: "detail" },
//     });
//   };

//   const handleUpdate = (data: MappedData) => {
//     navigate("/putaway/process", {
//       state: { data, mode: "edit", title: "Update PutAway" },
//     });
//   };

//   return (
//     <TableComponent
//       data={data}
//       columns={columns}
//       globalFilter={globalFilter}
//       setGlobalFilter={setGlobalFilter}
//       pageSize={10}
//     />
//   );
// };

// export default AdjustTable;
