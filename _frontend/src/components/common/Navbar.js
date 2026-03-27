import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  DirectionsCar,
  Dashboard,
  BookOnline,
  History,
  Person,
  Logout,
  AddCircle,
  Receipt,
  MonetizationOn,
  Star,
  NotificationsNone,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { notificationAPI } from '../../services/api';
import { getImageUrl } from '../../utils/constants';

const Navbar = () => {
  const { user, logout, isCustomer, isOwner } = useAuth();
  const navigate = useNavigate();
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const logoSrc = `${process.env.PUBLIC_URL}/brand-logo.png`;

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenNotificationsMenu = (event) => {
    setAnchorElNotifications(event.currentTarget);
  };

  const handleCloseNotificationsMenu = () => {
    setAnchorElNotifications(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    handleCloseUserMenu();
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    let isMounted = true;
    let intervalId;

    const fetchNotifications = async () => {
      if (!isOwner && !isCustomer) {
        if (isMounted) setUnreadNotifications(0);
        return;
      }

      try {
        const response = await notificationAPI.listNotifications();
        if (isMounted) {
          setUnreadNotifications(response.data?.unread_count || 0);
          setNotifications(response.data?.results || []);
        }
      } catch (error) {
        // Keep navbar stable even if notifications endpoint fails.
      }
    };

    fetchNotifications();
    if (isOwner || isCustomer) {
      intervalId = setInterval(fetchNotifications, 30000);
    }

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOwner, isCustomer]);

  const getDefaultNotificationPath = () => (isCustomer ? '/customer/my-bookings' : '/owner/bookings');

  const handleNotificationItemClick = (notification) => {
    const targetPath = notification?.action_url || getDefaultNotificationPath();

    notificationAPI
      .markNotificationRead(notification.id)
      .then(() => {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item
          )
        );
        setUnreadNotifications((prev) => Math.max(0, prev - (notification.is_read ? 0 : 1)));
      })
      .catch(() => {});

    handleCloseNotificationsMenu();
    navigate(targetPath);
  };

  const handleNotificationsClick = (event) => {
    handleOpenNotificationsMenu(event);
  };

  const handleMarkAllNotificationsRead = () => {
    notificationAPI
      .markAllNotificationsRead()
      .then(() => {
        setUnreadNotifications(0);
        setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      })
      .catch(() => {});
  };

  const customerMenu = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/customer/dashboard' },
    { text: 'Browse Vehicles', icon: <DirectionsCar />, path: '/customer/vehicles' },
    { text: 'My Bookings', icon: <BookOnline />, path: '/customer/my-bookings' },
    { text: 'Booking History', icon: <History />, path: '/customer/booking-history' },
    { text: 'Profile', icon: <Person />, path: '/customer/profile' },
  ];

  const ownerMenu = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/owner/dashboard' },
    { text: 'My Vehicles', icon: <DirectionsCar />, path: '/owner/vehicles' },
    { text: 'Add Vehicle', icon: <AddCircle />, path: '/owner/vehicles/add' },
    { text: 'Booking Requests', icon: <Receipt />, path: '/owner/bookings' },
    { text: 'Earnings', icon: <MonetizationOn />, path: '/owner/earnings' },
    { text: 'Reviews', icon: <Star />, path: '/owner/reviews' },
    { text: 'Profile', icon: <Person />, path: '/owner/profile' },
  ];

  const menuItems = isCustomer ? customerMenu : isOwner ? ownerMenu : [];
  const BrandLogo = ({ mobile = false }) => (
    <>
      {!logoLoadError ? (
        <Box
          component="img"
          src={logoSrc}
          alt="SawariSewa"
          onError={() => setLogoLoadError(true)}
          sx={{
            width: mobile ? 28 : 30,
            height: mobile ? 28 : 30,
            mr: 1,
            borderRadius: 1,
            objectFit: 'cover',
          }}
        />
      ) : (
        <DirectionsCar sx={{ display: 'flex', mr: 1 }} />
      )}
    </>
  );

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2, color: '#1976d2', fontWeight: 'bold' }}>
        SawariSewa
      </Typography>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem button key={item.text} component={Link} to={item.path}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  if (!user) {
    return (
      <AppBar position="static">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
              <BrandLogo />
            </Box>
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              SAWARISEWA
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleDrawerToggle}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <BrandLogo mobile />
            </Box>
            <Typography
              variant="h5"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                flexGrow: 1,
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              SAWARISEWA
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }} />
            <Box sx={{ flexGrow: 0 }}>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              <Button color="inherit" component={Link} to="/register">
                Register
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    );
  }

  return (
    <>
      <AppBar position="static">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
              <BrandLogo />
            </Box>
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              SAWARISEWA
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleDrawerToggle}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <BrandLogo mobile />
            </Box>
            <Typography
              variant="h5"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                flexGrow: 1,
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              SAWARISEWA
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  component={Link}
                  to={item.path}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                  startIcon={item.icon}
                >
                  {item.text}
                </Button>
              ))}
            </Box>

            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Notifications">
                <IconButton color="inherit" onClick={handleNotificationsClick} sx={{ mr: 1 }}>
                  <Badge
                    color="error"
                    variant="dot"
                    invisible={unreadNotifications === 0}
                  >
                    <NotificationsNone />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="notifications-menu"
                anchorEl={anchorElNotifications}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElNotifications)}
                onClose={handleCloseNotificationsMenu}
              >
                <MenuItem disabled>
                  <Typography variant="subtitle2">Notifications</Typography>
                </MenuItem>
                <Divider />
                {notifications.length === 0 ? (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      No notifications yet
                    </Typography>
                  </MenuItem>
                ) : (
                  notifications.slice(0, 8).map((notification) => (
                    <MenuItem
                      key={notification.id}
                      onClick={() => handleNotificationItemClick(notification)}
                      sx={{ maxWidth: 360, alignItems: 'flex-start' }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: notification.is_read ? 400 : 700 }}
                        >
                          {notification.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {notification.message}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))
                )}
                <Divider />
                <MenuItem onClick={handleMarkAllNotificationsRead} disabled={unreadNotifications === 0}>
                  <Typography variant="body2">Mark all as read</Typography>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleCloseNotificationsMenu();
                    navigate(getDefaultNotificationPath());
                  }}
                >
                  <Typography variant="body2">View all</Typography>
                </MenuItem>
              </Menu>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt={user.username} src={getImageUrl(user.profile?.profile_picture)} />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem disabled>
                  <Typography textAlign="center">{user.username}</Typography>
                </MenuItem>
                <MenuItem disabled>
                  <Typography textAlign="center" variant="caption" color="text.secondary">
                    {isCustomer ? 'Customer' : 'Vehicle Owner'}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => {
                  handleCloseUserMenu();
                  navigate(isCustomer ? '/customer/profile' : '/owner/profile');
                }}>
                  <ListItemIcon>
                    <Person fontSize="small" />
                  </ListItemIcon>
                  <Typography textAlign="center">Profile</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  <Typography textAlign="center">Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;