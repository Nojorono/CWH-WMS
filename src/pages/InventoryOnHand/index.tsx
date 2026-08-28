import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import MainView from "./Main/MainView";

export default function InventoryOnHand() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Inventory On Hand" }]} />
      {/* <MainView /> */}
    </div>
  );
}
