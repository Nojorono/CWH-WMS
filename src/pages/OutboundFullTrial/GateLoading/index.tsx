import React from "react";
import GateLoadingProcess from "./GateLoadingProcess/GateLoadingProcess";

const GateLoading = () => {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Gate Loading Visibility</h1>

      <GateLoadingProcess />
    </div>
  );
};

export default GateLoading;
