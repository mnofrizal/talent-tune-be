import express from "express";
import { userController } from "../../controllers/userController.js";
import { protect, authorize } from "../../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes accessible by both ADMINISTRATOR and USER
router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);

// Routes accessible only by ADMINISTRATOR
router.post("/", authorize("ADMINISTRATOR"), userController.createUser);
router.put("/:id", authorize("ADMINISTRATOR"), userController.updateUser);
router.delete("/:id", authorize("ADMINISTRATOR"), userController.deleteUser);

export const userRoutes = router;
