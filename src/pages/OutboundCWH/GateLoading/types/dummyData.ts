export const outboundGateDummy = [
    {
        id: "0f0e8cef-f148-4a3b-9e85-99ab5236c3a7",
        createdAt: "2025-12-12T09:25:22.621Z",
        updatedAt: "2025-12-12T09:46:47.934Z",
        deletedAt: null,
        gate_id: "29637a42-8e93-472e-9ac3-4baa4cfcb612",
        gate: {
            id: "29637a42-8e93-472e-9ac3-4baa4cfcb612",
            createdAt: "2025-12-09T07:13:40.676Z",
            updatedAt: "2025-12-10T01:50:21.094Z",
            deletedAt: null,
            organization_id: 2,
            warehouse_id: "f5b905c7-33b8-479f-be96-7c7c4eb26d63",
            name: "GATE-1",
            code: "GATE-1",
            description: "GATE-1",
            capacity_bin: 0,
            barcode_image_url: null,
            is_staging: null,
            is_good_stock: true,
            is_gate: true
        },
        outbound_do_id: "c06962e4-ea76-4cc0-8c54-6a4b09f5b58d",
        status: "DONE",
        outbound_do: {
            id: "c06962e4-ea76-4cc0-8c54-6a4b09f5b58d",
            createdAt: "2025-12-12T08:23:47.311Z",
            updatedAt: "2025-12-12T09:24:40.613Z",
            deletedAt: null,
            outbound_do_number: "DO-20251212-152347-367",
            expedition: "JNE",
            origin: "KUDUS",
            license_plate: "B0002TRE",
            driver_name: "CACAP",
            driver_phone: "082321312323",
            status: "APPROVED",
            outbound_type: "SUBDIST",
            delivery_date: "2025-12-12T00:00:00.000Z",
            memo_id: ["09590723-2836-4f36-ad28-96b0311486b4"],
            memo_sequence: ["1"],
            outbound_memos: [
                {
                    id: "09590723-2836-4f36-ad28-96b0311486b4",
                    createdAt: "2025-12-03T02:44:47.874Z",
                    updatedAt: "2025-12-12T08:23:47.305Z",
                    deletedAt: null,
                    outbound_memo_number: "OM-20251203-0002",
                    requestor: "ALVI CEPER",
                    origin: "KUDUS",
                    ship_to: "SDN - MANADO",
                    destination: "SDN - MANADO",
                    delivery_date: "2025-12-03T00:00:00.000Z",
                    status: "APPROVED",
                    type: "SUBDIST",
                    notes: "TEST 2",
                    has_do: true,
                    outbound_memo_items: [
                        {
                            id: "06cb6f23-1a0a-4d0a-9721-7f12bd3f3a7f",
                            createdAt: "2025-12-03T02:44:47.878Z",
                            updatedAt: "2025-12-03T02:44:47.878Z",
                            deletedAt: null,
                            outbound_memo_id: "09590723-2836-4f36-ad28-96b0311486b4",
                            item_id: "06888227-b98a-4672-9765-012b99b9982e",
                            quantity_plan: 10,
                            quantity_delivered: null,
                            uom: "DUS",
                            status: "PROCESS"
                        },
                        {
                            id: "11938594-568f-4034-9101-311f88d93c69",
                            createdAt: "2025-12-03T02:44:47.878Z",
                            updatedAt: "2025-12-03T02:44:47.878Z",
                            deletedAt: null,
                            outbound_memo_id: "09590723-2836-4f36-ad28-96b0311486b4",
                            item_id: "153b4b55-ca1c-4c3e-90a3-3839e1a7ad6c",
                            quantity_plan: 15,
                            quantity_delivered: null,
                            uom: "DUS",
                            status: "PROCESS"
                        },
                        {
                            id: "041550c6-5c92-4241-bca8-3f96fbf6d2c3",
                            createdAt: "2025-12-03T02:44:47.878Z",
                            updatedAt: "2025-12-03T02:44:47.878Z",
                            deletedAt: null,
                            outbound_memo_id: "09590723-2836-4f36-ad28-96b0311486b4",
                            item_id: "7f9f8a1e-5420-48a6-a10a-c85037f9abfa",
                            quantity_plan: 20,
                            quantity_delivered: null,
                            uom: "DUS",
                            status: "PROCESS"
                        }
                    ],
                    transaction_pickings: [
                        {
                            id: "f9cdc414-cba2-4ba8-9222-9a7e60c16417",
                            createdAt: "2025-12-03T02:46:11.430Z",
                            updatedAt: "2025-12-12T08:18:51.055Z",
                            deletedAt: null,
                            do_id: "ab623da4-6787-40be-8f22-facdc6ccfe5c",
                            memo_id: "09590723-2836-4f36-ad28-96b0311486b4",
                            item_id: "06888227-b98a-4672-9765-012b99b9982e",
                            source_warehouse_sub_id: "baea7245-ff90-4cdb-9716-2424fa3636ba",
                            source_bin_id: "57b82c7e-6024-4e4f-8e92-19bd4ca66cdf",
                            destination_warehouse_sub_id: "73b1e685-d258-440b-b3cf-d66f34dd8187",
                            destination_bin_id: "002a9981-fd3d-4cc1-8e4c-dc29fc7d809a",
                            quantity: 10,
                            uom: "DUS",
                            week_number: 49,
                            status: "CANCELLED",
                            transactionScanPicking: [
                                {
                                    id: "1b59ddd4-64f1-4fe8-b403-a1d8a0690c6f",
                                    createdAt: "2025-12-11T15:35:51.203Z",
                                    updatedAt: "2025-12-11T15:39:49.670Z",
                                    deletedAt: null,
                                    transaction_picking_id: "f9cdc414-cba2-4ba8-9222-9a7e60c16417",
                                    pallet_source_id: "13c86f10-2a6a-4106-b4ed-f96cb054cf02",
                                    pallet_use_id: "37c8ccad-dbce-4108-a522-b11ca5414c9c",
                                    pallet_switch_id: null,
                                    item_id: "06888227-b98a-4672-9765-012b99b9982e",
                                    quantity_picked: 10,
                                    quantity_switch: null,
                                    uom: "DUS",
                                    week_number: 49,
                                    status: "INSPECTION_APPROVED",
                                    user_id: "test-user-123",
                                    user_name: "test user",
                                    inspection_by: "ALVI CEPER"
                                }
                            ]
                        },
                        {
                            id: "76445c07-cef1-4dd4-85eb-72b8234fa0f9",
                            createdAt: "2025-12-03T02:46:11.430Z",
                            updatedAt: "2025-12-12T08:18:51.055Z",
                            deletedAt: null,
                            do_id: "ab623da4-6787-40be-8f22-facdc6ccfe5c",
                            memo_id: "09590723-2836-4f36-ad28-96b0311486b4",
                            item_id: "7f9f8a1e-5420-48a6-a10a-c85037f9abfa",
                            source_warehouse_sub_id: "baea7245-ff90-4cdb-9716-2424fa3636ba",
                            source_bin_id: "6fabea75-f59c-4ce2-94f6-952b91a94727",
                            destination_warehouse_sub_id: "73b1e685-d258-440b-b3cf-d66f34dd8187",
                            destination_bin_id: "002a9981-fd3d-4cc1-8e4c-dc29fc7d809a",
                            quantity: 20,
                            uom: "DUS",
                            week_number: 49,
                            status: "CANCELLED",
                            transactionScanPicking: [
                                {
                                    id: "0c2321b2-0a7b-4029-8f72-8c3ba14c52bd",
                                    createdAt: "2025-12-11T15:37:43.795Z",
                                    updatedAt: "2025-12-11T15:39:33.930Z",
                                    deletedAt: null,
                                    transaction_picking_id: "76445c07-cef1-4dd4-85eb-72b8234fa0f9",
                                    pallet_source_id: "d97e752d-3650-4c7f-8b23-8c8ce6745b82",
                                    pallet_use_id: "37c8ccad-dbce-4108-a522-b11ca5414c9c",
                                    pallet_switch_id: null,
                                    item_id: "7f9f8a1e-5420-48a6-a10a-c85037f9abfa",
                                    quantity_picked: 20,
                                    quantity_switch: null,
                                    uom: "DUS",
                                    week_number: 49,
                                    status: "INSPECTION_APPROVED",
                                    user_id: "test-user-123",
                                    user_name: "test user",
                                    inspection_by: "ALVI CEPER"
                                }
                            ]
                        },
                        {
                            id: "6f21869a-674f-4f4b-bace-bdb7a291831e",
                            createdAt: "2025-12-03T02:46:11.430Z",
                            updatedAt: "2025-12-12T08:18:51.055Z",
                            deletedAt: null,
                            do_id: "ab623da4-6787-40be-8f22-facdc6ccfe5c",
                            memo_id: "09590723-2836-4f36-ad28-96b0311486b4",
                            item_id: "153b4b55-ca1c-4c3e-90a3-3839e1a7ad6c",
                            source_warehouse_sub_id: "baea7245-ff90-4cdb-9716-2424fa3636ba",
                            source_bin_id: "25bf7e1d-be0a-408f-96d4-9b90fa02ff6b",
                            destination_warehouse_sub_id: "73b1e685-d258-440b-b3cf-d66f34dd8187",
                            destination_bin_id: "002a9981-fd3d-4cc1-8e4c-dc29fc7d809a",
                            quantity: 15,
                            uom: "DUS",
                            week_number: 49,
                            status: "CANCELLED",
                            transactionScanPicking: [
                                {
                                    id: "c39645f6-c96c-4ca6-a33e-9c959123b05f",
                                    createdAt: "2025-12-11T15:37:01.551Z",
                                    updatedAt: "2025-12-11T15:40:07.601Z",
                                    deletedAt: null,
                                    transaction_picking_id: "6f21869a-674f-4f4b-bace-bdb7a291831e",
                                    pallet_source_id: "cd93eea0-5a77-47da-ae9a-b48e684ce832",
                                    pallet_use_id: "37c8ccad-dbce-4108-a522-b11ca5414c9c",
                                    pallet_switch_id: null,
                                    item_id: "153b4b55-ca1c-4c3e-90a3-3839e1a7ad6c",
                                    quantity_picked: 15,
                                    quantity_switch: null,
                                    uom: "DUS",
                                    week_number: 49,
                                    status: "INSPECTION_APPROVED",
                                    user_id: "test-user-123",
                                    user_name: "test user",
                                    inspection_by: "ALVI CEPER"
                                }
                            ]
                        },
                        {
                            id: "9b50f134-b000-4000-bda5-9268693852a9",
                            createdAt: "2025-12-12T08:52:30.430Z",
                            updatedAt: "2025-12-12T08:52:30.430Z",
                            deletedAt: null,
                            do_id: "c06962e4-ea76-4cc0-8c54-6a4b09f5b58d",
                            memo_id: "09590723-2836-4f36-ad28-96b0311486b4",
                            item_id: "06888227-b98a-4672-9765-012b99b9982e",
                            source_warehouse_sub_id: "73b1e685-d258-440b-b3cf-d66f34dd8187",
                            source_bin_id: "002a9981-fd3d-4cc1-8e4c-dc29fc7d809a",
                            destination_warehouse_sub_id: "73b1e685-d258-440b-b3cf-d66f34dd8187",
                            destination_bin_id: "b1c007ef-269c-4b81-9487-98eda0bbd951",
                            quantity: 10,
                            uom: "DUS",
                            week_number: 49,
                            status: "PENDING",
                            transactionScanPicking: [
                                {
                                    id: "5272ea6c-f52f-4a4c-bb87-d60647f12f6d",
                                    createdAt: "2025-12-12T09:07:12.743Z",
                                    updatedAt: "2025-12-12T09:19:38.270Z",
                                    deletedAt: null,
                                    transaction_picking_id: "9b50f134-b000-4000-bda5-9268693852a9",
                                    pallet_source_id: "13c86f10-2a6a-4106-b4ed-f96cb054cf02",
                                    pallet_use_id: "b6f36c54-80fd-40c4-bfd9-2677b4587dc4",
                                    pallet_switch_id: null,
                                    item_id: "06888227-b98a-4672-9765-012b99b9982e",
                                    quantity_picked: 10,
                                    quantity_switch: null,
                                    uom: "DUS",
                                    week_number: 49,
                                    status: "INSPECTION_APPROVED",
                                    user_id: "test-user-123",
                                    user_name: "test user",
                                    inspection_by: "ALVI CEPER"
                                }
                            ]
                        },
                        {
                            id: "58579f8d-e23a-4278-bca2-903671320c3b",
                            createdAt: "2025-12-12T08:52:30.430Z",
                            updatedAt: "2025-12-12T08:52:30.430Z",
                            deletedAt: null,
                            do_id: "c06962e4-ea76-4cc0-8c54-6a4b09f5b58d",
                            memo_id: "09590723-2836-4f36-ad28-96b0311486b4",
                            item_id: "7f9f8a1e-5420-48a6-a10a-c85037f9abfa",
                            source_warehouse_sub_id: "73b1e685-d258-440b-b3cf-d66f34dd8187",
                            source_bin_id: "002a9981-fd3d-4cc1-8e4c-dc29fc7d809a",
                            destination_warehouse_sub_id: "73b1e685-d258-440b-b3cf-d66f34dd8187",
                            destination_bin_id: "b1c007ef-269c-4b81-9487-98eda0bbd951",
                            quantity: 20,
                            uom: "DUS",
                            week_number: 49,
                            status: "PENDING",
                            transactionScanPicking: [
                                {
                                    id: "bf15aa17-84a0-4f54-8916-ac5819de1122",
                                    createdAt: "2025-12-12T09:08:48.167Z",
                                    updatedAt: "2025-12-12T09:19:13.857Z",
                                    deletedAt: null,
                                    transaction_picking_id: "58579f8d-e23a-4278-bca2-903671320c3b",
                                    pallet_source_id: "d97e752d-3650-4c7f-8b23-8c8ce6745b82",
                                    pallet_use_id: "b6f36c54-80fd-40c4-bfd9-2677b4587dc4",
                                    pallet_switch_id: null,
                                    item_id: "7f9f8a1e-5420-48a6-a10a-c85037f9abfa",
                                    quantity_picked: 20,
                                    quantity_switch: null,
                                    uom: "DUS",
                                    week_number: 49,
                                    status: "INSPECTION_APPROVED",
                                    user_id: "test-user-123",
                                    user_name: "test user",
                                    inspection_by: "ALVI CEPER"
                                }
                            ]
                        },
                        {
                            id: "29277efb-5103-433a-897c-bd00e52181be",
                            createdAt: "2025-12-12T08:52:30.430Z",
                            updatedAt: "2025-12-12T08:52:30.430Z",
                            deletedAt: null,
                            do_id: "c06962e4-ea76-4cc0-8c54-6a4b09f5b58d",
                            memo_id: "09590723-2836-4f36-ad28-96b0311486b4",
                            item_id: "153b4b55-ca1c-4c3e-90a3-3839e1a7ad6c",
                            source_warehouse_sub_id: "73b1e685-d258-440b-b3cf-d66f34dd8187",
                            source_bin_id: "002a9981-fd3d-4cc1-8e4c-dc29fc7d809a",
                            destination_warehouse_sub_id: "73b1e685-d258-440b-b3cf-d66f34dd8187",
                            destination_bin_id: "b1c007ef-269c-4b81-9487-98eda0bbd951",
                            quantity: 15,
                            uom: "DUS",
                            week_number: 49,
                            status: "PENDING",
                            transactionScanPicking: [
                                {
                                    id: "0876d0ce-7df8-44f8-b9b1-d555aca053fa",
                                    createdAt: "2025-12-12T09:09:45.278Z",
                                    updatedAt: "2025-12-12T09:19:55.065Z",
                                    deletedAt: null,
                                    transaction_picking_id: "29277efb-5103-433a-897c-bd00e52181be",
                                    pallet_source_id: "cd93eea0-5a77-47da-ae9a-b48e684ce832",
                                    pallet_use_id: "b6f36c54-80fd-40c4-bfd9-2677b4587dc4",
                                    pallet_switch_id: null,
                                    item_id: "153b4b55-ca1c-4c3e-90a3-3839e1a7ad6c",
                                    quantity_picked: 15,
                                    quantity_switch: null,
                                    uom: "DUS",
                                    week_number: 49,
                                    status: "INSPECTION_APPROVED",
                                    user_id: "test-user-123",
                                    user_name: "test user",
                                    inspection_by: "ALVI CEPER"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        assigned_gate_users: [
            {
                id: "be8c956f-4539-41e5-a8fd-405d7a82fada",
                createdAt: "2025-12-12T09:25:22.633Z",
                updatedAt: "2025-12-12T09:25:22.633Z",
                deletedAt: null,
                assigned_gate_id: "0f0e8cef-f148-4a3b-9e85-99ab5236c3a7",
                user_id: "7ca0f958-6c1b-4d18-81bd-6489c9a7c6ad",
                user: {
                    id: "7ca0f958-6c1b-4d18-81bd-6489c9a7c6ad",
                    createdAt: "2025-11-24T01:53:14.106Z",
                    updatedAt: "2025-11-24T01:53:14.106Z",
                    deletedAt: null,
                    username: "forklift01",
                    password:
                        "$2b$10$/C3sIstB2fG.Sn7eFZqVEOAtRL6LYDk3.hMiUbVNN52XaUTUUF5QW",
                    isActive: true,
                    roleId: 4,
                    userDetailId: null
                },
                user_name: "CAPUNG",
                user_phone: "08777777123"
            },
            {
                id: "cf74d59a-ce5c-488f-bfc0-0ec99f516b0b",
                createdAt: "2025-12-12T09:26:08.876Z",
                updatedAt: "2025-12-12T09:26:08.876Z",
                deletedAt: null,
                assigned_gate_id: "0f0e8cef-f148-4a3b-9e85-99ab5236c3a7",
                user_id: "4bc44590-9ed7-4208-8dd3-895ae1d8288a",
                user: {
                    id: "4bc44590-9ed7-4208-8dd3-895ae1d8288a",
                    createdAt: "2025-11-24T01:53:14.106Z",
                    updatedAt: "2025-12-03T02:39:57.248Z",
                    deletedAt: null,
                    username: "forklift02",
                    password:
                        "$2b$10$IhlpY/Drh5UvDG9oZo2lC.cd3khRn.qarO8O7KfclmCJgPe2GS3Ny",
                    isActive: true,
                    roleId: 4,
                    userDetailId: null
                },
                user_name: "NABIL",
                user_phone: "099999"
            }
        ],
        assigned_gate_pallets: [
            {
                id: "0f0e8cef-f148-4a3b-9e85-99ab5236c3a7",
                createdAt: "2025-12-12T09:46:26.921Z",
                updatedAt: "2025-12-12T09:46:26.921Z",
                deletedAt: null,
                assigned_gate_id: "0f0e8cef-f148-4a3b-9e85-99ab5236c3a7",
                pallet_id: "b6f36c54-80fd-40c4-bfd9-2677b4587dc4",
                pallet: {
                    id: "b6f36c54-80fd-40c4-bfd9-2677b4587dc4",
                    createdAt: "2025-12-12T09:06:45.829Z",
                    updatedAt: "2025-12-12T09:09:45.220Z",
                    deletedAt: null,
                    organization_id: 2,
                    pallet_code: "PALPICK-004",
                    capacity: 1000,
                    isActive: true,
                    isFull: false,
                    uom: "DUS",
                    currentQuantity: 45,
                    currentWeekNumber: 49,
                    currentItems: [
                        {
                            item_id: "06888227-b98a-4672-9765-012b99b9982e",
                            item_name: "CLM12",
                            current_quantity: 10,
                            uom: "DUS",
                            production_date: "2025-12-03T00:00:00.000Z",
                            week_number: 49
                        },
                        {
                            item_id: "7f9f8a1e-5420-48a6-a10a-c85037f9abfa",
                            item_name: "CLM16",
                            current_quantity: 20,
                            uom: "DUS",
                            production_date: "2025-12-03T00:00:00.000Z",
                            week_number: 49
                        },
                        {
                            item_id: "153b4b55-ca1c-4c3e-90a3-3839e1a7ad6c",
                            item_name: "CLM20",
                            current_quantity: 15,
                            uom: "DUS",
                            production_date: "2025-12-03T00:00:00.000Z",
                            week_number: 49
                        }
                    ]
                },
                status: "COMPLETED"
            }
        ]
    }
];

export default outboundGateDummy;