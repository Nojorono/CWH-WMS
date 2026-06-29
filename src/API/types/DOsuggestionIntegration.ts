// ============================================================================
// TYPES UNTUK DATA INTEGRASI MOVE ORDER (META ORACLE / WMS)
// ============================================================================

export interface MoveOrderIntegrationLine {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    move_order_integration_id: string;
    line_iface_id: string;
    header_iface_id: string;
    line_number: string;
    organization_id: string;
    inventory_item_id: string;
    revision: string | null;
    from_subinventory_id: string | null;
    from_subinventory_code: string | null;
    from_locator_id: string | null;
    to_organization_id: string | null;
    to_subinventory_id: string | null;
    to_subinventory_code: string | null;
    to_locator_id: string | null;
    to_account_id: string | null;
    lot_number: string | null;
    serial_number_start: string | null;
    serial_number_end: string | null;
    uom_code: string;
    quantity: string;
    quantity_delivered: string | null;
    quantity_detailed: string | null;
    date_required: string;
    reason_id: string | null;
    reference_id: string | null;
    reference: string | null;
    reference_type_code: string | null;
    project_id: string | null;
    task_id: string | null;
    transaction_header_id: string | null;
    txn_source_id: string | null;
    txn_source_line_id: string | null;
    txn_source_line_detail_id: string | null;
    transaction_type_id: string;
    transaction_source_type_id: string;
    primary_quantity: string | null;
    put_away_strategy_id: string | null;
    pick_strategy_id: string | null;
    unit_number: string | null;
    ship_to_location_id: string | null;
    from_cost_group_id: string | null;
    to_cost_group_id: string | null;
    lpn_id: string | null;
    to_lpn_id: string | null;
    pick_methodology_id: string | null;
    container_item_id: string | null;
    carton_grouping_id: string | null;
    line_status: string;
    status_date: string;
    inspection_status: string | null;
    wms_process_flag: string | null;
    pick_slip_number: string | null;
    pick_slip_date: string | null;
    ship_set_id: string | null;
    ship_model_id: string | null;
    model_quantity: string | null;
    required_quantity: string | null;
    secondary_uom: string | null;
    secondary_quantity: string | null;
    secondary_quantity_detailed: string | null;
    secondary_quantity_delivered: string | null;
    secondary_required_quantity: string | null;
    grade_code: string | null;

    // Flexfields (Atribut Khusus Oracle)
    attribute_category: string | null;
    attribute1: string | null;
    attribute2: string | null;
    attribute3: string | null;
    attribute4: string | null;
    attribute5: string | null;
    attribute6: string | null;
    attribute7: string | null;
    attribute8: string | null;
    attribute9: string | null;
    attribute10: string | null;
    attribute11: string | null;
    attribute12: string | null;
    attribute13: string | null;
    attribute14: string | null;
    attribute15: string | null;

    program_application_id: string | null;
    program_id: string | null;
    program_update_date: string | null;
    operation: string;
    db_flag: string;
    line_id: string;
    header_id: string;
    transaction_temp_id: string;
    request_id: string | null;
    source_system: string;
    source_header_id: string;
    source_line_id: string | null;
    source_batch_id: string | null;

    // Status Integrasi
    iface_status: string; // Contoh: "ERROR", "SUCCESS"
    iface_message: string;

    creation_date: string;
    created_by: string | null;
    last_update_login: string;
    last_update_date: string;
    last_updated_by: string;
}

export interface MoveOrderIntegrationHeader {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    master_io_id: string;
    header_iface_id: string;
    request_number: string;
    transaction_type_id: string;
    move_order_type: string;
    organization_id: string;
    description: string;
    date_required: string;
    from_subinventory_code: string | null;
    to_subinventory_code: string | null;
    to_account_id: string | null;
    grouping_rule_id: string | null;
    ship_to_location_id: string | null;
    reference_id: string | null;
    header_status: string;
    status_date: string;

    // Flexfields (Atribut Khusus Oracle)
    attribute_category: string | null;
    attribute1: string | null;
    attribute2: string | null;
    attribute3: string | null;
    attribute4: string | null;
    attribute5: string | null;
    attribute6: string | null;
    attribute7: string | null;
    attribute8: string | null;
    attribute9: string | null;
    attribute10: string | null;
    attribute11: string | null;
    attribute12: string | null;
    attribute13: string | null;
    attribute14: string | null;
    attribute15: string | null;

    program_application_id: string | null;
    program_id: string | null;
    program_update_date: string | null;
    operation: string;
    db_flag: string;
    header_id: string;
    request_id: string | null;
    source_system: string;
    source_header_id: string;
    source_line_id: string | null;
    source_batch_id: string | null;

    // Status Integrasi
    iface_status: string; // Contoh: "ERROR", "SUCCESS"
    iface_message: string;
    iface_mode: string;

    total_lines: number; // Angka numerik

    creation_date: string;
    created_by: string | null;
    last_update_login: string;
    last_update_date: string;
    last_updated_by: string;

    // Relasi ke Data Baris (Lines)
    lines: MoveOrderIntegrationLine[];
}

export interface MoveOrderIntegrationResponse {
    data: MoveOrderIntegrationHeader[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface MoveOrderIntegrationParams {
    page: number;
    limit: number;
    sortOrder?: "ASC" | "DESC";
    iface_status?: any
    source_system?: string;
    search?: string;
}