import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import MainView from "./Main/MainView";

export default function StockAdjusment() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Stock Adjustment" }]} />
      <MainView />
    </div>
  );
}
