import { Router, Request, Response } from "express";
import { getProducts, insertProduct, updateProduct, deleteProduct } from "../config/database";
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { Product } from "../types/product.type";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    return {
      resource_type: 'auto',
      folder: 'store-products',
      allowed_formats: ['jpg', 'png'],
      transformation: [{ width: 500, height: 500, crop: 'limit' }]
    };
  }
});

const upload = multer({ storage: storage });

const productRouter = Router();

// Get all products
productRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await getProducts();
    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ message: "Error fetching products" });
  }
});

// Create new product
productRouter.post("/", upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price } = req.body;
    
    if (!req.file) {
      res.status(400).json({ message: "Image is required" });
      return;
    }

    const newProduct: Product = {
      name,
      description,
      price: Number(price),
      imageUrl: req.file.path // Cloudinary returns the URL in req.file.path
    };

    const result = await insertProduct(newProduct);
    res.status(201).json({ message: "Product created", product: result });
  } catch (error) {
    res.status(500).json({ message: "Error creating product" });
  }
});

// Update product
productRouter.put("/:id", upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, price } = req.body;

    const updateData: Partial<Product> = {
      name,
      description,
      price: Number(price),
    };

    // If new image is uploaded, update imageUrl
    if (req.file) {
      updateData.imageUrl = req.file.path;
    }

    const result = await updateProduct(id, updateData as Product);
    res.status(200).json({ message: "Product updated", result });
  } catch (error) {
    res.status(500).json({ message: "Error updating product" });
  }
});

// Delete product
productRouter.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await deleteProduct(id);
    res.status(200).json({ message: "Product deleted", result });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product" });
  }
});

export { productRouter };