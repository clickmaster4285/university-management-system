// backend/src/controllers/employeeController.js
import Employee from '../models/Employee.js';

export const getAllEmployees = async (req, res) => {
  try {
    console.log('📊 Fetching all employees...');
    const employees = await Employee.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${employees.length} employees`);
    
    res.status(200).json({
      success: true,
      data: employees,
      count: employees.length
    });
  } catch (error) {
    console.error('❌ Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
      error: error.message
    });
  }
};

export const createEmployee = async (req, res) => {
  try {
    console.log('📝 Creating new employee:', req.body);
    const employee = new Employee(req.body);
    await employee.save();
    console.log('✅ Employee created:', employee.employeeId);
    
    res.status(201).json({
      success: true,
      data: employee,
      message: 'Employee created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating employee:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: error.message
    });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    res.status(200).json({
      success: true,
      data: employee,
      message: 'Employee updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message
    });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee',
      error: error.message
    });
  }
};

export const getEmployeeStats = async (req, res) => {
  try {
    const total = await Employee.countDocuments();
    const active = await Employee.countDocuments({ status: 'Active' });
    const onLeave = await Employee.countDocuments({ status: 'On Leave' });
    const resigned = await Employee.countDocuments({ status: 'Resigned' });
    const terminated = await Employee.countDocuments({ status: 'Terminated' });
    const onProbation = await Employee.countDocuments({ status: 'On Probation' });
    
    const byDepartment = await Employee.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
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
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
};