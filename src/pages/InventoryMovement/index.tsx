import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import MainView from "./Main/MainView";

export default function InventoryMovement() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Inventory Movement" }]} />
      <MainView open={false} onClose={function (): void {
        throw new Error("Function not implemented.");
      } } onConfirm={function (): void {
        throw new Error("Function not implemented.");
      } } payload={undefined} />
    </div>
  );
}
