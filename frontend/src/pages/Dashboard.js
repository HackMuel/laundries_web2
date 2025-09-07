import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader, 
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  PeopleAlt as CustomersIcon, 
  LocalLaundryService as OrdersIcon,
  AttachMoney as RevenueIcon, 
  Pending as PendingIcon 
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../api';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const DashboardCard = ({ title, value, icon, color }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" color="textSecondary">{title}</Typography>
          <Box sx={{ 
            backgroundColor: `${color}20`, // 20% opacity
            borderRadius: '50%',
            width: 48,
            height: 48,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {React.cloneElement(icon, { style: { color: color, fontSize: 28 } })}
          </Box>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 'auto' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    chartData: {
      labels: [],
      datasets: []
    }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/dashboard');
        
        setStats({
          totalCustomers: response.data.totalCustomers,
          totalOrders: response.data.totalOrders,
          totalRevenue: response.data.totalRevenue,
          pendingOrders: response.data.pendingOrders,
          chartData: {
            labels: response.data.revenueData.labels,
            datasets: [
              {
                label: 'Revenue',
                data: response.data.revenueData.revenue,
                borderColor: theme.palette.primary.main,
                backgroundColor: `${theme.palette.primary.main}20`,
                fill: true,
                tension: 0.4,
              },
              {
                label: 'Orders',
                data: response.data.revenueData.orders,
                borderColor: theme.palette.secondary.main,
                backgroundColor: 'transparent',
                borderWidth: 2,
                tension: 0.4,
              }
            ]
          }
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Use dummy data for demo
        setStats({
          totalCustomers: 342,
          totalOrders: 1248,
          totalRevenue: 48695,
          pendingOrders: 27,
          chartData: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
              {
                label: 'Revenue',
                data: [12000, 19000, 15000, 22000, 18000, 24000],
                borderColor: theme.palette.primary.main,
                backgroundColor: `${theme.palette.primary.main}20`,
                fill: true,
                tension: 0.4,
              },
              {
                label: 'Orders',
                data: [180, 220, 200, 260, 240, 280],
                borderColor: theme.palette.secondary.main,
                backgroundColor: 'transparent',
                borderWidth: 2,
                tension: 0.4,
              }
            ]
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [theme.palette.primary.main, theme.palette.secondary.main]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard 
            title="Total Customers" 
            value={stats.totalCustomers} 
            icon={<CustomersIcon />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard 
            title="Total Orders" 
            value={stats.totalOrders} 
            icon={<OrdersIcon />}
            color={theme.palette.secondary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard 
            title="Total Revenue" 
            value={`$${stats.totalRevenue.toLocaleString()}`} 
            icon={<RevenueIcon />}
            color="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard 
            title="Pending Orders" 
            value={stats.pendingOrders} 
            icon={<PendingIcon />}
            color="#FF9800"
          />
        </Grid>
      </Grid>
      
      <Card sx={{ height: '400px' }}>
        <CardHeader title="Revenue & Orders Overview" />
        <CardContent sx={{ height: 'calc(100% - 70px)' }}>
          <Line options={chartOptions} data={stats.chartData} />
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
