import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./app/layout";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { CalculatorPage } from "./features/calculator/CalculatorPage";
import { InvoicesPage } from "./features/invoices/InvoicesPage";
import { ShipmentsPage } from "./features/shipments/ShipmentsPage";
import { ShipmentDetailPage } from "./features/shipments/ShipmentDetailPage";
import { CompliancePage } from "./features/compliance/CompliancePage";
import { PassportPage } from "./features/passport/PassportPage";
import { CollaborationPage } from "./features/collaboration/CollaborationPage";
import { IntelligencePage } from "./features/intelligence/IntelligencePage";
import { AdminTaricImportPage } from "./features/adminTaric/AdminTaricImportPage";
import { RequireAuth, RequireAdmin } from "./lib/auth/guards";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="calculator" element={<CalculatorPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="shipments" element={<ShipmentsPage />} />
        <Route path="shipments/:id" element={<ShipmentDetailPage />} />
        <Route path="compliance" element={<CompliancePage />} />
        <Route path="passport" element={<PassportPage />} />
        <Route path="collaboration" element={<CollaborationPage />} />
        <Route path="intelligence" element={<IntelligencePage />} />
        <Route
          path="admin/taric-import"
          element={
            <RequireAdmin>
              <AdminTaricImportPage />
            </RequireAdmin>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
