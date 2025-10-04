import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Route, Switch } from "wouter";
import RoleSelection from "./pages/RoleSelection";
import VendorPostListing from "./pages/VendorPostListing";
import VendorBrowse from "./pages/VendorBrowse";
import BuyerBrowse from "./pages/BuyerBrowse";
import CropInfo from "./pages/CropInfo";
import ListingDetail from "./pages/ListingDetail";
import QuestionsPage from "./pages/QuestionsPage";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={RoleSelection} />
        <Route path="/vendor/browse" component={VendorBrowse} />
        <Route path="/vendor/post" component={VendorPostListing} />
        <Route path="/buyer/browse" component={BuyerBrowse} />
        <Route path="/crop-info" component={CropInfo} />
        <Route path="/questions" component={QuestionsPage} />
        <Route path="/listing/:id" component={ListingDetail} />
        <Route>404 Page Not Found</Route>
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
