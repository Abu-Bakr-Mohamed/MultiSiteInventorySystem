const express = require("express");
const cors = require("cors"); // Import CORS middleware
const sql = require("mssql");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = 3000;

// Base SQL Server configuration (without specifying the database)
const baseDbConfig = {
   server: "ABU-BAKR",
   user: "boky",
   password: "5635865",
   options: {
      encrypt: false,
      trustServerCertificate: true,
   },
};

// Global variable to manage the current connection pool
let currentPool = null;

// Function to create a new connection pool for a specific database
async function getConnection(database) {
   if (currentPool && currentPool.connected) {
      console.log(
         `Closing existing pool for database: ${currentPool.config.database}`
      );
      await currentPool.close(); // Close the current pool if open
   }

   const dbConfig = { ...baseDbConfig, database };
   console.log(`Creating a new pool for database: ${database}`);
   currentPool = await sql.connect(dbConfig); // Create a new connection pool
   return currentPool;
}

// API to Get Products
app.get("/products", async (req, res) => {
   const { database } = req.query; // Get the database name from the query parameter
   if (!database) {
      return res.status(400).send("Database name is required.");
   }

   try {
      const pool = await getConnection(database); // Switch to the selected database
      console.log(`Fetching products from database: ${database}`);
      const result = await pool.request().query("SELECT * FROM Products");
      res.json(result.recordset);
   } catch (err) {
      console.error(
         "Error fetching products from database:",
         database,
         err.message
      );
      res.status(500).send(err.message);
   }
});

// API to Add a Product
app.post("/products", async (req, res) => {
   const { database } = req.query;
   const { ProductID, ProductName, Category, Price } = req.body;

   if (!database) return res.status(400).send("Database name is required.");
   if (!ProductID || !ProductName || !Category || Price === undefined)
      return res
         .status(400)
         .send(
            "ProductID, ProductName, Category, and Price are required fields."
         );

   try {
      const pool = await getConnection(database);
      const query = `
            INSERT INTO Products (ProductID, ProductName, Category, Price)
            VALUES (${ProductID}, '${ProductName}', '${Category}', ${Price})
        `;
      console.log("Executing INSERT Query:", query);
      await pool.request().query(query);
      res.send("Product added successfully.");
   } catch (err) {
      console.error("Error adding product to database:", database, err.message);
      res.status(500).send(err.message);
   }
});

// API to Update a Product
app.put("/products/:id", async (req, res) => {
   const { database } = req.query;
   const { id } = req.params;
   const { ProductName, Category, Price } = req.body;

   if (!database) return res.status(400).send("Database name is required.");
   if (!ProductName || !Category || Price === undefined)
      return res
         .status(400)
         .send("ProductName, Category, and Price are required fields.");

   try {
      const pool = await getConnection(database);
      const query = `
            UPDATE Products
            SET ProductName = '${ProductName}', Category = '${Category}', Price = ${Price}
            WHERE ProductID = ${id}
        `;
      console.log("Executing UPDATE Query:", query);
      await pool.request().query(query);
      res.send("Product updated successfully.");
   } catch (err) {
      console.error(
         "Error updating product in database:",
         database,
         err.message
      );
      res.status(500).send(err.message);
   }
});

// API to Delete a Product
app.delete("/products/:id", async (req, res) => {
   const { database } = req.query;
   const { id } = req.params;

   if (!database) return res.status(400).send("Database name is required.");

   try {
      const pool = await getConnection(database);
      const query = `DELETE FROM Products WHERE ProductID = ${id}`;
      console.log("Executing DELETE Query:", query);
      await pool.request().query(query);
      res.send("Product deleted successfully.");
   } catch (err) {
      console.error(
         "Error deleting product from database:",
         database,
         err.message
      );
      res.status(500).send(err.message);
   }
});

// Handle favicon requests to avoid unnecessary 404 errors
app.get("/favicon.ico", (req, res) => res.status(204).send());

// Start the Server
app.listen(port, () => {
   console.log(`Server running at http://localhost:${port}`);
});
