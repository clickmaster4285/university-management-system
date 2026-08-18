// backend/src/routes/hr.routes.js
import express from 'express';
import * as employeeController from '../controllers/employee.controller.js';
import * as leaveController from '../controllers/leave.controller.js';

const router = express.Router();

// ==================== EMPLOYEE ROUTES ====================
router.get('/employees', employeeController.getAllEmployees);
router.get('/employees/stats', employeeController.getEmployeeStats);
router.get('/employees/:id', employeeController.getEmployeeById);
router.post('/employees', employeeController.createEmployee);
router.put('/employees/:id', employeeController.updateEmployee);
router.delete('/employees/:id', employeeController.deleteEmployee);

// ==================== LEAVE ROUTES ====================
router.get('/leaves', leaveController.getAllLeaves);
router.get('/leaves/stats', leaveController.getLeaveStats);
router.get('/leaves/employees-on-leave', leaveController.getEmployeesOnLeave);
router.get('/leaves/:id', leaveController.getLeaveById);
router.post('/leaves', leaveController.createLeave);
router.put('/leaves/:id', leaveController.updateLeave);
router.put('/leaves/:id/status', leaveController.updateLeaveStatus);
router.delete('/leaves/:id', leaveController.deleteLeave);

// ==================== ADMIN ROUTES ====================
router.post('/leaves/daily-update', leaveController.dailyStatusUpdate);

export default router;