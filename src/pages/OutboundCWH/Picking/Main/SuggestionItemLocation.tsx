import React, { useState } from "react";
import { SuggestionCardHeader } from "../SuggestionItems/SuggestionCardHeader";
import { SuggestionItemsTable } from "../SuggestionItems/SuggestionItemsTable";
import { EndPoint } from "../../../../utils/EndPoint";
import Button from "../../../../components/ui/button/Button";
import { FaArrowLeft } from "react-icons/fa";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";

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

  const handleEdit = (item: any) => {};

  const handleAddItem = (item: any) => {};

  const fetchPickingSuggestionById = async () => {
    const memoId = memoDetail.id;
    if (!memoId) return;

    setLoadingFetch(true);

    try {
      const res = await axiosInstance.get(`picking-suggestion/memo/${memoId}`, {
        params: {
          sortMethod: metodeSuggestion,
        },
      });

      setDataSuggestion(res.data.data);
    } catch (error) {
      console.error(
        "Error fetching picking suggestion via axiosInstance:",
        error,
      );
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
        onBack={onBack}
      />
    </div>
  );
};
