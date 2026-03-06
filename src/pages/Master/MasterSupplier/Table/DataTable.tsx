import React, {useEffect, useMemo, useState} from "react";
import {FaPlus} from "react-icons/fa";
import Input from "../../../../components/form/input/InputField";
import Label from "../../../../components/form/Label";
import Button from "../../../../components/ui/button/Button";
import {useDebounce} from "../../../../helper/useDebounce";
import DynamicTable from "../../../../components/wms-components/DynamicTable";
import {useStoreSupplier} from "../../../../DynamicAPI/stores/Store/MasterStore";

const DataTable = () => {
    const {
        list: supplier,
        createData,
        updateData,
        deleteData,
        fetchAll,
    } = useStoreSupplier();

    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);

    useEffect(() => {
        fetchAll();
    }, []);

    // Fungsi untuk format payload create
    const handleCreate = (data: any) => {
        const formattedData = {
            organization_id: Number(data.organization_id),
            operating_unit: String(data.operating_unit),
            supplier_code: String(data.supplier_code),
            supplier_name: String(data.supplier_name),
            supplier_address: String(data.supplier_address),
            supplier_contact_person: String(data.supplier_contact_person),
            supplier_phone: String(data.supplier_phone),
            supplier_email: String(data.supplier_email),
        };
        return createData(formattedData);
    };

    // Fungsi untuk format payload update
    const handleUpdate = (data: any) => {
        const {id, ...rest} = data;
        return updateData(id, {
            organization_id: Number(rest.organization_id),
            operating_unit: String(rest.operating_unit),
            supplier_code: String(rest.supplier_code),
            supplier_name: String(rest.supplier_name),
            supplier_address: String(rest.supplier_address),
            supplier_contact_person: String(rest.supplier_contact_person),
            supplier_phone: String(rest.supplier_phone),
            supplier_email: String(rest.supplier_email),
        });
    };

    const columns = useMemo(
        () => [
            {
                accessorKey: "rowNumber",
                header: "No",
                cell: (info: any) => info.row.index + 1,
            },
            {
                accessorKey: "operating_unit",
                header: "Operating Unit",
            },
            {
                accessorKey: "supplier_code",
                header: "Supplier Code",
            },
            {
                accessorKey: "supplier_name",
                header: "Supplier Name",
            },
            {
                accessorKey: "supplier_address",
                header: "Supplier Address",
            },
            {
                accessorKey: "supplier_contact_person",
                header: "Contact Person",
            },
            {
                accessorKey: "supplier_phone",
                header: "Phone",
            },
            {
                accessorKey: "supplier_email",
                header: "Email",
            },
        ],
        []
    );

    const formFields = [
        {
            name: "operating_unit",
            label: "Operating Unit",
            type: "text",
            validation: {required: "Required"},
        },
        {
            name: "supplier_code",
            label: "Supplier Code",
            type: "text",
            validation: {required: "Required"},
        },
        {
            name: "supplier_name",
            label: "Supplier Name",
            type: "text",
            validation: {required: "Required"},
        },
        {
            name: "supplier_address",
            label: "Supplier Address",
            type: "text",
            validation: {required: "Required"},
        },
        {
            name: "supplier_contact_person",
            label: "Contact Person",
            type: "text",
            validation: {required: "Required"},
        },
        {
            name: "supplier_phone",
            label: "Phone",
            type: "text",
            validation: {required: "Required"},
        },
        {
            name: "supplier_email",
            label: "Email",
            type: "email",
            validation: {required: "Required"},
        },
    ];


    return (
        <>
            <div className="p-4 bg-white shadow rounded-md mb-5">
                <div className="flex justify-between items-center">
                    <div className="space-x-4">
                        <Label htmlFor="search">Search</Label>
                        <Input
                            onChange={(e) => setSearch(e.target.value)}
                            type="text"
                            id="search"
                            placeholder="🔍 Masukan data.."
                        />
                    </div>
                    <div className="space-x-4">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setCreateModalOpen(true)}
                        >
                            <FaPlus className="mr-2"/> Add Data
                        </Button>
                    </div>
                </div>
            </div>

            <DynamicTable
                data={supplier}
                globalFilter={debouncedSearch}
                isCreateModalOpen={isCreateModalOpen}
                onCloseCreateModal={() => setCreateModalOpen(false)}
                columns={columns}
                formFields={formFields}
                onSubmit={handleCreate}
                onUpdate={handleUpdate}
                onDelete={async (id) => {
                    await deleteData(id);
                }}
                onRefresh={fetchAll}
                getRowId={(row) => row.id}
                title="Form Data"
            />
        </>
    );
};

export default DataTable;
