import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useStoreInventoryMovement } from "../../../DynamicAPI/stores/Store/MasterStore";
import MovementDetailView from "./MovementDetailView"; // Kita buat component ini di bawah
import { FaEdit, FaEye, FaPlus, FaTrash } from "react-icons/fa";
import { EndPoint } from "../../../utils/EndPoint";

const InventoryMovement: React.FC = () => {
  const { fetchAll, list, deleteData } = useStoreInventoryMovement();
  const [selectedMovement, setSelectedMovement] = useState<any | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const columnHelper = createColumnHelper<any>();

  const columns = [
    columnHelper.accessor("movement_number", {
      header: "Move Location ID",
      cell: (info) => <span className="font-bold">{info.getValue()}</span>,
    }),
    columnHelper.accessor("createdAt", {
      header: "Date",
      cell: (info) => new Date(info.getValue()).toLocaleDateString("id-ID"),
    }),
    columnHelper.accessor("sourceWarehouseSub.name", {
      header: "Source Zone",
    }),
    columnHelper.accessor("destinationWarehouseSub.name", {
      header: "Destination Zone",
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.display({
      id: "action",
      header: "Action",
      cell: (info) => (
        <>
          <FaPlus
            className="inline mr-2 cursor-pointer text-orange-600"
            onClick={() =>
              setSelectedMovement({ ...info.row.original, addOnly: true })
            }
            title="Add"
          />
          {Array.isArray(info.row.original.users) &&
            info.row.original.users.length > 0 && (
              <FaEdit
                className="inline mr-2 cursor-pointer text-blue-600"
                onClick={() =>
                  setSelectedMovement({ ...info.row.original, editOnly: true })
                }
                title="Edit"
              />
            )}
          <FaEye
            className="inline mr-2 cursor-pointer text-green-600"
            onClick={() =>
              setSelectedMovement({ ...info.row.original, viewOnly: true })
            }
            title="View"
          />
          <FaTrash
            className="inline cursor-pointer text-red-600"
            onClick={() => handleDelete(info.row.original.id)}
            title="Delete"
          />
        </>
      ),
    }),
  ];

  const table = useReactTable({
    data: list || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (selectedMovement) {
    return (
      <MovementDetailView
        data={selectedMovement}
        onBack={() => setSelectedMovement(null)}
      />
    );
  }

  const handleDelete = async (id: string) => {
    console.log("Attempting to delete item with id:", id);

    // Import Swal if not already imported
    import("sweetalert2").then(async (Swal) => {
      const result = await Swal.default.fire({
        title: "Are you sure?",
        text: "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        try {
          const axios = (await import("axios")).default;
          const token = localStorage.getItem("token");
          await axios.delete(`${EndPoint}inventory-movement/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          fetchAll();
        } catch (error) {
          Swal.default.fire("Error", "Failed to delete item.", "error");
        }
      }
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-indigo-900 mb-4">Move Location</h2>
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-orange-500 text-white text-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-3 font-medium border-r border-orange-400 last:border-0"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3 text-sm text-gray-600">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryMovement;
