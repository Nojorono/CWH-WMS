import { useState, useCallback } from 'react';
import {
    getDOSuggestionByCallplan,
    getSubmittedSuggestions
} from '../../../../API/store/DOsuggestionServices/draftDOsuggestionService';
import { showErrorToast } from '../../../../components/toast';
import { DOSuggestionData } from '../../../../API/types/draftDOsuggestion';

export const useGetLocalDoSuggestion = () => {
    // State untuk 1 Callplan (Mode Detail)
    const [data, setData] = useState<DOSuggestionData | null>(null);

    // State untuk banyak Callplan (Mode List / History)
    const [submittedList, setSubmittedList] = useState<DOSuggestionData[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch Detail 1 Callplan
    const fetchDOData = useCallback(async (cpNumber: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getDOSuggestionByCallplan(cpNumber);

            if (result.success && result.data.length > 0) {
                setData(result.data[0]);
            } else {
                setData(null);
                showErrorToast("Data tidak ditemukan");
            }
        } catch (err: any) {
            const errorMessage = err.message || "Gagal mengambil data DO Suggestion";
            setError(errorMessage);
            showErrorToast(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch Semua List (Bisa untuk Submitted / History)
    const fetchSubmittedList = useCallback(async (param: any) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getSubmittedSuggestions();

            if (result.success && result.data) {
                const filteredData = result.data.filter(
                    (item) =>
                        item.status === "SUBMITTED" &&
                        item.organization?.organization_name === param
                );
                setSubmittedList(filteredData);
            } else {
                setSubmittedList([]);
            }
        } catch (err: any) {
            const errorMessage = err.message || "Gagal mengambil daftar DO yang disubmit";
            setError(errorMessage);
            showErrorToast(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        data,
        submittedList,
        isLoading,
        error,
        fetchDOData,
        fetchSubmittedList
    };
};