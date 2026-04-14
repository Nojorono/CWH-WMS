import axiosInstance from "../../AxiosInstance";

export const UserVerifyService = {
  verifyEmployee: async (employeeNumber: string) => {
    try {
      const response = await axiosInstance.get(`user/employee`, {
        params: { employeeNumber },
      });

      // Berdasarkan gambar console log: response.data.data adalah objek utama
      const result = response.data.data; 

      // Ganti 'success' menjadi 'status' sesuai hasil console log Anda
      if (result.status === true && result.data && result.data.length > 0) {
        return {
          valid: true,
          data: result.data[0], // Ambil objek employee pertama
        };
      }

      return { valid: false, data: null };
    } catch (error: any) {
      console.error("Error verifying employee:", error);
      return { valid: false, data: null };
    }
  },
};