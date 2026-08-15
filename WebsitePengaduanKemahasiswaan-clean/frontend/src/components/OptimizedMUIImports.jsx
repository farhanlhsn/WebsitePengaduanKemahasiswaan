/* eslint-disable react-refresh/only-export-components */
/**
 * Optimized Material-UI Imports
 * Reduces bundle size through efficient tree shaking and selective imports
 */

// Core components - import only what's needed
export { default as Box } from '@mui/material/Box';
export { default as Typography } from '@mui/material/Typography';
export { default as Button } from '@mui/material/Button';
export { default as IconButton } from '@mui/material/IconButton';
export { default as Container } from '@mui/material/Container';
export { default as Paper } from '@mui/material/Paper';
export { default as Stack } from '@mui/material/Stack';

// Layout components (lazy loaded when needed)
export const Grid = () => import('@mui/material/Grid').then(module => ({ default: module.default }));
export const Grid2 = () => import('@mui/material/Grid2').then(module => ({ default: module.default }));

// Form components (lazy loaded)
export const TextField = () => import('@mui/material/TextField').then(module => ({ default: module.default }));
export const FormControl = () => import('@mui/material/FormControl').then(module => ({ default: module.default }));
export const InputLabel = () => import('@mui/material/InputLabel').then(module => ({ default: module.default }));
export const Select = () => import('@mui/material/Select').then(module => ({ default: module.default }));
export const MenuItem = () => import('@mui/material/MenuItem').then(module => ({ default: module.default }));
export const Checkbox = () => import('@mui/material/Checkbox').then(module => ({ default: module.default }));
export const FormControlLabel = () => import('@mui/material/FormControlLabel').then(module => ({ default: module.default }));
export const Switch = () => import('@mui/material/Switch').then(module => ({ default: module.default }));
export const Slider = () => import('@mui/material/Slider').then(module => ({ default: module.default }));

// Data display components (lazy loaded)
export const Table = () => import('@mui/material/Table').then(module => ({ default: module.default }));
export const TableBody = () => import('@mui/material/TableBody').then(module => ({ default: module.default }));
export const TableCell = () => import('@mui/material/TableCell').then(module => ({ default: module.default }));
export const TableHead = () => import('@mui/material/TableHead').then(module => ({ default: module.default }));
export const TableRow = () => import('@mui/material/TableRow').then(module => ({ default: module.default }));
export const TablePagination = () => import('@mui/material/TablePagination').then(module => ({ default: module.default }));
export const TableSortLabel = () => import('@mui/material/TableSortLabel').then(module => ({ default: module.default }));
export const TableContainer = () => import('@mui/material/TableContainer').then(module => ({ default: module.default }));

export const Chip = () => import('@mui/material/Chip').then(module => ({ default: module.default }));
export const Avatar = () => import('@mui/material/Avatar').then(module => ({ default: module.default }));
export const Badge = () => import('@mui/material/Badge').then(module => ({ default: module.default }));
export const Tooltip = () => import('@mui/material/Tooltip').then(module => ({ default: module.default }));

// Feedback components (lazy loaded)
export const Alert = () => import('@mui/material/Alert').then(module => ({ default: module.default }));
export const Snackbar = () => import('@mui/material/Snackbar').then(module => ({ default: module.default }));
export const Dialog = () => import('@mui/material/Dialog').then(module => ({ default: module.default }));
export const DialogTitle = () => import('@mui/material/DialogTitle').then(module => ({ default: module.default }));
export const DialogContent = () => import('@mui/material/DialogContent').then(module => ({ default: module.default }));
export const DialogActions = () => import('@mui/material/DialogActions').then(module => ({ default: module.default }));
export const CircularProgress = () => import('@mui/material/CircularProgress').then(module => ({ default: module.default }));
export const LinearProgress = () => import('@mui/material/LinearProgress').then(module => ({ default: module.default }));
export const Skeleton = () => import('@mui/material/Skeleton').then(module => ({ default: module.default }));

// Navigation components (lazy loaded)
export const Drawer = () => import('@mui/material/Drawer').then(module => ({ default: module.default }));
export const AppBar = () => import('@mui/material/AppBar').then(module => ({ default: module.default }));
export const Toolbar = () => import('@mui/material/Toolbar').then(module => ({ default: module.default }));
export const Menu = () => import('@mui/material/Menu').then(module => ({ default: module.default }));
export const Tabs = () => import('@mui/material/Tabs').then(module => ({ default: module.default }));
export const Tab = () => import('@mui/material/Tab').then(module => ({ default: module.default }));
export const Breadcrumbs = () => import('@mui/material/Breadcrumbs').then(module => ({ default: module.default }));

// List components (lazy loaded)
export const List = () => import('@mui/material/List').then(module => ({ default: module.default }));
export const ListItem = () => import('@mui/material/ListItem').then(module => ({ default: module.default }));
export const ListItemIcon = () => import('@mui/material/ListItemIcon').then(module => ({ default: module.default }));
export const ListItemText = () => import('@mui/material/ListItemText').then(module => ({ default: module.default }));
export const ListItemButton = () => import('@mui/material/ListItemButton').then(module => ({ default: module.default }));
export const ListItemAvatar = () => import('@mui/material/ListItemAvatar').then(module => ({ default: module.default }));
export const ListItemSecondaryAction = () => import('@mui/material/ListItemSecondaryAction').then(module => ({ default: module.default }));

// Card components (lazy loaded)
export const Card = () => import('@mui/material/Card').then(module => ({ default: module.default }));
export const CardContent = () => import('@mui/material/CardContent').then(module => ({ default: module.default }));
export const CardActions = () => import('@mui/material/CardActions').then(module => ({ default: module.default }));
export const CardHeader = () => import('@mui/material/CardHeader').then(module => ({ default: module.default }));
export const CardMedia = () => import('@mui/material/CardMedia').then(module => ({ default: module.default }));

// Expansion components (lazy loaded)
export const Accordion = () => import('@mui/material/Accordion').then(module => ({ default: module.default }));
export const AccordionSummary = () => import('@mui/material/AccordionSummary').then(module => ({ default: module.default }));
export const AccordionDetails = () => import('@mui/material/AccordionDetails').then(module => ({ default: module.default }));
export const Collapse = () => import('@mui/material/Collapse').then(module => ({ default: module.default }));

// Transition components (lazy loaded)
export const Fade = () => import('@mui/material/Fade').then(module => ({ default: module.default }));
export const Slide = () => import('@mui/material/Slide').then(module => ({ default: module.default }));
export const Zoom = () => import('@mui/material/Zoom').then(module => ({ default: module.default }));
export const Grow = () => import('@mui/material/Grow').then(module => ({ default: module.default }));

// Utilities and other components
export const Divider = () => import('@mui/material/Divider').then(module => ({ default: module.default }));
export const Stepper = () => import('@mui/material/Stepper').then(module => ({ default: module.default }));
export const Step = () => import('@mui/material/Step').then(module => ({ default: module.default }));
export const StepLabel = () => import('@mui/material/StepLabel').then(module => ({ default: module.default }));
export const StepContent = () => import('@mui/material/StepContent').then(module => ({ default: module.default }));

// Material-UI hooks and utilities (immediately available)
export { useTheme } from '@mui/material/styles';
export { useMediaQuery } from '@mui/material';
export { alpha, styled, createTheme } from '@mui/material/styles';

// Icon imports optimization
const createIconLoader = (iconName) => () => 
  import(`@mui/icons-material/${iconName}`).then(module => ({ default: module.default }));

// Common icons (immediately available)
export { 
  Add, 
  Edit, 
  Delete, 
  Search, 
  Close, 
  Check, 
  ArrowBack, 
  ArrowForward,
  ExpandMore,
  ExpandLess,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

// Lazy loaded icons
export const Dashboard = createIconLoader('Dashboard');
export const Assignment = createIconLoader('Assignment');
export const People = createIconLoader('People');
export const Settings = createIconLoader('Settings');
export const Notifications = createIconLoader('Notifications');
export const AccountCircle = createIconLoader('AccountCircle');
export const Person = createIconLoader('Person');
export const Email = createIconLoader('Email');
export const Phone = createIconLoader('Phone');
export const LocationOn = createIconLoader('LocationOn');
export const Schedule = createIconLoader('Schedule');
export const Security = createIconLoader('Security');
export const HelpOutline = createIconLoader('HelpOutline');
export const Logout = createIconLoader('Logout');
export const FilterList = createIconLoader('FilterList');
export const GetApp = createIconLoader('GetApp');
export const Refresh = createIconLoader('Refresh');
export const MoreVert = createIconLoader('MoreVert');
export const Star = createIconLoader('Star');
export const Favorite = createIconLoader('Favorite');
export const Share = createIconLoader('Share');
export const Download = createIconLoader('Download');
export const Upload = createIconLoader('Upload');
export const CloudUpload = createIconLoader('CloudUpload');
export const AttachFile = createIconLoader('AttachFile');
export const Send = createIconLoader('Send');
export const Reply = createIconLoader('Reply');
export const Forward = createIconLoader('Forward');
export const Lock = createIconLoader('Lock');
export const Key = createIconLoader('Key');
export const Warning = createIconLoader('Warning');
export const Error = createIconLoader('Error');
export const Info = createIconLoader('Info');
export const CheckCircle = createIconLoader('CheckCircle');
export const Cancel = createIconLoader('Cancel');
export const HourglassEmpty = createIconLoader('HourglassEmpty');
export const Pending = createIconLoader('Pending');
export const AccessTime = createIconLoader('AccessTime');
export const Today = createIconLoader('Today');
export const DateRange = createIconLoader('DateRange');
export const EventNote = createIconLoader('EventNote');
export const Category = createIconLoader('Category');
export const Label = createIconLoader('Label');
export const Tag = createIconLoader('Tag');
export const Bookmark = createIconLoader('Bookmark');
export const Flag = createIconLoader('Flag');
export const Grade = createIconLoader('Grade');
export const TrendingUp = createIconLoader('TrendingUp');
export const TrendingDown = createIconLoader('TrendingDown');
export const Analytics = createIconLoader('Analytics');
export const BarChart = createIconLoader('BarChart');
export const PieChart = createIconLoader('PieChart');
export const Timeline = createIconLoader('Timeline');
export const Insights = createIconLoader('Insights');

// Helper function to load components dynamically
export const loadComponent = async (componentLoader) => {
  const module = await componentLoader();
  return module.default;
};

// Batch loader for multiple components
export const loadComponents = async (componentLoaders) => {
  const modules = await Promise.all(
    Object.entries(componentLoaders).map(async ([key, loader]) => {
      const module = await loader();
      return [key, module.default];
    })
  );
  return Object.fromEntries(modules);
};

// Pre-configured component sets for common use cases
export const getFormComponents = () => loadComponents({
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Switch
});

export const getTableComponents = () => loadComponents({
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  TableContainer
});

export const getDialogComponents = () => loadComponents({
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
});

export const getLayoutComponents = () => loadComponents({
  Grid,
  Card,
  CardContent,
  CardActions,
  CardHeader
});

export const getNavigationComponents = () => loadComponents({
  Drawer,
  AppBar,
  Toolbar,
  Menu,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
});

// Performance monitoring for component loading
export const measureComponentLoad = (componentName, loader) => {
  return async () => {
    const start = performance.now();
    const component = await loader();
    const end = performance.now();
    
    if (import.meta.env.DEV) {
      console.log(`${componentName} loaded in ${end - start}ms`);
    }
    
    return component;
  };
};

// Cache for loaded components
const componentCache = new Map();

export const getCachedComponent = async (componentName, loader) => {
  if (componentCache.has(componentName)) {
    return componentCache.get(componentName);
  }
  
  const component = await loader();
  componentCache.set(componentName, component);
  return component;
};
