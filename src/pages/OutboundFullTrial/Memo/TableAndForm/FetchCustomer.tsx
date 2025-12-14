// ✅ FILE: FetchCustomer.ts
import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { EndPoint } from "../../../../utils/EndPoint";

export type OutboundSelectValue = {
  label: string;
  value: string;
};

export const useCustomerByOutboundType = (
  typeOutbound: OutboundSelectValue | null | undefined,
  methods: UseFormReturn<any>
) => {
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [customerRaw, setCustomerRaw] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!typeOutbound) return;

    const fetchCustomer = async () => {
      try {
        setLoading(true);

        const url =
          typeOutbound.value === "AMO"
            ? `${EndPoint}customer/main`
            : `${EndPoint}customer/subdist`;

        const token = localStorage.getItem("token");

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();
        const rows = json.data || [];

        // ✅ Simpan mentah untuk mapping ship_to
        setCustomerRaw(rows);

        // ✅ Mapping dropdown
        const parsedList =
          typeOutbound.value === "AMO"
            ? rows.map((x: any) => ({
                id: x.id,
                label: x.locationDescription,
                value: x.locationCode,
              }))
            : rows.map((x: any) => ({
                id: x.id,
                label: `${x.shipToLocation}`,
                value: x.customerNumber,
              }));

        setCustomerList(parsedList);

        // ✅ Reset saat ganti type
        methods.setValue("selected_customer", null);
        methods.setValue("ship_to", "");
      } catch (err) {
        console.error("Error fetching outbound customers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [typeOutbound]);

  return { customerList, customerRaw, loading };
};
