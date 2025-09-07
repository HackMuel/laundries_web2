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
import axios from '../api';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
}

interface DashboardStats {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  chartData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill?: boolean;
      tension?: number;
      borderWidth?: number;
    }>;
  };
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, color }) => {
  const theme = useTheme();

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={icon}
        title={title}
        titleTypographyProps={{ variant: 'h6' }}
        sx={{ backgroundColor: color, color: theme.palette.common.white }}
      />
      <CardContent>
        <Typography variant="h4" align="center">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<DashboardStats>({
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
    const fetchStats = async () => {
      try {
        const response = await axios.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Total Pelanggan"
            value={stats.totalCustomers.toString()}
            icon={<CustomersIcon fontSize="large" />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Total Pesanan"
            value={stats.totalOrders.toString()}
            icon={<OrdersIcon fontSize="large" />}
            color="#2196F3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Total Pendapatan"
            value={`Rp${formatCurrency(stats.totalRevenue)}`}
            icon={<RevenueIcon fontSize="large" />}
            color="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Pesanan Tertunda"
            value={stats.pendingOrders.toString()}
            icon={<PendingIcon fontSize="large" />}
            color="#FF9800"
          />
        </Grid>
      </Grid>

      <Card sx={{ mb: 4, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, px: 1 }}>
          Ikhtisar Pendapatan & Pesanan
        </Typography>
        <Line data={stats.chartData} />
      </Card>
    </Box>
  );
};

// Fungsi untuk format mata uang Rupiah (tanpa decimal)
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export default Dashboard;