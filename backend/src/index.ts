import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import { productRouter } from "./routes/product.routes";

dotenv.config();


const PORT:number = parseInt(`${process.env.PORT}`) || 3000;
const app = express();

app.use(express.json());
app.use(morgan("tiny"));
app.use(cors());

app.use("/products",productRouter);


app.listen(PORT, ()=>{
    console.log(`Server running at http://127.0.0.1:${PORT}`);
});