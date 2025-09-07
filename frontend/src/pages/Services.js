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
  Switch,
  FormControlLabel,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import api from '../api'

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Table pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // create, edit
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    estimatedTime: '',
    isActive: true
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/services');
      setServices(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Dialog handlers
  const handleOpenDialog = (mode, service = null) => {
    setDialogMode(mode);

    if (mode === 'edit' && service) {
      setSelectedService(service);
      setFormData({
        name: service.name,
        description: service.description,
        price: service.price,
        estimatedTime: service.estimatedTime,
        isActive: service.isActive
      });
    } else {
      // Reset form for create
      setFormData({
        name: '',
        description: '',
        price: '',
        estimatedTime: '',
        isActive: true
      });
    }

    setFormError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormError('');
  };

  const handleOpenDeleteDialog = (service) => {
    setSelectedService(service);
    setDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog(false);
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      const dataToSubmit = {
        ...formData,
        price: parseFloat(formData.price),
        estimatedTime: parseInt(formData.estimatedTime, 10)
      };

      if (dialogMode === 'create') {
        await api.post('/services', dataToSubmit);
      } else {
        await api.patch(`/services/${selectedService.id}`, dataToSubmit);
      }

      handleCloseDialog();
      fetchServices();
    } catch (err) {
      console.error('Error submitting form:', err);
      setFormError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteService = async () => {
    try {
      await api.delete(`/services/${selectedService.id}`);
      handleCloseDeleteDialog();
      fetchServices();
    } catch (err) {
      console.error('Error deleting service:', err);
      setError('Failed to delete service. Please try again.');
    }
  };

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - services.length) : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Services
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          Add Service
        </Button>
      </Box>

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
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Price</strong></TableCell>
                  <TableCell><strong>Est. Time (min)</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.length > 0 ? (
                  services
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>{service.name}</TableCell>
                        <TableCell>
                          {service.description.length > 60 ?
                            `${service.description.substring(0, 60)}...` :
                            service.description}
                        </TableCell>
                        <TableCell>
                          ${typeof service.price === 'number'
                            ? service.price.toFixed(2)
                            : parseFloat(service.price).toFixed(2)}
                        </TableCell>
                        <TableCell>{service.estimatedTime} minutes</TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              bgcolor: service.isActive ? 'success.main' : 'text.disabled',
                              color: 'white',
                              py: 0.5,
                              px: 1.5,
                              borderRadius: 1,
                              display: 'inline-block'
                            }}
                          >
                            {service.isActive ? 'Active' : 'Inactive'}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton color="primary" onClick={() => handleOpenDialog('edit', service)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="error" onClick={() => handleOpenDeleteDialog(service)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No services found
                    </TableCell>
                  </TableRow>
                )}

                {emptyRows > 0 && (
                  <TableRow style={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={6} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={services.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === 'create' ? 'Add New Service' : 'Edit Service'}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmitForm} sx={{ mt: 1 }}>
            <TextField
              margin="dense"
              name="name"
              label="Service Name"
              fullWidth
              required
              value={formData.name}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              fullWidth
              multiline
              rows={3}
              required
              value={formData.description}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="price"
              label="Price"
              type="number"
              fullWidth
              required
              value={formData.price}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            <TextField
              margin="dense"
              name="estimatedTime"
              label="Estimated Time (in minutes)"
              type="number"
              fullWidth
              required
              value={formData.estimatedTime}
              onChange={handleInputChange}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  name="isActive"
                />
              }
              label="Active"
              sx={{ mt: 1 }}
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
          <Typography>
            Are you sure you want to delete the service "{selectedService?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteService} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Services;
