const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");

const {register,login} = require("../controllers/authController");

const router = express.Router();

// REGISTRO

router.post(
"/registro",
register
);

// LOGIN

router.post(
"/login",
login
);


// PERFIL PROTEGIDO

router.get(
  "/perfil",

  authenticateToken,

  (
    req,
    res
  ) => {

    res.json({

      message:
        "Ruta protegida",

      user:
        req.user

    });

  }
);

module.exports =
router;
