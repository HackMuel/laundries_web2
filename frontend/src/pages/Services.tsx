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
import api from '../utils/axios';
import { Service } from '../types';

interface FormData {
  name: string;
  description: string;
  price: string;
  estimatedTime: string;
  isActive: boolean;
}

// Fungsi untuk format mata uang Rupiah
const formatCurrency = (value: any): string => {
  if (typeof value === 'number') {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  } else if (value) {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parseFloat(String(value)));
  }
  return '0';
};

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Table pagination
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    estimatedTime: '',
    isActive: true
  });
  const [formError, setFormError] = useState<string>('');
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  
  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/services');
      setServices(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenDialog = (mode: 'create' | 'edit', service?: Service) => {
    setDialogMode(mode);
    setOpenDialog(true);
    if (service) {
      setSelectedService(service);
      setFormData({
        name: service.name,
        description: service.description,
        price: service.price.toString(),
        estimatedTime: service.estimatedTime.toString(),
        isActive: service.isActive
      });
    } else {
      setSelectedService(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        estimatedTime: '',
        isActive: true
      });
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormError('');
  };

  const handleDeleteDialogOpen = (service: Service) => {
    setSelectedService(service);
    setDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'isActive' ? e.target.checked : value
    }));
  };

  const handleSubmitForm = async () => {
    setFormSubmitting(true);
    try {
      if (dialogMode === 'create') {
        await api.post('/services', formData);
      } else if (dialogMode === 'edit' && selectedService) {
        await api.put(`/services/${selectedService.id}`, formData);
      }
      fetchServices();
      handleCloseDialog();
    } catch (err) {
      setFormError('Failed to submit form');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteService = async () => {
    if (selectedService) {
      try {
        await api.delete(`/services/${selectedService.id}`);
        fetchServices();
        handleCloseDeleteDialog();
      } catch (err) {
        setError('Failed to delete service');
      }
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Layanan
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          Tambah Layanan
        </Button>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nama</strong></TableCell>
                <TableCell><strong>Deskripsi</strong></TableCell>
                <TableCell><strong>Harga</strong></TableCell>
                <TableCell><strong>Waktu Est. (menit)</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Aksi</strong></TableCell>
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
                      <TableCell>Rp{typeof service.price === 'number' 
                        ? service.price.toFixed(2) 
                        : parseFloat(String(service.price)).toFixed(2)}</TableCell>
                      <TableCell>{service.estimatedTime} menit</TableCell>
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
                          {service.isActive ? 'Aktif' : 'Nonaktif'}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleOpenDialog('edit', service)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteDialogOpen(service)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Tidak ada layanan ditemukan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={services.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      )}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === 'create' ? 'Tambah Layanan Baru' : 'Edit Layanan'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Nama"
            name="name"
            fullWidth
            value={formData.name}
            onChange={handleFormChange}
          />
          <TextField
            margin="dense"
            label="Deskripsi"
            name="description"
            fullWidth
            value={formData.description}
            onChange={handleFormChange}
          />
          <TextField
            margin="dense"
            label="Harga"
            name="price"
            type="number"
            fullWidth
            value={formData.price}
            onChange={handleFormChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">Rp</InputAdornment>
            }}
          />
          <TextField
            margin="dense"
            label="Waktu Estimasi"
            name="estimatedTime"
            fullWidth
            value={formData.estimatedTime}
            onChange={handleFormChange}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={handleFormChange}
                name="isActive"
              />
            }
            label="Aktif"
          />
          {formError && <Alert severity="error">{formError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Batal</Button>
          <Button 
            onClick={handleSubmitForm} 
            variant="contained"
            disabled={formSubmitting}
          >
            {formSubmitting ? <CircularProgress size={24} /> : (dialogMode === 'create' ? 'Tambah' : 'Simpan')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>
            Apakah Anda yakin ingin menghapus layanan "{selectedService?.name}"? 
            Tindakan ini tidak dapat dibatalkan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Batal</Button>
          <Button onClick={handleDeleteService} color="error" variant="contained">
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Services;