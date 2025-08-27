require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

const {
  FRONTEND_ORIGIN = "http://localhost:5173",
  NODE_ENV = "development",
  PORT = 5000,
  JSON_LIMIT = "1mb",
  COOKIE_DOMAIN,
} = process.env;

const app = express();
const server = http.createServer(app);

// --- Seguridad/infra básica ---
app.set("trust proxy", 1); // necesario detrás de proxy para cookies secure
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));

// --- CORS (exacto) ---
const corsOptions = {
  origin: FRONTEND_ORIGIN, // exacto dominio del frontend
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// --- Body & cookies ---
app.use(express.json({ limit: JSON_LIMIT }));
app.use(cookieParser());

// --- Socket.IO con el MISMO origin ---
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
app.set("io", io);

io.on("connection", (socket) => {
  socket.on("sendMessage", (message) => io.emit("newMessage", message));
  socket.on("disconnect", () => {});
});

// --- Rate limiting (rutas sensibles) ---
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 20, // ajusta a tus necesidades
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/users", authLimiter);

// --- Static: uploads con caché ---
const ensureUploadsFolderExists = require("./utils/products");
ensureUploadsFolderExists();
app.use(
  "/uploads/products",
  express.static("uploads/products", {
    maxAge: NODE_ENV === "production" ? "7d" : 0,
    etag: true,
    immutable: NODE_ENV === "production",
  })
);

// --- Rutas ---
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const messageRoutes = require("./routes/messageRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const sizeRoutes = require("./routes/sizeRoutes");
const colorRoutes = require("./routes/colorRoutes");
const visitRoutes = require("./routes/visitRouter");
const dashboardRoutes = require("./routes/dashboardRoutes");
const productEntryHistoryRoutes = require("./routes/productEntryHistoryRoutes");
const cartRoutes = require("./routes/cartRoutes");

app.use("/api/users", userRoutes);
app.use("/api/productsHistory", productEntryHistoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/sizes", sizeRoutes);
app.use("/api/colors", colorRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/cart", cartRoutes);

// --- Healthcheck y 404 controlados ---
app.get("/health", (_req, res) => res.status(200).json({ ok: true }));
app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

// --- Error handler único ---
app.use((err, _req, res, _next) => {
  console.error("❌ Error:", err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Error interno" });
});

// --- Conexión Mongo y arranque ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Backend en ${NODE_ENV} escuchando en :${PORT}`);
      console.log(`✅ Frontend permitido: ${FRONTEND_ORIGIN}`);
    });
  })
  .catch((err) => console.error("❌ Error de conexión a MongoDB:", err));

// --- Cierre elegante ---
const shutdown = (signal) => () => {
  console.log(`\n${signal} recibido, cerrando...`);
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("🧹 Conexiones cerradas. Bye!");
      process.exit(0);
    });
  });
};
process.on("SIGINT", shutdown("SIGINT"));
process.on("SIGTERM", shutdown("SIGTERM"));
