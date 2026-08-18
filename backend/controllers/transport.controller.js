import mongoose from 'mongoose';
import Bus from '../models/Bus.js';
import Driver from '../models/Driver.js';
import Route from '../models/Route.js';

const getTrimmedValue = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  return String(value).trim();
};

const isMissingRequiredValue = (value) => getTrimmedValue(value) === '';

const isInvalidNumber = (value) => {
  if (value === undefined || value === null || value === '') return true;
  const numericValue = Number(value);
  return Number.isNaN(numericValue);
};

const getAuditUserId = (userId) => {
  if (!userId) return undefined;
  return mongoose.Types.ObjectId.isValid(userId) ? userId : undefined;
};

// ============ BUS CONTROLLERS ============

// Get all buses
export const getAllBuses = async (req, res) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    if (search) {
      query.$or = [
        { busNumber: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } },
        { driverName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [buses, total] = await Promise.all([
      Bus.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('routeId', 'routeNumber name'),
      Bus.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: buses || [],
      pagination: {
        total: total || 0,
        page: parseInt(page) || 1,
        pages: Math.ceil((total || 0) / parseInt(limit)) || 0,
        limit: parseInt(limit) || 50
      }
    });
  } catch (error) {
    console.error('Error fetching buses:', error);
    res.json({
      success: false,
      data: [],
      message: error.message || 'Failed to fetch buses'
    });
  }
};

// Get bus by ID
export const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id).populate('routeId', 'routeNumber name');
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }
    res.json({ success: true, data: bus });
  } catch (error) {
    console.error('Error fetching bus:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bus' });
  }
};

// Create bus
export const createBus = async (req, res) => {
  try {
    
    // Validate required fields
    const requiredFields = ['busNumber', 'registrationNumber', 'model', 'make', 'year', 'capacity'];
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      if (['year', 'capacity'].includes(field)) {
        return isMissingRequiredValue(value) || isInvalidNumber(value);
      }
      return isMissingRequiredValue(value);
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Check for duplicate bus number
    const existingBus = await Bus.findOne({ busNumber: req.body.busNumber });
    if (existingBus) {
      return res.status(400).json({
        success: false,
        message: `Bus number "${req.body.busNumber}" already exists`
      });
    }

    // Check for duplicate registration number
    const existingReg = await Bus.findOne({ registrationNumber: req.body.registrationNumber });
    if (existingReg) {
      return res.status(400).json({
        success: false,
        message: `Registration number "${req.body.registrationNumber}" already exists`
      });
    }

    // Prepare bus data with proper types
    const year = Number(req.body.year);
    const capacity = Number(req.body.capacity);
    const fuelLevel = Number(req.body.fuelLevel);
    const fuelConsumption = Number(req.body.fuelConsumption);

    const busData = {
      busNumber: getTrimmedValue(req.body.busNumber),
      registrationNumber: getTrimmedValue(req.body.registrationNumber),
      model: getTrimmedValue(req.body.model),
      make: getTrimmedValue(req.body.make),
      year: Number.isFinite(year) ? year : new Date().getFullYear(),
      capacity: Number.isFinite(capacity) ? capacity : 40,
      fuelType: getTrimmedValue(req.body.fuelType) || 'Diesel',
      routeName: getTrimmedValue(req.body.routeName) || '',
      driverName: getTrimmedValue(req.body.driverName) || '',
      status: getTrimmedValue(req.body.status) || 'Active',
      fuelLevel: Number.isFinite(fuelLevel) ? fuelLevel : 100,
      fuelConsumption: Number.isFinite(fuelConsumption) ? fuelConsumption : 0,
      createdBy: getAuditUserId(req.user?.id)
    };


    const bus = new Bus(busData);
    await bus.save();
    
    
    res.status(201).json({ 
      success: true, 
      data: bus,
      message: `Bus created successfully. ID: ${bus.busId}`
    });
  } catch (error) {
    console.error('❌ Error creating bus:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create bus',
      error: error.message
    });
  }
};

// Update bus
export const updateBus = async (req, res) => {
  try {
    
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    // Check for duplicate bus number (excluding current)
    if (req.body.busNumber && req.body.busNumber !== bus.busNumber) {
      const existingBus = await Bus.findOne({ busNumber: req.body.busNumber });
      if (existingBus) {
        return res.status(400).json({
          success: false,
          message: `Bus number "${req.body.busNumber}" already exists`
        });
      }
    }

    // Check for duplicate registration number (excluding current)
    if (req.body.registrationNumber && req.body.registrationNumber !== bus.registrationNumber) {
      const existingReg = await Bus.findOne({ registrationNumber: req.body.registrationNumber });
      if (existingReg) {
        return res.status(400).json({
          success: false,
          message: `Registration number "${req.body.registrationNumber}" already exists`
        });
      }
    }

    const updateableFields = [
      'busNumber', 'registrationNumber', 'model', 'make', 'year', 'capacity',
      'fuelType', 'routeId', 'routeName', 'driverId', 'driverName',
      'status', 'isActive', 'fuelLevel', 'fuelConsumption'
    ];
    
    updateableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'year' || field === 'capacity' || field === 'fuelLevel' || field === 'fuelConsumption') {
          bus[field] = parseFloat(req.body[field]) || 0;
        } else {
          bus[field] = req.body[field];
        }
      }
    });

    bus.updatedBy = getAuditUserId(req.user?.id);
    await bus.save();
    
    
    res.json({ success: true, data: bus, message: 'Bus updated successfully' });
  } catch (error) {
    console.error('Error updating bus:', error);
    res.status(500).json({ success: false, message: 'Failed to update bus' });
  }
};

// Delete bus
export const deleteBus = async (req, res) => {
  try {
    
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }
    await bus.deleteOne();
    res.json({ success: true, message: 'Bus deleted successfully' });
  } catch (error) {
    console.error('Error deleting bus:', error);
    res.status(500).json({ success: false, message: 'Failed to delete bus' });
  }
};

// ============ DRIVER CONTROLLERS ============

// Get all drivers
export const getAllDrivers = async (req, res) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [drivers, total] = await Promise.all([
      Driver.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('assignedBusId', 'busNumber registrationNumber'),
      Driver.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: drivers || [],
      pagination: {
        total: total || 0,
        page: parseInt(page) || 1,
        pages: Math.ceil((total || 0) / parseInt(limit)) || 0,
        limit: parseInt(limit) || 50
      }
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.json({
      success: false,
      data: [],
      message: error.message || 'Failed to fetch drivers'
    });
  }
};

// Create driver
export const createDriver = async (req, res) => {
  try {
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'licenseNumber', 'licenseExpiry'];
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      if (field === 'licenseExpiry') {
        return isMissingRequiredValue(value) || Number.isNaN(new Date(value).getTime());
      }
      return isMissingRequiredValue(value);
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Check for duplicate email
    const existingEmail = await Driver.findOne({ email: req.body.email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: `Email "${req.body.email}" already exists`
      });
    }

    // Check for duplicate license number
    const existingLicense = await Driver.findOne({ licenseNumber: req.body.licenseNumber });
    if (existingLicense) {
      return res.status(400).json({
        success: false,
        message: `License number "${req.body.licenseNumber}" already exists`
      });
    }

    // Check for duplicate phone
    const existingPhone = await Driver.findOne({ phone: req.body.phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: `Phone number "${req.body.phone}" already exists`
      });
    }

    // Prepare driver data with proper types
    const salary = Number(req.body.salary);
    const experienceYears = Number(req.body.experienceYears);

    const driverData = {
      name: getTrimmedValue(req.body.name),
      email: getTrimmedValue(req.body.email).toLowerCase(),
      phone: getTrimmedValue(req.body.phone),
      address: getTrimmedValue(req.body.address) || '',
      licenseNumber: getTrimmedValue(req.body.licenseNumber),
      licenseExpiry: new Date(req.body.licenseExpiry),
      licenseClass: getTrimmedValue(req.body.licenseClass) || 'C',
      hireDate: req.body.hireDate ? new Date(req.body.hireDate) : new Date(),
      employmentStatus: getTrimmedValue(req.body.employmentStatus) || 'Active',
      salary: Number.isFinite(salary) ? salary : 0,
      experienceYears: Number.isFinite(experienceYears) ? experienceYears : 0,
      assignedBusNumber: getTrimmedValue(req.body.assignedBusNumber) || '',
      status: getTrimmedValue(req.body.status) || 'Available',
      createdBy: getAuditUserId(req.user?.id)
    };


    const driver = new Driver(driverData);
    await driver.save();
    
    
    res.status(201).json({ 
      success: true, 
      data: driver,
      message: `Driver created successfully. ID: ${driver.driverId}`
    });
  } catch (error) {
    console.error('❌ Error creating driver:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create driver',
      error: error.message
    });
  }
};

// Update driver
export const updateDriver = async (req, res) => {
  try {
    
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // Check for duplicate email (excluding current)
    if (req.body.email && req.body.email !== driver.email) {
      const existingEmail = await Driver.findOne({ email: req.body.email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: `Email "${req.body.email}" already exists`
        });
      }
    }

    // Check for duplicate license number (excluding current)
    if (req.body.licenseNumber && req.body.licenseNumber !== driver.licenseNumber) {
      const existingLicense = await Driver.findOne({ licenseNumber: req.body.licenseNumber });
      if (existingLicense) {
        return res.status(400).json({
          success: false,
          message: `License number "${req.body.licenseNumber}" already exists`
        });
      }
    }

    // Check for duplicate phone (excluding current)
    if (req.body.phone && req.body.phone !== driver.phone) {
      const existingPhone = await Driver.findOne({ phone: req.body.phone });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: `Phone number "${req.body.phone}" already exists`
        });
      }
    }

    const updateableFields = [
      'name', 'email', 'phone', 'address', 'licenseNumber', 'licenseExpiry',
      'licenseClass', 'hireDate', 'employmentStatus', 'salary', 'experienceYears',
      'previousEmployer', 'assignedBusId', 'assignedBusNumber', 'status', 'isActive'
    ];
    
    updateableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'salary' || field === 'experienceYears') {
          driver[field] = parseFloat(req.body[field]) || 0;
        } else if (field === 'licenseExpiry' || field === 'hireDate') {
          driver[field] = new Date(req.body[field]);
        } else {
          driver[field] = req.body[field];
        }
      }
    });

    driver.updatedBy = getAuditUserId(req.user?.id);
    await driver.save();
    
    
    res.json({ success: true, data: driver, message: 'Driver updated successfully' });
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ success: false, message: 'Failed to update driver' });
  }
};

// Delete driver
export const deleteDriver = async (req, res) => {
  try {
    
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    await driver.deleteOne();
    res.json({ success: true, message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ success: false, message: 'Failed to delete driver' });
  }
};

// ============ ROUTE CONTROLLERS ============

// Get all routes
export const getAllRoutes = async (req, res) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    if (search) {
      query.$or = [
        { routeNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { startPoint: { $regex: search, $options: 'i' } },
        { endPoint: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [routes, total] = await Promise.all([
      Route.find(query)
        .sort({ routeNumber: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('assignedBusIds', 'busNumber registrationNumber'),
      Route.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: routes || [],
      pagination: {
        total: total || 0,
        page: parseInt(page) || 1,
        pages: Math.ceil((total || 0) / parseInt(limit)) || 0,
        limit: parseInt(limit) || 50
      }
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.json({
      success: false,
      data: [],
      message: error.message || 'Failed to fetch routes'
    });
  }
};

// Create route
export const createRoute = async (req, res) => {
  try {
    
    // Validate required fields
    const requiredFields = ['routeNumber', 'name', 'startPoint', 'endPoint', 'distance', 'duration', 'baseFare'];
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      if (['distance', 'duration', 'baseFare'].includes(field)) {
        return isMissingRequiredValue(value) || isInvalidNumber(value);
      }
      return isMissingRequiredValue(value);
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Check for duplicate route number
    const existingRoute = await Route.findOne({ routeNumber: req.body.routeNumber });
    if (existingRoute) {
      return res.status(400).json({
        success: false,
        message: `Route number "${req.body.routeNumber}" already exists`
      });
    }

    // Prepare route data with proper types
    const distance = Number(req.body.distance);
    const duration = Number(req.body.duration);
    const baseFare = Number(req.body.baseFare);
    const farePerKm = Number(req.body.farePerKm);

    const routeData = {
      routeNumber: getTrimmedValue(req.body.routeNumber),
      name: getTrimmedValue(req.body.name),
      description: getTrimmedValue(req.body.description) || '',
      startPoint: getTrimmedValue(req.body.startPoint),
      endPoint: getTrimmedValue(req.body.endPoint),
      distance: Number.isFinite(distance) ? distance : 0,
      duration: Number.isFinite(duration) ? duration : 0,
      baseFare: Number.isFinite(baseFare) ? baseFare : 50,
      farePerKm: Number.isFinite(farePerKm) ? farePerKm : 10,
      routeType: getTrimmedValue(req.body.routeType) || 'Campus',
      status: getTrimmedValue(req.body.status) || 'Active',
      createdBy: getAuditUserId(req.user?.id)
    };


    const route = new Route(routeData);
    await route.save();
    
    
    res.status(201).json({ 
      success: true, 
      data: route,
      message: `Route created successfully. ID: ${route.routeId}`
    });
  } catch (error) {
    console.error('❌ Error creating route:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create route',
      error: error.message
    });
  }
};

// Update route
export const updateRoute = async (req, res) => {
  try {
    
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    // Check for duplicate route number (excluding current)
    if (req.body.routeNumber && req.body.routeNumber !== route.routeNumber) {
      const existingRoute = await Route.findOne({ routeNumber: req.body.routeNumber });
      if (existingRoute) {
        return res.status(400).json({
          success: false,
          message: `Route number "${req.body.routeNumber}" already exists`
        });
      }
    }

    const updateableFields = [
      'routeNumber', 'name', 'description', 'startPoint', 'endPoint',
      'distance', 'duration', 'stops', 'departureTimes', 'assignedBusIds',
      'assignedBusNumbers', 'assignedDriverIds', 'baseFare', 'farePerKm',
      'status', 'isActive', 'routeType'
    ];
    
    updateableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'distance' || field === 'duration' || field === 'baseFare' || field === 'farePerKm') {
          route[field] = parseFloat(req.body[field]) || 0;
        } else {
          route[field] = req.body[field];
        }
      }
    });

    route.updatedBy = getAuditUserId(req.user?.id);
    await route.save();
    
    
    res.json({ success: true, data: route, message: 'Route updated successfully' });
  } catch (error) {
    console.error('Error updating route:', error);
    res.status(500).json({ success: false, message: 'Failed to update route' });
  }
};

// Delete route
export const deleteRoute = async (req, res) => {
  try {
    
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }
    await route.deleteOne();
    res.json({ success: true, message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ success: false, message: 'Failed to delete route' });
  }
};

// ============ STATISTICS ============

export const getTransportStats = async (req, res) => {
  try {
    const totalBuses = await Bus.countDocuments() || 0;
    const activeBuses = await Bus.countDocuments({ status: 'Active' }) || 0;
    const busesOnRoute = await Bus.countDocuments({ status: 'On Route' }) || 0;
    const busesMaintenance = await Bus.countDocuments({ status: 'Maintenance' }) || 0;

    const totalDrivers = await Driver.countDocuments() || 0;
    const availableDrivers = await Driver.countDocuments({ status: 'Available' }) || 0;
    const driversOnRoute = await Driver.countDocuments({ status: 'On Route' }) || 0;

    const totalRoutes = await Route.countDocuments() || 0;
    const activeRoutes = await Route.countDocuments({ status: 'Active' }) || 0;

    const totalRiders = 1580;

    res.json({
      success: true,
      data: {
        buses: { total: totalBuses, active: activeBuses, onRoute: busesOnRoute, maintenance: busesMaintenance },
        drivers: { total: totalDrivers, available: availableDrivers, onRoute: driversOnRoute },
        routes: { total: totalRoutes, active: activeRoutes },
        riders: totalRiders
      }
    });
  } catch (error) {
    console.error('Error fetching transport stats:', error);
    res.json({
      success: false,
      data: {
        buses: { total: 0, active: 0, onRoute: 0, maintenance: 0 },
        drivers: { total: 0, available: 0, onRoute: 0 },
        routes: { total: 0, active: 0 },
        riders: 0
      },
      message: error.message || 'Failed to fetch statistics'
    });
  }
};