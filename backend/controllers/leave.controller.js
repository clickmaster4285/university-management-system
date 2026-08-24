// backend/src/controllers/leaveController.js
import { handle } from "../utils/asyncHandler.js";

// Helper function to update employee status based on active leaves
import { Employee, Leave } from "../models/index.js";
const updateEmployeeStatus = async (employeeId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeLeaves = await Leave.find({
      employee: employeeId,
      status: 'Approved',
      startDate: { $lte: today },
      endDate: { $gte: today },
      isDeleted: { $ne: true }
    });
    
    const employee = await Employee.findOne({ _id: employeeId, isDeleted: { $ne: true } });
    if (!employee) return null;
    
    if (activeLeaves.length > 0) {
      if (employee.status !== 'On Leave') {
        employee.status = 'On Leave';
        await employee.save();
      }
    } else {
      if (employee.status !== 'Resigned' && employee.status !== 'Terminated') {
        if (employee.status !== 'Active') {
          employee.status = 'Active';
          await employee.save();
        }
      }
    }
    
    return employee;
  } catch (error) {
    console.error('Error updating employee status:', error);
    throw error;
  }
};

// Update all employee statuses
export const updateAllEmployeeStatuses = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const employeesOnLeave = await Leave.distinct('employee', {
      status: 'Approved',
      startDate: { $lte: today },
      endDate: { $gte: today },
      isDeleted: { $ne: true }
    });
    
    const allEmployees = await Employee.find({
      status: { $nin: ['Resigned', 'Terminated'] },
      isDeleted: { $ne: true }
    });
    
    let updatedCount = 0;
    for (const emp of allEmployees) {
      const isOnLeave = employeesOnLeave.some(id => id.toString() === emp._id.toString());
      if (isOnLeave && emp.status !== 'On Leave') {
        emp.status = 'On Leave';
        await emp.save();
        updatedCount++;
      } else if (!isOnLeave && emp.status === 'On Leave') {
        emp.status = 'Active';
        await emp.save();
        updatedCount++;
      }
    }
    
    return updatedCount;
  } catch (error) {
    console.error('Error updating all employee statuses:', error);
    throw error;
  }
};

export const getAllLeaves = handle(async (req, res) => {
  const leaves = await Leave.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
  
  return res.status(200).json({
    success: true,
    data: leaves,
    count: leaves.length
  });
});

export const getLeaveById = handle(async (req, res) => {
  const leave = await Leave.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!leave) {
    return res.status(404).json({
      success: false,
      message: 'Leave request not found'
    });
  }
  return res.status(200).json({
    success: true,
    data: leave
  });
});

export const createLeave = handle(async (req, res) => {
  const leave = new Leave(req.body);
  await leave.save();
  
  if (leave.status === 'Approved') {
    await updateEmployeeStatus(leave.employee);
  }
  
  return res.status(201).json({
    success: true,
    data: leave,
    message: 'Leave request submitted successfully'
  });
});

export const updateLeave = handle(async (req, res) => {
  const { id } = req.params;
  
  const updates = { ...req.body };
  delete updates.isDeleted;
  delete updates.deletedAt;
  delete updates.deletedBy;
  delete updates._id;
  delete updates.createdAt;
  delete updates.updatedAt;

  const leave = await Leave.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    updates,
    { new: true, runValidators: true }
  );
  
  if (!leave) {
    return res.status(404).json({
      success: false,
      message: 'Leave request not found'
    });
  }
  
  if (leave.status === 'Approved') {
    await updateEmployeeStatus(leave.employee);
  } else if (leave.status === 'Rejected' || leave.status === 'Cancelled') {
    await updateEmployeeStatus(leave.employee);
  }
  
  
  return res.status(200).json({
    success: true,
    data: leave,
    message: 'Leave request updated successfully'
  });
});

export const updateLeaveStatus = handle(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const updates = {
    status,
    approvedDate: status === 'Approved' ? new Date() : undefined
  };
  delete updates.isDeleted;
  delete updates.deletedAt;
  delete updates.deletedBy;
  delete updates._id;
  delete updates.createdAt;
  delete updates.updatedAt;

  const leave = await Leave.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    updates,
    { new: true }
  );
  
  if (!leave) {
    return res.status(404).json({
      success: false,
      message: 'Leave request not found'
    });
  }
  
  if (status === 'Approved') {
    await updateEmployeeStatus(leave.employee);
  } else if (status === 'Rejected' || status === 'Cancelled') {
    await updateEmployeeStatus(leave.employee);
  }
  
  
  return res.status(200).json({
    success: true,
    data: leave,
    message: `Leave ${status.toLowerCase()} successfully`
  });
});

export const deleteLeave = handle(async (req, res) => {
  const leave = await Leave.findByIdAndDelete(req.params.id);
  if (!leave) {
    return res.status(404).json({
      success: false,
      message: 'Leave request not found'
    });
  }
  
  await updateEmployeeStatus(leave.employee);
  
  return res.status(200).json({
    success: true,
    message: 'Leave request deleted successfully'
  });
});

export const getLeaveStats = handle(async (req, res) => {
  const pending = await Leave.countDocuments({ status: 'Pending', isDeleted: { $ne: true } });
  const approved = await Leave.countDocuments({ status: 'Approved', isDeleted: { $ne: true } });
  const rejected = await Leave.countDocuments({ status: 'Rejected', isDeleted: { $ne: true } });
  const cancelled = await Leave.countDocuments({ status: 'Cancelled', isDeleted: { $ne: true } });
  
  const byType = await Leave.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);

  return res.status(200).json({
    success: true,
    data: {
      pending,
      approved,
      rejected,
      cancelled,
      byType
    }
  });
});

export const getEmployeesOnLeave = handle(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const employeesOnLeave = await Leave.find({
    status: 'Approved',
    startDate: { $lte: today },
    endDate: { $gte: today },
    isDeleted: { $ne: true }
  }).populate('employee', 'firstName lastName email department');
  
  return res.status(200).json({
    success: true,
    data: employeesOnLeave
  });
});

export const dailyStatusUpdate = handle(async (req, res) => {
  const updated = await updateAllEmployeeStatuses();
  return res.status(200).json({
    success: true,
    message: 'Employee statuses updated successfully',
    updatedCount: updated
  });
});
