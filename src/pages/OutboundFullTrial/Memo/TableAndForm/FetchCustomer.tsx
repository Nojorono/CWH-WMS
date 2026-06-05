// // ✅ FILE: FetchCustomer.ts
// import { useEffect, useState } from "react";
// import { UseFormReturn } from "react-hook-form";
// import { EndPoint } from "../../../../utils/EndPoint";

// export type OutboundSelectValue = {
//   label: string;
//   value: string;
// };

// export const useCustomerByOutboundType = (
//   typeOutbound: OutboundSelectValue | null | undefined,
//   methods: UseFormReturn<any>,
// ) => {
//   const [customerList, setCustomerList] = useState<any[]>([]);
//   const [customerRaw, setCustomerRaw] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (!typeOutbound) return;

//     const fetchCustomer = async () => {
//       setLoading(true);
//       try {
//         if (typeOutbound.value === "AMO") {
//           // --- LOGIKA UNTUK AMO (AMBIL DARI LOCALSTORAGE) ---
//           const parsedLocal = localData ? JSON.parse(localData) : [];

//           setCustomerRaw(parsedLocal);

//           const mappedAMO = parsedLocal.map((x: any) => ({
//             id: x.id,
//             label: x.organization_code, // Sesuai log: organization_code
//             value: x.organization_code,
//           }));

//           setCustomerList(mappedAMO);
//         } else {
//           // --- LOGIKA UNTUK SUBDIST (FETCH API) ---
//           const url = `${EndPoint}customer/subdist`;

//           const res = await fetch(url, {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           });

//           const json = await res.json();
//           const rows = json.data || [];

//           setCustomerRaw(rows);

//           const mappedSubdist = rows.map((x: any) => ({
//             id: x.id,
//             label: `${x.shipToLocation}`,
//             value: x.customerNumber,
//           }));

//           setCustomerList(mappedSubdist);
//         }

//         // ✅ Reset field form saat ganti type
//         methods.setValue("selected_customer", null);
//         methods.setValue("ship_to", "");
//       } catch (err) {
//         console.error("Error fetching outbound customers:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCustomer();
//   }, [typeOutbound]);

//   return { customerList, customerRaw, loading };
// };

import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { EndPoint } from "../../../../utils/EndPoint";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";

export type OutboundSelectValue = {
  label: string;
  value: string;
};

export const useCustomerByOutboundType = (
  typeOutbound: OutboundSelectValue | null | undefined,
  methods: UseFormReturn<any>,
) => {
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [customerRaw, setCustomerRaw] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Ambil data ioList dan accessToken secara reaktif dari Zustand Store
  const ioList = usePersistAuthStore((state) => state.ioList);
  const accessToken = usePersistAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!typeOutbound) return;

    const fetchCustomer = async () => {
      setLoading(true);
      try {
        if (typeOutbound.value === "AMO") {
          const currentIoList = ioList || [];
          setCustomerRaw(currentIoList);
          const mappedAMO = currentIoList.map((x: any) => ({
            id: x.id,
            label: x.organization_code,
            value: x.organization_code,
          }));

          setCustomerList(mappedAMO);
        } else {
          const url = `${EndPoint}customer/subdist`;

          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${accessToken || ""}`,
            },
          });

          const json = await res.json();
          const rows = json.data || [];

          setCustomerRaw(rows);

          const mappedSubdist = rows.map((x: any) => ({
            id: x.id,
            label: `${x.shipToLocation}`,
            value: x.customerNumber,
          }));

          setCustomerList(mappedSubdist);
        }

        // ✅ Reset field form saat ganti type
        methods.setValue("selected_customer", null);
        methods.setValue("ship_to", "");
      } catch (err) {
        console.error("Error fetching outbound customers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [typeOutbound, ioList, accessToken, methods]);

  return { customerList, customerRaw, loading };
};
