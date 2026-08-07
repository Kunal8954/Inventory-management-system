import {
  FaThLarge,
  FaBox,
  FaTags,
  FaTruck,
  FaUsers,
  FaShoppingCart,
  FaChartLine,
  FaFileAlt,
  FaHistory,
  FaBell,
  FaCog,
  FaChevronDown,
} from "react-icons/fa";
import { FiPackage, FiAlertTriangle, FiTrendingDown } from "react-icons/fi";

export const navGroups = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: FaThLarge,
    items: [
      {
        label: "Dashboard",
        path: "/",
        icon: FaThLarge,
      },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: FiPackage,
    items: [
      {
        label: "Inventory Management",
        path: "/inventory",
        icon: FiPackage,
      },
      {
        label: "Low Stock Alerts",
        path: "/alerts",
        icon: FiAlertTriangle,
      },
      {
        label: "Transactions",
        path: "/inventory-history",
        icon: FiTrendingDown,
      },
    ],
  },
  {
    id: "products",
    label: "Products",
    icon: FaBox,
    items: [
      {
        label: "Products",
        path: "/products",
        icon: FaBox,
      },
      {
        label: "Categories",
        path: "/categories",
        icon: FaTags,
      },
    ],
  },
  {
    id: "supply",
    label: "Supply Chain",
    icon: FaTruck,
    items: [
      {
        label: "Suppliers",
        path: "/suppliers",
        icon: FaTruck,
      },
      {
        label: "Purchases",
        path: "/purchases",
        icon: FaShoppingCart,
      },
    ],
  },
  
    {
    id: "sales",
    label: "Sales",
    icon: FaChartLine,
    items: [
      {
        label: "Sales",
        path: "/sales",
        icon: FaChartLine,
      },
      {
        label: "Customers",
        path: "/customers",
        icon: FaUsers,
      },
    ],
  },
  
  {
    id: "reports",
    label: "Reports",
    icon: FaFileAlt,
    items: [
      {
        label: "Reports",
        path: "/reports",
        icon: FaFileAlt,
      },
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: FaBell,
    items: [
      {
        label: "Notifications",
        path: "/notifications",
        icon: FaBell,
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: FaCog,
    items: [
      {
        label: "Settings",
        path: "/settings",
        icon: FaCog,
      },
    ],
  },
];

// Keep old flat version for backward compatibility
export const navItems = navGroups.flatMap((group) => group.items);