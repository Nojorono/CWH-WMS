// 👇 Ganti di sini saja kalo mau ganti mode: 'dev' atau 'prod'
// src/utils/env.ts
type AppEnv = "dev" | "prod";

// 👇 ON/OFF MANUAL DI SINI SAJA
const ACTIVE_ENV: AppEnv = "dev";
// const ACTIVE_ENV: AppEnv = "prod";

export default ACTIVE_ENV;
