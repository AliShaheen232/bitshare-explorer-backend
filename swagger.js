// swagger.js
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const path = require("path");
require("dotenv").config();
const port = process.env.PORT || 3001;

// Swagger configuration options
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
      description: "API Documentation for your project",
    },
    servers: [
      {
        url: `http://0.0.0.0:${port}`, // Replace with your server URL
      },
    ],
  },
  // apis: ["./routes/*.js"], // Path to the API docs
  apis: [path.join(__dirname, "./swaggerDocs.js")], // Path to the API docs
};
// Initialize swagger-jsdoc
const swaggerDocs = swaggerJsDoc(swaggerOptions);



module.exports = {
  swaggerUi,
  swaggerDocs,
};
