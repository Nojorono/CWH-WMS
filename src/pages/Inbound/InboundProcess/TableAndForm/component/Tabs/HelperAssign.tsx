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
    // <div className="p-4 bg-white shadow rounded-md">
    //   <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
    //     {Array.isArray(list) && list.length > 0 ? (
    //       list.map((item: any) => (
    //         <div
    //           key={item.helper_user_id}
    //           style={{
    //             border: "1px solid #ccc",
    //             borderRadius: "8px",
    //             padding: "16px",
    //             minWidth: "220px",
    //             boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    //           }}
    //         >
    //           <div>
    //             <strong>Id:</strong> {item.helper_user_id}
    //           </div>
    //           <div>
    //             <strong>Name:</strong> {item.helper_name}
    //           </div>
    //           <div>
    //             <strong>Phone:</strong> {item.helper_phone}
    //           </div>
    //         </div>
    //       ))
    //     ) : (
    //       <div>No helpers assigned.</div>
    //     )}
    //   </div>
    // </div>

    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center">
      <span className="mr-2 text-blue-500">👥</span> Assigned Helpers
    </h3>
    <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-bold">
      {Array.isArray(list) ? list.length : 0} Members
    </span>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {Array.isArray(list) && list.length > 0 ? (
      list.map((item: any) => (
        <div
          key={item.helper_user_id}
          className="group relative bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-400 hover:-translate-y-1 overflow-hidden"
        >
          {/* Aksentuasi Dekoratif saat Hover */}
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="flex items-start gap-4">
            {/* Avatar Inisial */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
              {item.helper_name?.charAt(0).toUpperCase() || "H"}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                ID: #{item.helper_user_id}
              </p>
              <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                {item.helper_name}
              </h4>
              <div className="mt-2 flex items-center text-xs text-slate-500 bg-slate-50 rounded-md p-1.5 border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                <span className="mr-2">📞</span>
                <span className="font-mono">{item.helper_phone || "No Phone"}</span>
              </div>
            </div>
          </div>
        </div>
      ))
    ) : (
      <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white rounded-xl border-2 border-dashed border-slate-200">
        <span className="text-4xl mb-2 opacity-20">📂</span>
        <p className="text-slate-400 font-medium italic text-sm">No helpers assigned to this task.</p>
      </div>
    )}
  </div>
</div>
  );
};

export default HelperAssign;
