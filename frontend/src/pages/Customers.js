import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
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
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import api from '../api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Table pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // create, edit
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/customers${searchTerm ? `?search=${searchTerm}` : ''}`);
      setCustomers(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Dialog handlers
  const handleOpenDialog = (mode, customer = null) => {
    setDialogMode(mode);
    
    if (mode === 'edit' && customer) {
      setSelectedCustomer(customer);
      setFormData({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address || ''
      });
    } else {
      // Reset form for create
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: ''
      });
    }
    
    setFormError('');
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormError('');
  };
  
  const handleOpenDeleteDialog = (customer) => {
    setSelectedCustomer(customer);
    setDeleteDialog(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialog(false);
  };
  
  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');
    
    try {
      if (dialogMode === 'create') {
        await api.post('/customers', formData);
      } else {
        await api.patch(`/customers/${selectedCustomer.id}`, formData);
      }
      
      handleCloseDialog();
      fetchCustomers();
    } catch (err) {
      console.error('Error submitting form:', err);
      setFormError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };
  
  const handleDeleteCustomer = async () => {
    try {
      await api.delete(`/customers/${selectedCustomer.id}`);
      handleCloseDeleteDialog();
      fetchCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError('Failed to delete customer. Please try again.');
    }
  };
  
  // Search and pagination
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - customers.length) : 0;
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Customers
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          Add Customer
        </Button>
      </Box>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search customers by name, email or phone..."
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              sx={{ ml: 2, height: 56 }}
            >
              Search
            </Button>
          </Box>
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
        <Paper sx={{ width: '100%' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Phone</strong></TableCell>
                  <TableCell><strong>Address</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.length > 0 ? (
                  customers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>{`${customer.firstName} ${customer.lastName}`}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell>{customer.address || 'N/A'}</TableCell>
                        <TableCell align="right">
                          <IconButton color="primary" onClick={() => handleOpenDialog('edit', customer)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="error" onClick={() => handleOpenDeleteDialog(customer)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No customers found
                    </TableCell>
                  </TableRow>
                )}
                
                {emptyRows > 0 && (
                  <TableRow style={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={5} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={customers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
      
      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{dialogMode === 'create' ? 'Add New Customer' : 'Edit Customer'}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmitForm} sx={{ mt: 1 }}>
            <TextField
              margin="dense"
              name="firstName"
              label="First Name"
              fullWidth
              required
              value={formData.firstName}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="lastName"
              label="Last Name"
              fullWidth
              required
              value={formData.lastName}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="email"
              label="Email Address"
              type="email"
              fullWidth
              required
              value={formData.email}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="phone"
              label="Phone Number"
              fullWidth
              required
              value={formData.phone}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="address"
              label="Address"
              fullWidth
              multiline
              rows={2}
              value={formData.address}
              onChange={handleInputChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmitForm} 
            variant="contained"
            disabled={formSubmitting}
          >
            {formSubmitting ? <CircularProgress size={24} /> : (dialogMode === 'create' ? 'Add' : 'Save')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedCustomer?.firstName} {selectedCustomer?.lastName}? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteCustomer} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;
