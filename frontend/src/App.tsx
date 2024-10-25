import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  TextField,
  Toolbar,
  Typography,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface Product {
  _id?: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  image?: File;
}

const App = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const API_BASE_URL = 'http://127.0.0.1:8080'; // Make sure this matches your backend URL

  const initialFormData = {
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
  };

  const [formData, setFormData] = useState<Product>(initialFormData);

  // Fetch products with error handling
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.products) {
        setProducts(data.products);
      } else {
        throw new Error('Invalid data structure received from server');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      showSnackbar(`Failed to fetch products: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      setProducts([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? (value === '' ? 0 : parseFloat(value)) : value
    }));
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar('Image size should be less than 5MB', 'error');
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showSnackbar('Please upload an image file', 'error');
        return;
      }
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  // Show snackbar message
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // Submit form with enhanced error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form data
      if (!formData.name.trim() || !formData.description.trim() || formData.price <= 0) {
        throw new Error('Please fill all required fields with valid values');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('price', formData.price.toString());
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const url = isEditing && currentProduct?._id 
        ? `${API_BASE_URL}/products/${currentProduct._id}`
        : `${API_BASE_URL}/products`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server returned ${response.status}`);
      }
      
      await fetchProducts();
      setFormData(initialFormData);
      setOpenDialog(false);
      showSnackbar(
        isEditing ? 'Product updated successfully' : 'Product added successfully',
        'success'
      );
    } catch (err) {
      console.error('Error saving product:', err);
      showSnackbar(
        err instanceof Error ? err.message : 'Failed to save product',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Delete product with confirmation
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed with status ${response.status}`);
      }
      
      await fetchProducts();
      showSnackbar('Product deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting product:', err);
      showSnackbar(
        err instanceof Error ? err.message : 'Failed to delete product',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Reset and close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setIsEditing(false);
    setCurrentProduct(null);
    setFormData(initialFormData);
  };

  // Handle edit product
  const handleEdit = (product: Product) => {
    setIsEditing(true);
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    setOpenDialog(true);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="primary" sx={{ mb: 4 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Product Management
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Add Product
          </Button>
        </Toolbar>
      </AppBar>

      <Container>
        {isLoading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : products.length === 0 ? (
          <Box textAlign="center" my={4}>
            <Typography variant="h6" color="text.secondary">
              No products found
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{ mt: 2 }}
            >
              Add Your First Product
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product._id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={product.imageUrl}
                    alt={product.name}
                    sx={{ objectFit: 'cover' }}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
                    }}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h6" component="div">
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {product.description}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                      ${product.price.toFixed(2)}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(product)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => product._id && handleDelete(product._id)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            component: 'form',
            onSubmit: handleSubmit
          }}
        >
          <DialogTitle>
            {isEditing ? 'Edit Product' : 'Add New Product'}
            <IconButton
              aria-label="close"
              onClick={handleCloseDialog}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                fullWidth
                error={formData.name.trim() === ''}
                helperText={formData.name.trim() === '' ? 'Name is required' : ''}
              />
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                fullWidth
                multiline
                rows={3}
                error={formData.description.trim() === ''}
                helperText={formData.description.trim() === '' ? 'Description is required' : ''}
              />
              <TextField
                label="Price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                required
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
                error={formData.price <= 0}
                helperText={formData.price <= 0 ? 'Price must be greater than 0' : ''}
              />
              <Button
                variant="outlined"
                component="label"
                fullWidth
              >
                Upload Image
                <input
                  type="file"
                  hidden
                  onChange={handleImageChange}
                  accept="image/*"
                  required={!isEditing}
                />
              </Button>
              {formData.image && (
                <Typography variant="caption" color="primary">
                  New image selected: {formData.image.name}
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} />
              ) : (
                isEditing ? 'Update' : 'Add'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default App;