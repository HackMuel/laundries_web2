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

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Table pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // New order form
  const [formData, setFormData] = useState({
    customerId: '',
    items: [],
    note: '',
    paymentMethod: '',
    isPaid: false,
    deliveryDate: '',
    status: 'pending'
  });

  // Order item form
  const [currentItem, setCurrentItem] = useState({
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

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchServices();
  }, []);

  useEffect(() => {
    fetchOrders(statusFilter);
  }, [statusFilter]);

  const fetchOrders = async (status = '') => {
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

  // Dialog handlers
  const handleOpenDialog = (mode, order = null) => {
    setDialogMode(mode);

    if (mode === 'edit' && order) {
      setSelectedOrder(order);
      setFormData({
        customerId: order.customerId,
        items: order.items.map(item => ({
          serviceId: item.serviceId,
          quantity: item.quantity
        })),
        note: order.note || '',
        paymentMethod: order.paymentMethod || '',
        isPaid: order.isPaid || false,
        deliveryDate: order.deliveryDate ? format(new Date(order.deliveryDate), 'yyyy-MM-dd') : '',
        status: order.status
      });
    } else {
      // Reset form for create
      setFormData({
        customerId: '',
        items: [],
        note: '',
        paymentMethod: '',
        isPaid: false,
        deliveryDate: '',
        status: 'pending'
      });
    }

    setFormError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormError('');
  };

  const handleOpenDeleteDialog = (order) => {
    setSelectedOrder(order);
    setDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog(false);
  };

  const handleOpenViewDialog = (order) => {
    setSelectedOrder(order);
    setViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialog(false);
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({
      ...prev,
      [name]: name === 'quantity' ? Math.max(1, parseInt(value) || 1) : value
    }));
  };

  const handleAddItem = () => {
    if (!currentItem.serviceId) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { ...currentItem }]
    }));

    // Reset current item
    setCurrentItem({
      serviceId: '',
      quantity: 1
    });
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!formData.customerId || formData.items.length === 0) {
      setFormError('Please select a customer and add at least one service.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      // Log the data being sent to API
      console.log('Sending order data:', JSON.stringify(formData, null, 2));

      if (dialogMode === 'create') {
        const response = await api.post('/orders', formData);
        console.log('Order created response:', response.data);
      } else {
        const response = await api.patch(`/orders/${selectedOrder.id}`, formData);
        console.log('Order updated response:', response.data);
      }

      handleCloseDialog();
      fetchOrders(statusFilter);
    } catch (err) {
      console.error('Error submitting form:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error response status:', err.response?.status);

      // Try to extract more details if available
      if (err.response?.data?.error) {
        console.error('Detailed error:', err.response.data.error);
      }

      setFormError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteOrder = async () => {
    try {
      await api.delete(`/orders/${selectedOrder.id}`);
      handleCloseDeleteDialog();
      fetchOrders(statusFilter);
    } catch (err) {
      console.error('Error deleting order:', err);
      setError('Failed to delete order. Please try again.');
    }
  };

  // Status filter & pagination
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - orders.length) : 0;

  // Helper functions
  const getServiceNameById = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Unknown Service';
  };

  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return price.toFixed(2);
    } else if (price) {
      return parseFloat(String(price)).toFixed(2);
    }
    return '0.00';
  };

  const calculateTotal = (items) => {
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

  const getCustomerNameById = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown Customer';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Orders
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          New Order
        </Button>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="status-filter-label">Filter by Status</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={statusFilter}
              label="Filter by Status"
              onChange={handleStatusFilterChange}
            >
              <MenuItem value="">All Orders</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Order #</strong></TableCell>
                  <TableCell><strong>Customer</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Total</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Payment</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.length > 0 ? (
                  orders
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.orderNumber}</TableCell>
                        <TableCell>{order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Unknown'}</TableCell>
                        <TableCell>{format(new Date(order.createdAt), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>${formatPrice(order.totalAmount)}</TableCell>
                        <TableCell>
                          <Chip
                            label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            sx={{
                              bgcolor: statusColors[order.status],
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.isPaid ? 'Paid' : 'Unpaid'}
                            color={order.isPaid ? 'success' : 'default'}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton color="info" onClick={() => handleOpenViewDialog(order)}>
                            <ReceiptIcon />
                          </IconButton>
                          <IconButton color="primary" onClick={() => handleOpenDialog('edit', order)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="error" onClick={() => handleOpenDeleteDialog(order)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No orders found
                    </TableCell>
                  </TableRow>
                )}

                {emptyRows > 0 && (
                  <TableRow style={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={7} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={orders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      )}

      {/* Create/Edit Order Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create New Order' : `Edit Order ${selectedOrder?.orderNumber}`}
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
                <InputLabel id="customer-select-label">Customer</InputLabel>
                <Select
                  labelId="customer-select-label"
                  id="customerId"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleInputChange}
                  label="Customer"
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
                label="Delivery Date"
                type="date"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
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
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="processing">Processing</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} md={dialogMode === 'edit' ? 6 : 12}>
              <FormControl fullWidth>
                <InputLabel id="payment-method-label">Payment Method</InputLabel>
                <Select
                  labelId="payment-method-label"
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  label="Payment Method"
                >
                  <MenuItem value="">Select Payment Method</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="credit_card">Credit Card</MenuItem>
                  <MenuItem value="debit_card">Debit Card</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="mobile_payment">Mobile Payment</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight="medium">Order Items ({formData.items.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2} alignItems="flex-end">
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel id="service-select-label">Service</InputLabel>
                        <Select
                          labelId="service-select-label"
                          id="serviceId"
                          name="serviceId"
                          value={currentItem.serviceId}
                          onChange={handleItemInputChange}
                          label="Service"
                        >
                          {services.map(service => (
                            <MenuItem key={service.id} value={service.id}>
                              {service.name} - ${formatPrice(service.price)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label="Quantity"
                        name="quantity"
                        type="number"
                        value={currentItem.quantity}
                        onChange={handleItemInputChange}
                        InputProps={{ inputProps: { min: 1 } }}
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="secondary"
                        onClick={handleAddItem}
                        disabled={!currentItem.serviceId}
                      >
                        Add Item
                      </Button>
                    </Grid>
                  </Grid>

                  {formData.items.length > 0 ? (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Added Items:
                      </Typography>
                      <Card variant="outlined">
                        <List disablePadding>
                          {formData.items.map((item, index) => (
                            <ListItem key={index} divider={index !== formData.items.length - 1}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <Typography>
                                  {getServiceNameById(item.serviceId)} x {item.quantity}
                                </Typography>
                                <IconButton size="small" color="error" onClick={() => handleRemoveItem(index)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </ListItem>
                          ))}
                          <ListItem>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                              <Typography fontWeight="bold">Estimated Total:</Typography>
                              <Typography fontWeight="bold">
                                ${formatPrice(calculateTotal(formData.items))}
                              </Typography>
                            </Box>
                          </ListItem>
                        </List>
                      </Card>
                    </Box>
                  ) : (
                    <Typography color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                      No items added yet.
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="note"
                multiline
                rows={2}
                value={formData.note}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPaid}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPaid: e.target.checked }))}
                    name="isPaid"
                  />
                }
                label="Mark as Paid"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitForm}
            variant="contained"
            disabled={formSubmitting}
          >
            {formSubmitting ? <CircularProgress size={24} /> : (dialogMode === 'create' ? 'Create Order' : 'Update Order')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={viewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        {selectedOrder && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Order #{selectedOrder.orderNumber}
                </Typography>
                <Chip
                  label={selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  sx={{
                    bgcolor: statusColors[selectedOrder.status],
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                <Box sx={{ mb: 3 }}>
                  <Stepper activeStep={orderStatusSteps[selectedOrder.status]}>
                    <Step>
                      <StepLabel>Pending</StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>Processing</StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>Completed</StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>Delivered</StepLabel>
                    </Step>
                  </Stepper>
                </Box>
              )}

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Customer Information
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrder.customer ? `${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName}` : 'Unknown'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedOrder.customer?.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedOrder.customer?.phone}
                      </Typography>
                      {selectedOrder.customer?.address && (
                        <Typography variant="body2" color="text.secondary">
                          {selectedOrder.customer.address}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Order Details
                      </Typography>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Order Date:</Typography>
                          <Typography variant="body2">
                            {format(new Date(selectedOrder.createdAt), 'MMM dd, yyyy HH:mm')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Delivery Date:</Typography>
                          <Typography variant="body2">
                            {selectedOrder.deliveryDate ? format(new Date(selectedOrder.deliveryDate), 'MMM dd, yyyy') : 'Not set'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Payment Method:</Typography>
                          <Typography variant="body2">
                            {selectedOrder.paymentMethod ? selectedOrder.paymentMethod.replace('_', ' ').toUpperCase() : 'Not specified'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Payment Status:</Typography>
                          <Chip
                            label={selectedOrder.isPaid ? 'Paid' : 'Unpaid'}
                            color={selectedOrder.isPaid ? 'success' : 'default'}
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                        {selectedOrder.isPaid && selectedOrder.paidAt && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Payment Date:</Typography>
                            <Typography variant="body2">
                              {format(new Date(selectedOrder.paidAt), 'MMM dd, yyyy HH:mm')}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Order Items
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Service</strong></TableCell>
                              <TableCell align="right"><strong>Price</strong></TableCell>
                              <TableCell align="right"><strong>Quantity</strong></TableCell>
                              <TableCell align="right"><strong>Total</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedOrder.items.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.service?.name || 'Unknown Service'}</TableCell>
                                <TableCell align="right">${formatPrice(item.price)}</TableCell>
                                <TableCell align="right">{item.quantity}</TableCell>
                                <TableCell align="right">${formatPrice(item.total)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Typography variant="h6">
                          Total: ${formatPrice(selectedOrder?.totalAmount)}
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
                          Notes
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
              <Button onClick={handleCloseViewDialog}>Close</Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  handleCloseViewDialog();
                  handleOpenDialog('edit', selectedOrder);
                }}
              >
                Edit Order
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete order #{selectedOrder?.orderNumber}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteOrder} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Custom component for the order items list
const List = ({ children, disablePadding }) => (
  <Box sx={{ p: disablePadding ? 0 : 1 }}>
    {children}
  </Box>
);

const ListItem = ({ children, divider }) => (
  <Box sx={{
    py: 1.5,
    px: 2,
    borderBottom: divider ? '1px solid rgba(0, 0, 0, 0.12)' : 'none'
  }}>
    {children}
  </Box>
);

export default Orders;
