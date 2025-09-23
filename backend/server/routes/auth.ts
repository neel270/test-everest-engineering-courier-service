import express from 'express';
import { UserController } from '../controllers/UserController';
import { auth } from '../middleware/auth';

const router = express.Router();

// POST /api/auth/register
router.post('/register', UserController.registerUser);

// POST /api/auth/login
router.post('/login', UserController.loginUser);

// GET /api/auth/profile
router.get('/profile', auth, UserController.getUserProfile);

// GET /api/auth/users
router.get('/users', auth, UserController.getAllUsers);

// GET /api/auth/users/:id
router.get('/users/:id', auth, UserController.getUserById);

// PUT /api/auth/users/:id
router.put('/users/:id', auth, UserController.updateUser);

// DELETE /api/auth/users/:id
router.delete('/users/:id', auth, UserController.deleteUser);

// PUT /api/auth/change-password
router.put('/change-password', auth, UserController.changePassword);

// PUT /api/auth/users/:id/status
router.put('/users/:id/status', auth, UserController.toggleUserStatus);

// GET /api/auth/users/role/:role
router.get('/users/role/:role', auth, UserController.getUsersByRole);

export default router;