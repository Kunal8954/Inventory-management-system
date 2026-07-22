import {
  FaThLarge,
  FaBox,
  FaTags,
  FaTruck,
  FaShoppingCart,
  FaChartLine,
  FaFileAlt,
  FaHistory,
  FaBell,
  FaCog,
} from 'react-icons/fa'

export const navItems = [
  { label: 'Dashboard', path: '/', icon: FaThLarge },
  { label: 'Products', path: '/products', icon: FaBox },
  { label: 'Categories', path: '/categories', icon: FaTags },
  { label: 'Suppliers', path: '/suppliers', icon: FaTruck },
  { label: 'Purchases', path: '/purchases', icon: FaShoppingCart },
  { label: 'Sales', path: '/sales', icon: FaChartLine },
  { label: 'Reports', path: '/reports', icon: FaFileAlt },
  { label: 'Inventory History', path: '/inventory-history', icon: FaHistory },
  { label: 'Notifications', path: '/notifications', icon: FaBell },
  { label: 'Settings', path: '/settings', icon: FaCog },
]
