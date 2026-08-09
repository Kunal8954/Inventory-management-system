import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Users from './pages/Users';

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Alerts from "./pages/Alerts";
import Customers from "./pages/Customers";
import Categories from "./pages/Categories";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import InventoryHistory from "./pages/InventoryHistory";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import ForgotPassword from './pages/ForgotPassword';

import ShopLayout from './components/layout/ShopLayout';
import ShopProtectedRoute from './components/ShopProtectedRoute';
import ShopLogin from './pages/ShopLogin';
import ShopRegister from './pages/ShopRegister';
import ShopBrowse from './pages/ShopBrowse';
import ShopOrders from './pages/ShopOrders';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/shop/login" element={<ShopLogin />} />
          <Route path="/shop/register" element={<ShopRegister />} />

          {/* Shop Routes — Browse is open to guests, Orders requires a customer login */}
          <Route element={<ShopLayout />}>
            <Route path="/shop" element={<ShopBrowse />} />
            <Route
              path="/shop/orders"
              element={
                <ShopProtectedRoute>
                  <ShopOrders />
                </ShopProtectedRoute>
              }
            />
          </Route>

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/products" element={<Products />} />
            <Route path="/users" element={<Users />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/inventory-history" element={<InventoryHistory />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;