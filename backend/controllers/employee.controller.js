// backend/src/controllers/employeeController.js
import { handle } from "../utils/asyncHandler.js";

import { Employee } from "../models/index.js";
export const getAllEmployees = handle(async (req, res) => {
  const employees = await Employee.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
  
  return res.status(200).json({
    success: true,
    data: employees,
    count: employees.length
  });
});

export const getEmployeeById = handle(async (req, res) => {
  const employee = await Employee.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }
  return res.status(200).json({
    success: true,
    data: employee
  });
});

export const createEmployee = handle(async (req, res) => {
  const employee = new Employee(req.body);
  await employee.save();
  
  return res.status(201).json({
    success: true,
    data: employee,
    message: 'Employee created successfully'
  });
});

export const updateEmployee = handle(async (req, res) => {
  const updates = { ...req.body };
  delete updates.isDeleted;
  delete updates.deletedAt;
  delete updates.deletedBy;
  delete updates._id;
  delete updates.createdAt;
  delete updates.updatedAt;

  const employee = await Employee.findOneAndUpdate(
    { _id: req.params.id, isDeleted: { $ne: true } },
    updates,
    { new: true, runValidators: true }
  );
  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }
  return res.status(200).json({
    success: true,
    data: employee,
    message: 'Employee updated successfully'
  });
});

export const deleteEmployee = handle(async (req, res) => {
  const employee = await Employee.findByIdAndDelete(req.params.id);
  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }
  return res.status(200).json({
    success: true,
    message: 'Employee deleted successfully'
  });
});

export const getEmployeeStats = handle(async (req, res) => {
  const total = await Employee.countDocuments({ isDeleted: { $ne: true } });
  const active = await Employee.countDocuments({ status: 'Active', isDeleted: { $ne: true } });
  const onLeave = await Employee.countDocuments({ status: 'On Leave', isDeleted: { $ne: true } });
  const resigned = await Employee.countDocuments({ status: 'Resigned', isDeleted: { $ne: true } });
  const terminated = await Employee.countDocuments({ status: 'Terminated', isDeleted: { $ne: true } });
  const onProbation = await Employee.countDocuments({ status: 'On Probation', isDeleted: { $ne: true } });
  
  const byDepartment = await Employee.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: '$department', count: { $sum: 1 } } }
  ]);

  return res.status(200).json({
    success: true,
    data: {
      total,
      active,
      onLeave,
      resigned,
      terminated,
      onProbation,
      byDepartment
    }
  });
});
