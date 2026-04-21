// import React, { useState, useMemo } from "react";
// import ModalComponent from "../ModalComponent";
// import TabsSection from "../../wms-components/inbound-component/tabs/TabsSection";
// import TableComponent from "../../tables/MasterDataTable/TableComponent";
// import {
//   itemDetailsData,
//   itemDetailsColumns,
//   transportLoadingData,
//   transportLoadingColumns,
//   scanHistoryData,
//   scanHistoryColumns,
// } from "../../../helper/dummyDataInbound";
// import Button from "../../ui/button/Button";
// import { FaEye, FaPlus } from "react-icons/fa";

// interface ReusableFormModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSubmit: (data: any) => void;
//   formFields: Array<any>;
//   title: string;
//   defaultValues?: any;
//   isEditMode?: boolean;
//   setIsEditMode?: (val: boolean) => void;
// }

// const ReusableFormModal: React.FC<ReusableFormModalProps> = ({
//   isOpen,
//   onClose,
//   onSubmit,
//   formFields,
//   title,
//   defaultValues,
//   isEditMode = false,
// }) => {
//   const [activeTab, setActiveTab] = useState(0);

//   return (
//     <>
//       <ModalComponent
//         isOpen={isOpen}
//         onClose={onClose}
//         title={isEditMode ? "Update Detail" : title}
//         size="xl"
//       >
//         <div>
//           <div className="mb-4 flex justify-between items-center">
//             <div />
//             {/* <Button
//               variant="primary"
//               size="xsm"
//               startIcon={<FaPlus className="size-5" />}
//             >
//               Add Checker
//             </Button> */}
//           </div>

//           {/* <TabsSection
//             tabs={[
//               {
//                 label: "Item Details",
//                 content: (
//                   <TableComponent
//                     data={itemDetailsData}
//                     columns={itemDetailsColumns}
//                     pageSize={5}
//                   />
//                 ),
//               },
//               {
//                 label: "Transport & Loading",
//                 content: (
//                   <TableComponent
//                     data={transportLoadingData}
//                     columns={transportLoadingColumns}
//                   />
//                 ),
//               },
//               {
//                 label: "Scan History",
//                 content: (
//                   <TableComponent
//                     data={scanHistoryData}
//                     columns={scanHistoryColumns}
//                   />
//                 ),
//               },
//             ]}
//             activeTab={activeTab}
//             onTabChange={setActiveTab}
//           /> */}
//         </div>
//       </ModalComponent>
//     </>
//   );
// };

// export default ReusableFormModal;
