/**
 * DWH / Snowflake services (legacy parallel path).
 * Sumber data: Snowflake (VITE_SNOWFLAKE_*), bukan WMS BE.
 *
 * Outbound Salesman & alur utama sekarang pakai BE:
 * - callplan → API/services/outbound-salesman/CallplanService
 * - BTB WMS → API/services/outbound-salesman/BTBService
 *
 * File di folder ini tetap ada untuk modul DO Suggestion lama.
 */
export { getCallPlan } from "./callPlanService";
/** BTB flat dari Snowflake (bukan /btb WMS) */
export { getBTB as getBTBFromSnowflake } from "./getBTBservice";
export { getBTB } from "./getBTBservice";
export { getDOsuggestion } from "./DOsuggestionService";
