import { useState, useEffect, useMemo } from "react";
import { FaSync, FaSearch, FaInfoCircle } from "react-icons/fa";
import dayjs from "dayjs";
import AdjustTable from "../component/AdjustTable";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import Button from "../../../../components/ui/button/Button";
import ActIndicator from "../../../../components/ui/activityIndicator";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import Select from "../../../../components/form/Select";
import { useStoreUser } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { getTargetDate, getServerDayjs, isBypassMode } from "../global/allowedDate";
import { useCallPlan } from "../hook/useCallPlan";
import { processCallPlanData } from "../helper/callPlanMapper";
import { CallPlanDetail } from "../../../../API/types/callPlan";
import { BypassTimeController } from "../../OutboundSales/component/BypassTimeController";

const MainTable = () => {
  const [loadingVisible, setLoadingVisible] = useState(false);

  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [mergedData, setMergedData] = useState<CallPlanDetail[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // State untuk menyimpan NIK Supervisor yang dipilih oleh AHOM
  const [selectedSpvNik, setSelectedSpvNik] = useState<string | null>(null);

  const state = usePersistAuthStore.getState();
  const user = state.user;
  const organization_name = user?.userDetail?.organization?.organization_name;
  const userNIK = user?.userDetail?.employee_id;
  const role_name = user?.role?.name;
  const isAhom = role_name === "AHOM";
  const activeSpvNik = isAhom ? selectedSpvNik : userNIK;
  const shouldFetchCallPlan = !!activeSpvNik;

  const TARGET_DATE = useMemo(() => getTargetDate(role_name), [role_name]);

  // Kalkulasi H-2 dan H-1 dalam format tanggal nyata agar dipahami user awam
  const hMinus2Text = useMemo(() => {
    return dayjs(TARGET_DATE).subtract(2, "day").format("DD MMM YYYY");
  }, [TARGET_DATE]);

  const hMinus1Text = useMemo(() => {
    return dayjs(TARGET_DATE).subtract(1, "day").format("DD MMM YYYY");
  }, [TARGET_DATE]);

  const { list: userData, fetchAll: fetchAllUsers } = useStoreUser();

  // State untuk menyimpan informasi waktu dan mode real-time
  const [timeInfo, setTimeInfo] = useState(() => ({
    time: getServerDayjs(),
    isBypass: isBypassMode(),
  }));

  // Interval 1 detik untuk meng-update waktu secara berkala (detik berjalan)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeInfo({
        time: getServerDayjs(),
        isBypass: isBypassMode(),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAhom) {
      fetchAllUsers();
    }
  }, [isAhom, fetchAllUsers]);

  const spvOptions = useMemo(() => {
    if (!userData) return [];
    const spvList = Array.isArray(userData)
      ? userData
      : (userData as any).data || [];

    return spvList
      .filter((u: any) => u.role?.name === "SALES_SUPERVISOR")
      .map((spv: any) => ({
        label: `${spv.userDetail?.firstName} ${spv.userDetail?.lastName} - ${spv.userDetail?.employee_id}`,
        value: spv.userDetail?.employee_id,
      }));
  }, [userData]);

  // 3. Masukkan Target Date dinamis ke param API
  const paramGetCallplan = useMemo(
    () => ({
      CABANG: String(organization_name),
      SALES_SUPERVISOR_NIK: String(activeSpvNik),
      CALL_PLAN_START_DATE: TARGET_DATE,
    }),
    [organization_name, activeSpvNik, TARGET_DATE],
  );

  console.log("TARGET DATE", TARGET_DATE);

  const {
    data: callPlanList,
    isLoading: isCallPlanLoading,
    refetch,
  } = useCallPlan(paramGetCallplan, { enabled: shouldFetchCallPlan });

  useEffect(() => {
    if (!callPlanList || callPlanList.length === 0) {
      setMergedData([]);
      return;
    }
    const callplanChecked = async () => {
      setIsProcessing(true);
      const result = await processCallPlanData(callPlanList);
      setMergedData(result);
      setIsProcessing(false);
    };

    callplanChecked();
  }, [callPlanList]);

  useEffect(() => {
    if (isCallPlanLoading || isProcessing) {
      setLoadingVisible(true);
      return;
    }

    const timer = setTimeout(() => {
      setLoadingVisible(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [isCallPlanLoading, isProcessing]);

  const isLoading = loadingVisible;

  const [showBypass, setShowBypass] = useState(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setShowBypass((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="w-full space-y-4 p-4 bg-[#F8FAFC] min-h-screen">
      <PageBreadcrumb breadcrumbs={[{ title: "List Salesman Callplan" }]} />

      {showBypass && <BypassTimeController />}

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl shadow-sm flex items-start gap-3">
        <FaInfoCircle className="text-blue-500 mt-0.5 size-5 flex-shrink-0" />
        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-blue-900">
              Jadwal Generate DO Suggestion
            </h4>
            <p className="text-xs text-blue-800 mt-1 leading-relaxed">
              Untuk mempersiapkan kunjungan tanggal{" "}
              <strong className="text-blue-950 font-bold">{dayjs(TARGET_DATE).format("DD MMM YYYY")}</strong>,
              DO Suggestion dapat dilakukan pada jadwal berikut:
            </p>
            <ul className="text-xs text-blue-800 mt-2 list-disc list-inside space-y-1 pl-1">
              <li>
                <strong>Tombol Generate Aktif</strong> H-2 kunjungan yaitu tanggal{" "}
                <span className="underline font-semibold text-blue-950">{hMinus2Text}</span> mulai pukul{" "}
                <strong className="text-blue-950 font-bold">13:00 WIB</strong>.
              </li>
              <li>
                <strong>Tombol Generate Non-Aktif</strong> H-1 kunjungan yaitu tanggal{" "}
                <span className="underline font-semibold text-blue-950">{hMinus1Text}</span> sebelum pukul{" "}
                <strong className="text-blue-950 font-bold">09:00 WIB</strong> (maksimal pukul <strong className="text-blue-950 font-bold">08:59 WIB</strong>).
              </li>
              <li>
                <strong>Pergantian Siklus Data:</strong> Tepat pukul{" "}
                <strong className="text-blue-950 font-bold">09:00 WIB</strong> di H-1, data tabel akan otomatis diperbarui dan berganti ke siklus Call Plan untuk jadwal pengiriman berikutnya.
              </li>
            </ul>
            <p className="text-[11px] text-blue-700/80 mt-2 italic">
              *Catatan: Tombol "Generate" di tabel bawah akan aktif & nonaktif secara otomatis mengikuti jadwal di atas.
              Setelah jam 09:00 pagi di H-1, sistem akan mengunci data untuk memproses siklus hari berikutnya.
            </p>
          </div>

          {/* Widget Indikator Waktu & Mode Validasi */}
          <div className="flex flex-col items-end whitespace-nowrap bg-white/80 backdrop-blur-sm border border-blue-100 rounded-lg p-2.5 shadow-sm text-xs font-semibold self-start md:self-center">
            <div className="text-slate-500 mb-1 flex items-center gap-1.5">
              <span>Mode Waktu:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${timeInfo.isBypass
                  ? "bg-amber-100 text-amber-800 border-amber-200 animate-pulse"
                  : "bg-emerald-100 text-emerald-800 border-emerald-200"
                  }`}
              >
                {timeInfo.isBypass ? "⚠️ Bypass (Simulasi)" : "🌍 Server Time"}
              </span>
            </div>
            <div className="text-slate-700 font-mono text-sm font-bold">
              {timeInfo.time.format("DD MMM YYYY - HH:mm:ss")}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Render Dropdown SPV hanya jika user adalah AHOM */}
        {isAhom && (
          <div className="w-full md:w-64">
            <Select
              options={spvOptions}
              value={selectedSpvNik || ""}
              onChange={(value) => setSelectedSpvNik(value)}
              placeholder="Pilih Supervisor..."
              className="w-full"
            />
          </div>
        )}

        <div className="flex-1">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <FaSearch className="size-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search sales name..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              onChange={(e) => setGlobalFilter(e.target.value)}
              disabled={!activeSpvNik}
            />
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="bg-blue-600"
          onClick={() => refetch()}
          disabled={!activeSpvNik}
        >
          <FaSync className="mr-2 size-3" /> Refresh
        </Button>
      </div>

      {/* Tampilan berdasarkan state */}
      {!activeSpvNik ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 flex flex-col items-center justify-center text-slate-500">
          <p className="font-medium text-lg mb-2">Pilih Supervisor</p>
          <p className="text-sm">
            Silakan pilih Sales Supervisor pada opsi di atas untuk menampilkan
            data.
          </p>
        </div>
      ) : isLoading ? (
        <>
          <ActIndicator />
        </>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <AdjustTable
              data={mergedData}
              globalFilter={globalFilter}
              setGlobalFilter={setGlobalFilter}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MainTable;