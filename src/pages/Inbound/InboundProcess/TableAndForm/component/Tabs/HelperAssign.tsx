import React, { useEffect } from "react";
import { useStoreHelperAssign } from "../../../../../../DynamicAPI/stores/Store/MasterStore";

interface HelperAssignProps {
  inboundID?: string;
}

const HelperAssign: React.FC<HelperAssignProps> = ({ inboundID }) => {
  const { fetchUsingParam, list } = useStoreHelperAssign();

  useEffect(() => {
    if (inboundID) {
      fetchUsingParam({
        inbound_id: inboundID,
      });
    }
  }, [fetchUsingParam, inboundID]);

  return (
    <div className="p-4 bg-white shadow rounded-md">
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {Array.isArray(list) && list.length > 0 ? (
          list.map((item: any) => (
            <div
              key={item.helper_user_id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "16px",
                minWidth: "220px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <div>
                <strong>ID:</strong> {item.helper_user_id}
              </div>
              <div>
                <strong>Name:</strong> {item.helper_name}
              </div>
              <div>
                <strong>Phone:</strong> {item.helper_phone}
              </div>
            </div>
          ))
        ) : (
          <div>No helpers assigned.</div>
        )}
      </div>
    </div>
  );
};

export default HelperAssign;
