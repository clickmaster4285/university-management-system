// backend/src/controllers/leaveController.js
import Leave from '../models/hr/Leave.js';
import Employee from '../models/hr/Employee.js';

// Helper function to update employee status based on active leaves
const updateEmployeeStatus = async (employeeId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeLeaves = await Leave.find({
      employee: employeeId,
      status: 'Approved',
      startDate: { $lte: today },
      endDate: { $gte: today }
    });
    
    const employee = await Employee.findById(employeeId);
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
      endDate: { $gte: today }
    });
    
    const allEmployees = await Employee.find({
      status: { $nin: ['Resigned', 'Terminated'] }
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

export const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: leaves,
      count: leaves.length
    });
  } catch (error) {
    console.error('❌ Error fetching leaves:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaves',
      error: error.message
    });
  }
};

export const getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }
    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave',
      error: error.message
    });
  }
};

export const createLeave = async (req, res) => {
  try {
    const leave = new Leave(req.body);
    await leave.save();
    
    if (leave.status === 'Approved') {
      await updateEmployeeStatus(leave.employee);
    }
    
    res.status(201).json({
      success: true,
      data: leave,
      message: 'Leave request submitted successfully'
    });
  } catch (error) {
    console.error('❌ Error creating leave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create leave request',
      error: error.message
    });
  }
};

export const updateLeave = async (req, res) => {
  try {
    const { id } = req.params;
    
    const leave = await Leave.findByIdAndUpdate(
      id,
      req.body,
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
    
    
    res.status(200).json({
      success: true,
      data: leave,
      message: 'Leave request updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating leave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leave request',
      error: error.message
    });
  }
};

export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    
    const leave = await Leave.findByIdAndUpdate(
      id,
      { 
        status,
        approvedDate: status === 'Approved' ? new Date() : undefined
      },
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
    
    
    res.status(200).json({
      success: true,
      data: leave,
      message: `Leave ${status.toLowerCase()} successfully`
    });
  } catch (error) {
    console.error('❌ Error updating leave status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leave status',
      error: error.message
    });
  }
};

export const deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }
    
    await updateEmployeeStatus(leave.employee);
    
    res.status(200).json({
      success: true,
      message: 'Leave request deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete leave request',
      error: error.message
    });
  }
};

export const getLeaveStats = async (req, res) => {
  try {
    const pending = await Leave.countDocuments({ status: 'Pending' });
    const approved = await Leave.countDocuments({ status: 'Approved' });
    const rejected = await Leave.countDocuments({ status: 'Rejected' });
    const cancelled = await Leave.countDocuments({ status: 'Cancelled' });
    
    const byType = await Leave.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        pending,
        approved,
        rejected,
        cancelled,
        byType
      }
    });
  } catch (error) {
    console.error('❌ Error fetching leave stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave stats',
      error: error.message
    });
  }
};

export const getEmployeesOnLeave = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const employeesOnLeave = await Leave.find({
      status: 'Approved',
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).populate('employee', 'firstName lastName email department');
    
    res.status(200).json({
      success: true,
      data: employeesOnLeave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees on leave',
      error: error.message
    });
  }
};

export const dailyStatusUpdate = async (req, res) => {
  try {
    const updated = await updateAllEmployeeStatuses();
    res.status(200).json({
      success: true,
      message: 'Employee statuses updated successfully',
      updatedCount: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update employee statuses',
      error: error.message
    });
  }
};