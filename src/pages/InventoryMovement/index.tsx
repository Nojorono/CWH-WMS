import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import MainView from "./Main/MainView";

export default function InventoryMovement() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Inventory Movement" }]} />
      <MainView />
    </div>
  );
}
