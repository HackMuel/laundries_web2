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
import api from '../utils/api';
import { Customer } from '../types';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Table pagination
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Dialog states
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });
  const [formError, setFormError] = useState<string>('');
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get('/customers');
        setCustomers(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch customers');
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (mode: 'create' | 'edit', customer?: Customer) => {
    setDialogMode(mode);
    setOpenDialog(true);
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
      setSelectedCustomer(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: ''
      });
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormError('');
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog(false);
  };

  const handleDeleteDialogOpen = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDeleteDialog(true);
  };

  const handleFormSubmit = async () => {
    setFormSubmitting(true);
    try {
      if (dialogMode === 'create') {
        await api.post('/customers', formData);
      } else if (dialogMode === 'edit' && selectedCustomer) {
        await api.put(`/customers/${selectedCustomer.id}`, formData);
      }
      const response = await api.get('/customers');
      setCustomers(response.data);
      setOpenDialog(false);
    } catch (err) {
      setFormError('Failed to submit form');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    try {
      if (selectedCustomer) {
        await api.delete(`/customers/${selectedCustomer.id}`);
        const response = await api.get('/customers');
        setCustomers(response.data);
      }
      setDeleteDialog(false);
    } catch (err) {
      setError('Failed to delete customer');
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Pelanggan
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          Tambah Pelanggan
        </Button>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Cari pelanggan berdasarkan nama, email atau telepon..."
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
              Cari
            </Button>
          </Box>
        </CardContent>
      </Card>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nama</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Telepon</strong></TableCell>
                <TableCell><strong>Alamat</strong></TableCell>
                <TableCell align="right"><strong>Aksi</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.firstName} {customer.lastName}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.address}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleOpenDialog('edit', customer)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteDialogOpen(customer)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredCustomers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{dialogMode === 'create' ? 'Tambah Pelanggan Baru' : 'Edit Pelanggan'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogMode === 'create'
              ? 'Isi formulir untuk menambahkan pelanggan baru.'
              : 'Edit detail pelanggan.'}
          </DialogContentText>
          <TextField
            margin="dense"
            label="Nama Depan"
            fullWidth
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Nama Belakang"
            fullWidth
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Email"
            fullWidth
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Telepon"
            fullWidth
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Alamat"
            fullWidth
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />
          {formError && <Alert severity="error">{formError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Batal</Button>
          <Button
            onClick={handleFormSubmit}
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
          <DialogContentText>
            Apakah Anda yakin ingin menghapus {selectedCustomer?.firstName} {selectedCustomer?.lastName}?
            Tindakan ini tidak dapat dibatalkan.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Batal</Button>
          <Button onClick={handleDeleteCustomer} color="error" variant="contained">
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;