const express = require("express");

const {

getCategories,
createCategory,
deleteCategory

} = require(
"../controllers/categoryController"
);

const authenticateToken =
require(
"../middleware/authMiddleware"
);

const isAdmin =
require(
"../middleware/adminMiddleware"
);

const router = express.Router();


// Consultar categorías

router.get("/",getCategories);


// Crear categoría

router.post("/",
authenticateToken,
isAdmin,
createCategory
);


// Eliminar categoría

router.delete(
"/:id",

authenticateToken,

isAdmin,

deleteCategory

);

module.exports = router;
