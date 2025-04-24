import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  PeopleAlt as CustomersIcon,
  LocalLaundryService as OrdersIcon,
  Dry as ServicesIcon,
  Person as ProfileIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 260;
const collapsedWidth = 70; // Width when sidebar is collapsed

const Layout: React.FC = () => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State for sidebar visibility
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  
  // Effect to handle responsive behavior
  useEffect(() => {
    // On small screens, hide sidebar by default
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Pelanggan', icon: <CustomersIcon />, path: '/customers' },
    { text: 'Pesanan', icon: <OrdersIcon />, path: '/orders' },
    { text: 'Layanan', icon: <ServicesIcon />, path: '/services' },
    { text: 'Profil', icon: <ProfileIcon />, path: '/profile' },
  ];

  // Calculate current sidebar width based on state
  const currentWidth = isMobile ? 0 : (sidebarCollapsed ? collapsedWidth : drawerWidth);

  const drawerContent = (
    <>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.palette.primary.main,
          px: 1,
          py: 1.5,
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 'bold', 
            color: 'black',
            ml: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: sidebarCollapsed && !isMobile ? 'none' : 'block'
          }}
        >
          Laundries
        </Typography>
        <IconButton onClick={toggleSidebar} sx={{ color: 'black' }}>
          {isMobile || !sidebarCollapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Toolbar>
      <Divider />
      <List sx={{ mt: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton 
                onClick={() => handleNavigation(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'initial',
                  px: 2.5,
                  borderLeft: isActive ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                  backgroundColor: isActive ? `${theme.palette.primary.main}10` : 'transparent',
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    minWidth: 0, 
                    mr: sidebarCollapsed && !isMobile ? 'auto' : 3, 
                    justifyContent: 'center',
                    color: isActive ? theme.palette.primary.main : 'inherit'
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {(!sidebarCollapsed || isMobile) && (
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{ 
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? theme.palette.primary.main : 'inherit'
                    }}
                  />
                )}
                {isActive && !sidebarCollapsed && <ChevronRightIcon color="primary" />}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar - always at top, shifts with sidebar */}
      <AppBar 
        position="fixed"
        sx={{ 
          width: { xs: '100%', md: `calc(100% - ${currentWidth}px)` },
          ml: { xs: 0, md: `${currentWidth}px` },
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: 'white',
          color: 'black',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={toggleSidebar}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Tooltip title="Notifications">
            <IconButton 
              color="inherit" 
              onClick={handleNotificationsOpen}
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={3} color="primary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Account">
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar 
                alt={user?.firstName || 'User'} 
                src="/assets/avatar.png"
                sx={{ width: 32, height: 32 }}
              />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      
      {/* Mobile drawer - completely hidden until toggled */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop drawer - can be collapsed */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: currentWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: currentWidth,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
        open={true}
      >
        {drawerContent}
      </Drawer>
      
      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { xs: '100%', md: `calc(100% - ${currentWidth}px)` },
          ml: { xs: 0, md: 0 },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar /> {/* This creates space below the AppBar */}
        <Outlet />
      </Box>
      
      {/* Profile menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            '& .MuiMenuItem-root': {
              py: 1,
              px: 2,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <ListItemIcon>
            <ProfileIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profil</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Keluar</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Notifications menu */}
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationsClose}
        onClick={handleNotificationsClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 320,
            maxHeight: 400,
            overflow: 'auto',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Typography variant="subtitle1" sx={{ p: 2, pb: 0 }}>Notifikasi</Typography>
        <MenuItem sx={{ bgcolor: 'rgba(255, 213, 79, 0.1)' }}>
          <Box>
            <Typography variant="body2">Pesanan baru #ORD-2023-0123 dibuat</Typography>
            <Typography variant="caption" color="text.secondary">10 menit yang lalu</Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box>
            <Typography variant="body2">Pesanan #ORD-2023-0120 selesai</Typography>
            <Typography variant="caption" color="text.secondary">1 jam yang lalu</Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box>
            <Typography variant="body2">Registrasi pelanggan baru: Sarah Johnson</Typography>
            <Typography variant="caption" color="text.secondary">3 jam yang lalu</Typography>
          </Box>
        </MenuItem>
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
          <Typography 
            variant="body2" 
            color="primary" 
            sx={{ cursor: 'pointer', fontWeight: 500 }}
          >
            Lihat Semua Notifikasi
          </Typography>
        </Box>
      </Menu>
    </Box>
  );
};

export default Layout;