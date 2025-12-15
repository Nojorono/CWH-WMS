import React, { useState } from "react";
import { SuggestionCardHeader } from "../SuggestionItems/SuggestionCardHeader";
import { SuggestionItemsTable } from "../SuggestionItems/SuggestionItemsTable";
import { EndPoint } from "../../../../utils/EndPoint";
import Button from "../../../../components/ui/button/Button";
import { FaArrowLeft } from "react-icons/fa";

interface SuggestionTableProps {
  memoDetail: any;
  DOid: string;
  onBack?: () => void;
}

export const SuggestionItemLocation: React.FC<SuggestionTableProps> = ({
  memoDetail,
  DOid,
  onBack,
}) => {
  const [metodeSuggestion, setMetodeSuggestion] = useState("");
  const [destinationBinId, setDestinationBinId] = useState("");
  const [destinationZoneId, setDestinationZoneId] = useState("");
  const [isLoadingFetch, setLoadingFetch] = useState<boolean>(false);
  const [dataSuggestion, setDataSuggestion] = useState<any[]>([]);

  console.log("dataSuggestion:", dataSuggestion);

  const handleEdit = (item: any) => {
    console.log("Edit item:", item);
  };

  const handleAddItem = (item: any) => {
    console.log("Add item:", item);
  };

  const fetchPickingSuggestionById = async () => {
    const memoId = memoDetail.id; // Ambil memo_id dari memoDetail.id
    if (!memoId) return; // Pastikan memoId ada sebelum fetch

    const token = localStorage.getItem("token");
    const API = `${EndPoint}picking-suggestion/memo/${memoId}?sortMethod=${metodeSuggestion}`;

    setLoadingFetch(true);

    try {
      const response = await fetch(API, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();      
      setDataSuggestion(data.data);
      setLoadingFetch(false);
    } catch (error) {
      console.error("Error fetching picking suggestion:", error);
    } finally {
      setLoadingFetch(false);
    }
  };

  const handleFetchSuggestion = () => {
    fetchPickingSuggestionById();
  };

  const handleChangeDestination = (destination: {
    id: string;
    warehouse_sub_id: string;
  }) => {
    setDestinationBinId(destination.id); // Menggunakan v.id untuk mengatur destinationBin
    setDestinationZoneId(destination.warehouse_sub_id); // Simpan warehouse_sub_id jika diperlukan
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <Button
          onClick={onBack}
          variant="danger"
          size="sm"
          startIcon={<FaArrowLeft />}
        >
          Back
        </Button>
      </div>

      <SuggestionCardHeader
        memoDetail={memoDetail}
        onChangeMetode={(v) => setMetodeSuggestion(v.value)}
        onChangeDestination={handleChangeDestination}
        onSearch={handleFetchSuggestion}
        metodeSuggestion={metodeSuggestion}
        destinationBinId={destinationBinId}
      />

      <SuggestionItemsTable
        items={dataSuggestion}
        onEdit={handleEdit}
        onAdd={handleAddItem}
        destinationZoneId={destinationZoneId}
        destinationBinId={destinationBinId}
        DOid={DOid}
        metodeSuggestion={metodeSuggestion}
      />
    </div>
  );
};
