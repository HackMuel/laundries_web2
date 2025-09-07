import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Divider,
  SelectChangeEvent,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import api from '../api'
import { format } from 'date-fns';
import { Customer, Service, Order, OrderItem, OrderStatus } from '../types';

interface FormData {
  customerId: string;
  items: OrderItem[];
  note: string;
  paymentMethod: string;
  isPaid: boolean;
  deliveryDate: string;
  status: string;
}

interface CurrentItem {
  serviceId: string;
  quantity: number;
}

// Helper function to safely format prices in Rupiah
const formatPrice = (price: any): string => {
  if (typeof price === 'number') {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  } else if (price) {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parseFloat(String(price)));
  }
  return '0';
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Table pagination
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Dialog states
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [viewDialog, setViewDialog] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [formError, setFormError] = useState<string>('');
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // New order form
  const [formData, setFormData] = useState<FormData>({
    customerId: '',
    items: [],
    note: '',
    paymentMethod: '',
    isPaid: false,
    deliveryDate: '',
    status: 'pending'
  });

  // Order item form
  const [currentItem, setCurrentItem] = useState<CurrentItem>({
    serviceId: '',
    quantity: 1
  });

  const orderStatusSteps = {
    'pending': 0,
    'processing': 1,
    'completed': 2,
    'delivered': 3
  };

  const statusColors = {
    'pending': '#FF9800',
    'processing': '#2196F3',
    'completed': '#4CAF50',
    'delivered': '#9C27B0',
    'cancelled': '#F44336'
  };

  const statusNames = {
    'pending': 'Tertunda',
    'processing': 'Diproses',
    'completed': 'Selesai',
    'delivered': 'Dikirim',
    'cancelled': 'Dibatalkan'
  };

  const statusLabels: Record<string, string> = {
    'pending': 'Tertunda',
    'processing': 'Diproses',
    'completed': 'Selesai',
    'delivered': 'Dikirim',
    'cancelled': 'Dibatalkan'
  };

  // Helper function for calculating totals safely
  const calculateTotal = (items: OrderItem[]): number => {
    return items.reduce((sum, item) => {
      const service = services.find(s => s.id === item.serviceId);
      if (service) {
        const price = typeof service.price === 'number'
          ? service.price
          : parseFloat(String(service.price || 0));
        return sum + (price * item.quantity);
      }
      return sum;
    }, 0);
  };

  // Data fetching functions
  const fetchOrders = async (status: string = '') => {
    try {
      setLoading(true);
      const response = await api.get(`/orders${status ? `?status=${status}` : ''}`);
      setOrders(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get('/services?active=true');
      setServices(response.data);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchServices();
  }, []);

  useEffect(() => {
    fetchOrders(statusFilter);
  }, [statusFilter]);

  const handleOpenViewDialog = (order: Order) => {
    setSelectedOrder(order);
    setViewDialog(true);
  };

  // Event handlers
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, deliveryDate: e.target.value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormError('');
  };

  const handleSubmitForm = async () => {
    if (!formData.customerId || formData.items.length === 0) {
      setFormError('Please select a customer and add at least one service');
      return;
    }

    setFormSubmitting(true);

    try {
      if (dialogMode === 'create') {
        await api.post('/orders', formData);
      } else if (selectedOrder) {
        await api.patch(`/orders/${selectedOrder.id}`, formData);
      }

      setOpenDialog(false);
      fetchOrders(statusFilter);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'An error occurred while saving the order');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Pesanan
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Pesanan Baru
        </Button>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="status-filter-label">Filter berdasarkan Status</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={statusFilter}
              label="Filter berdasarkan Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">Semua Pesanan</MenuItem>
              <MenuItem value="pending">Tertunda</MenuItem>
              <MenuItem value="processing">Diproses</MenuItem>
              <MenuItem value="completed">Selesai</MenuItem>
              <MenuItem value="delivered">Dikirim</MenuItem>
              <MenuItem value="cancelled">Dibatalkan</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>No. Pesanan</strong></TableCell>
                <TableCell><strong>Pelanggan</strong></TableCell>
                <TableCell><strong>Tanggal</strong></TableCell>
                <TableCell><strong>Total</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Pembayaran</strong></TableCell>
                <TableCell align="right"><strong>Aksi</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length > 0 ? (
                orders
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.orderNumber}</TableCell>
                      <TableCell>
                        {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Tidak diketahui'}
                      </TableCell>
                      <TableCell>{format(new Date(order.createdAt), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>Rp{formatPrice(order.totalAmount)}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabels[order.status] || order.status}
                          sx={{
                            bgcolor: statusColors[order.status as keyof typeof statusColors] || '#999',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.isPaid ? 'Dibayar' : 'Belum Dibayar'}
                          color={order.isPaid ? 'success' : 'default'}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Tidak ada pesanan ditemukan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={orders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>
      )}

      {/* Create/Edit Order Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Buat Pesanan Baru' : `Edit Pesanan ${selectedOrder?.orderNumber}`}
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}

          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="customer-select-label">Pelanggan</InputLabel>
                <Select
                  labelId="customer-select-label"
                  id="customerId"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleInputChange}
                  label="Pelanggan"
                >
                  {customers.map(customer => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName} - {customer.phone}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tanggal Pengiriman"
                type="date"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleDateChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            {dialogMode === 'edit' && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="status-select-label">Status</InputLabel>
                  <Select
                    labelId="status-select-label"
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    label="Status"
                  >
                    <MenuItem value="pending">Tertunda</MenuItem>
                    <MenuItem value="processing">Diproses</MenuItem>
                    <MenuItem value="completed">Selesai</MenuItem>
                    <MenuItem value="delivered">Dikirim</MenuItem>
                    <MenuItem value="cancelled">Dibatalkan</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} md={dialogMode === 'edit' ? 6 : 12}>
              <FormControl fullWidth>
                <InputLabel id="payment-method-label">Metode Pembayaran</InputLabel>
                <Select
                  labelId="payment-method-label"
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  label="Metode Pembayaran"
                >
                  <MenuItem value="">Pilih Metode Pembayaran</MenuItem>
                  <MenuItem value="cash">Tunai</MenuItem>
                  <MenuItem value="credit_card">Kartu Kredit</MenuItem>
                  <MenuItem value="debit_card">Kartu Debit</MenuItem>
                  <MenuItem value="bank_transfer">Transfer Bank</MenuItem>
                  <MenuItem value="mobile_payment">Pembayaran Mobile</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Catatan"
                name="note"
                multiline
                rows={2}
                value={formData.note}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setFormData({ ...formData, note: e.target.value });
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPaid}
                    onChange={handleInputChange}
                    name="isPaid"
                  />
                }
                label="Tandai sebagai Dibayar"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Batal</Button>
          <Button
            onClick={handleSubmitForm}
            variant="contained"
            disabled={formSubmitting}
          >
            {formSubmitting ? <CircularProgress size={24} /> : (dialogMode === 'create' ? 'Buat Pesanan' : 'Perbarui Pesanan')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        {selectedOrder && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Pesanan #{selectedOrder.orderNumber}
                </Typography>
                <Chip
                  label={statusNames[selectedOrder.status as keyof typeof statusNames] || selectedOrder.status}
                  sx={{
                    bgcolor: statusColors[selectedOrder.status as keyof typeof statusColors] || '#999',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
            </DialogTitle>

            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Informasi Pelanggan
                      </Typography>
                      <Typography variant="body2">
                        {selectedOrder.customer ? `${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName}` : 'Tidak diketahui'}
                      </Typography>
                      <Typography variant="body2">
                        {selectedOrder.customer?.phone || 'Tidak diketahui'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Detail Pesanan
                      </Typography>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Tanggal Pesanan:</Typography>
                          <Typography variant="body2">
                            {format(new Date(selectedOrder.createdAt), 'dd/MM/yyyy HH:mm')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Tanggal Pengiriman:</Typography>
                          <Typography variant="body2">
                            {selectedOrder.deliveryDate ? format(new Date(selectedOrder.deliveryDate), 'dd/MM/yyyy') : 'Belum diatur'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Metode Pembayaran:</Typography>
                          <Typography variant="body2">
                            {selectedOrder.paymentMethod ? selectedOrder.paymentMethod.replace('_', ' ').toUpperCase() : 'Tidak ditentukan'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Status Pembayaran:</Typography>
                          <Chip
                            label={selectedOrder.isPaid ? 'Dibayar' : 'Belum Dibayar'}
                            color={selectedOrder.isPaid ? 'success' : 'default'}
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Item Pesanan
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Layanan</strong></TableCell>
                              <TableCell align="right"><strong>Harga</strong></TableCell>
                              <TableCell align="right"><strong>Jumlah</strong></TableCell>
                              <TableCell align="right"><strong>Total</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedOrder.items.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.service?.name || 'Layanan Tidak Diketahui'}</TableCell>
                                <TableCell align="right">Rp{formatPrice(item.price)}</TableCell>
                                <TableCell align="right">{item.quantity}</TableCell>
                                <TableCell align="right">Rp{formatPrice(item.total)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Typography variant="h6">
                          Total: Rp{formatPrice(selectedOrder.totalAmount)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {selectedOrder.note && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          Catatan
                        </Typography>
                        <Typography variant="body2">
                          {selectedOrder.note}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setViewDialog(false)}>Tutup</Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setViewDialog(false);
                  setOpenDialog(true);
                  setDialogMode('edit');
                  setFormData({
                    customerId: selectedOrder.customer?.id || '',
                    items: selectedOrder.items,
                    note: selectedOrder.note || '',
                    paymentMethod: selectedOrder.paymentMethod || '',
                    isPaid: selectedOrder.isPaid,
                    deliveryDate: selectedOrder.deliveryDate || '',
                    status: selectedOrder.status
                  });
                }}
              >
                Edit Pesanan
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>
            Apakah Anda yakin ingin menghapus pesanan #{selectedOrder?.orderNumber}?
            Tindakan ini tidak dapat dibatalkan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Batal</Button>
          <Button onClick={() => {
            if (selectedOrder) {
              api.delete(`/orders/${selectedOrder.id}`).then(() => {
                setDeleteDialog(false);
                fetchOrders(statusFilter);
              });
            }
          }} color="error" variant="contained">
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;