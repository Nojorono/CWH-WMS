// import { useState, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { useNavigate } from "react-router-dom";
// import { EyeCloseIcon, EyeIcon } from "../../icons";
// import Label from "../form/Label";
// import SignInInput from "../form/input/SignInInput";
// import Button from "../ui/button/Button";
// import CustomToast from "../../components/toast";
// import { usePersistAuthStore } from "../../API/store/AuthStore/PersistAuthStore";
// import { useStoreIo } from "../../DynamicAPI/stores/Store/MasterStore";
// import { LoginPayload } from "../../API/types/persistAuth.types";

// export default function SignInForm() {
//   const navigate = useNavigate();

//   // Mengambil state dari store baru
//   const {
//     authLogin,
//     isLoading: storeLoading,
//     error: storeError,
//   } = usePersistAuthStore();
//   const { fetchAll: fetchIO } = useStoreIo();

//   const [showPassword, setShowPassword] = useState(false);
//   const toggleShowPassword = () => setShowPassword((prev) => !prev);

//   // Local state untuk IP Address tetap dipertahankan
//   const [ipAddress, setIpAddress] = useState<string>("");

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<LoginPayload>(); // Gunakan interface payload dari types

//   useEffect(() => {
//     const fetchIP = async () => {
//       try {
//         const res = await fetch("https://api.ipify.org?format=json");
//         const data = await res.json();
//         setIpAddress(data.ip);
//       } catch (err) {
//         console.error("Failed to fetch IP address:", err);
//       }
//     };
//     fetchIP();
//   }, []);

//   const handleLogin = async (data: LoginPayload) => {
//     try {
//       const payload = {
//         ...data,
//       };

//       const resData = await authLogin(payload);

//       if (resData && resData.menus) {
//         await fetchIO();

//         const { menus } = resData;

//         // Algoritma pencarian path pertama yang valid untuk menghindari blank page / dashboard palsu
//         const findFirstPath = (menuList: any[]): string => {
//           for (const item of menuList) {
//             if (item.path && item.path !== "") return item.path;
//             if (item.children?.length) {
//               const childPath = findFirstPath(item.children);
//               if (childPath) return childPath;
//             }
//           }
//           return "/";
//         };

//         const navigatePath = findFirstPath(menus);

//         // Langsung pindah halaman
//         navigate(navigatePath, { replace: true });
//       }
//     } catch (err: any) {
//       console.error("Login component error:", err);
//     }
//   };

//   return (
//     <div className="flex flex-col flex-1">
//       <CustomToast />
//       <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
//         <div>
//           <header className="mb-5 sm:mb-8">
//             <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
//               Sign In
//             </h1>
//             <p className="text-sm text-gray-500 dark:text-gray-400">
//               Enter your username and password to sign in!
//             </p>
//           </header>

//           <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
//             <div>
//               <Label>
//                 Username <span className="text-error-500">*</span>
//               </Label>
//               <SignInInput
//                 placeholder="Username"
//                 register={register("username", {
//                   required: "Username is required",
//                 })}
//                 error={!!errors.username}
//                 hint={errors.username?.message}
//               />
//             </div>

//             <div>
//               <Label>
//                 Password <span className="text-error-500">*</span>
//               </Label>

//               <SignInInput
//                 type={showPassword ? "text" : "password"}
//                 placeholder="Password"
//                 register={register("password", {
//                   required: "Password is required",
//                   minLength: {
//                     value: 6,
//                     message: "Password must be at least 6 characters",
//                   },
//                 })}
//                 error={!!errors.password}
//                 hint={errors.password?.message}
//                 className="h-12"
//                 rightIcon={
//                   <button type="button" onClick={toggleShowPassword}>
//                     {showPassword ? (
//                       <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
//                     ) : (
//                       <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
//                     )}
//                   </button>
//                 }
//               />
//             </div>

//             {/* Error Message dari Store */}
//             {storeError && (
//               <p className="text-sm font-medium text-red-500">
//                 Gagal Login: {storeError}
//               </p>
//             )}

//             <Button
//               className="w-full"
//               size="sm"
//               disabled={storeLoading}
//               type="submit"
//             >
//               {storeLoading ? (
//                 <div className="flex items-center justify-center">
//                   <svg
//                     className="w-4 h-4 mr-2 text-white animate-spin"
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                     ></circle>
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//                     ></path>
//                   </svg>
//                   Processing...
//                 </div>
//               ) : (
//                 "Sign in"
//               )}
//             </Button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import SignInInput from "../form/input/SignInInput";
import Button from "../ui/button/Button";
import CustomToast from "../../components/toast";

// KUNCI UTAMA: Ambil store baru dan sertakan setIOList
import { usePersistAuthStore } from "../../API/store/AuthStore/PersistAuthStore";
import { useStoreIo } from "../../DynamicAPI/stores/Store/MasterStore";
import { LoginPayload } from "../../API/types/persistAuth.types";

export default function SignInForm() {
  const navigate = useNavigate();

  // Mengambil state dari store baru termasuk fungsi setIOList
  const {
    authLogin,
    setIOList, // <-- Panggil fungsi setter ioList terenkripsi
    isLoading: storeLoading,
    error: storeError,
  } = usePersistAuthStore();
  const { fetchAll: fetchIO } = useStoreIo();

  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  const [ipAddress, setIpAddress] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginPayload>();

  useEffect(() => {
    const fetchIP = async () => {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        setIpAddress(data.ip);
      } catch (err) {
        console.error("Failed to fetch IP address:", err);
      }
    };
    fetchIP();
  }, []);

  const handleLogin = async (data: LoginPayload) => {
    try {
      // Masukkan metadata perangkat dan IP audit ke payload
      const payload = {
        ...data,
        // ip_address: ipAddress,
        // platform: "Web",
        // device_info: navigator.userAgent,
      };

      const resData = await authLogin(payload);

      if (resData && resData.menus) {
        // 1. Ambil data IO list dari Master Store API
        await fetchIO();
        const currentIoList = useStoreIo.getState().list;

        // 2. DISINI TEMPATNYA: Amankan io_list langsung ke store terenkripsi Zustand
        if (currentIoList && currentIoList.length > 0) {
          setIOList(currentIoList);
        }

        const { menus } = resData;

        // 3. Algoritma pencarian path pertama untuk flat array API (Kebal folder induk kosong)
        const findFirstPath = (menuList: any[]): string => {
          // Kategori path grouping menu utama yang tidak memiliki halaman rill
          const forbiddenPaths = [
            "/master",
            "/inbound",
            "/outbound",
            "/inventory",
            "/reporting",
          ];

          for (const item of menuList) {
            if (
              item.path &&
              item.path !== "" &&
              !forbiddenPaths.includes(item.path)
            ) {
              return item.path;
            }
            if (item.children?.length) {
              const childPath = findFirstPath(item.children);
              if (childPath) return childPath;
            }
          }
          return "/dashboard"; // Fallback aman
        };

        const navigatePath = findFirstPath(menus);
        console.log("Navigating to secure landing path:", navigatePath);

        // Berikan delay micro-seconds agar sistem enkripsi storage selesai menulis state
        setTimeout(() => {
          navigate(navigatePath, { replace: true });
        }, 100);
      }
    } catch (err: any) {
      console.error("Login component error:", err);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <CustomToast />
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <header className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your username and password to sign in!
            </p>
          </header>

          <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
            <div>
              <Label>
                Username <span className="text-error-500">*</span>
              </Label>
              <SignInInput
                placeholder="Username"
                register={register("username", {
                  required: "Username is required",
                })}
                error={!!errors.username}
                hint={errors.username?.message}
              />
            </div>

            <div>
              <Label>
                Password <span className="text-error-500">*</span>
              </Label>

              <SignInInput
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                register={register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                error={!!errors.password}
                hint={errors.password?.message}
                className="h-12"
                rightIcon={
                  <button type="button" onClick={toggleShowPassword}>
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </button>
                }
              />
            </div>

            {/* Error Message dari Store */}
            {storeError && (
              <p className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">
                Gagal Login: {storeError}
              </p>
            )}

            <Button
              className="w-full"
              size="sm"
              disabled={storeLoading}
              type="submit"
            >
              {storeLoading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-2 text-white animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
