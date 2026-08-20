import mongoose from 'mongoose';
import Event from '../models/communication/Event.js';

const getTrimmedValue = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  return String(value).trim();
};

const isMissingRequiredValue = (value) => getTrimmedValue(value) === '';

const getAuditUserId = (userId) => {
  if (!userId) return undefined;
  return mongoose.Types.ObjectId.isValid(userId) ? userId : undefined;
};

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map(item => getTrimmedValue(item)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map(item => getTrimmedValue(item)).filter(Boolean);
  }

  return [];
};

// Get all events with filtering
export const getAllEvents = async (req, res) => {
  try {
    const { 
      type, 
      status, 
      category,
      campus,
      search,
      fromDate,
      toDate,
      isFeatured,
      limit = 50, 
      page = 1 
    } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (category) query.category = category;
    if (campus) query.campus = campus;
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
    if (fromDate || toDate) {
      query.startDate = {};
      if (fromDate) query.startDate.$gte = new Date(fromDate);
      if (toDate) query.startDate.$lte = new Date(toDate);
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let findQuery = Event.find(query);
    if (search) {
      findQuery = findQuery.sort({ score: { $meta: 'textScore' } });
    } else {
      findQuery = findQuery.sort({ startDate: 1 });
    }
    
    const [events, total] = await Promise.all([
      findQuery.skip(skip).limit(parseInt(limit)).populate('createdBy', 'name email'),
      Event.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: events || [],
      pagination: {
        total: total || 0,
        page: parseInt(page) || 1,
        pages: Math.ceil((total || 0) / parseInt(limit)) || 0,
        limit: parseInt(limit) || 50
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.json({
      success: false,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        pages: 0,
        limit: 50
      },
      message: error.message || 'Failed to fetch events'
    });
  }
};

// Get single event by ID
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found',
        data: null
      });
    }
    
    res.json({ 
      success: true, 
      data: event 
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch event',
      error: error.message,
      data: null
    });
  }
};

// Create new event
export const createEvent = async (req, res) => {
  try {
    
    const requiredFields = ['title', 'description', 'type', 'category', 'startDate', 'endDate', 'startTime', 'endTime', 'venue', 'campus', 'organizer', 'capacity'];
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      if (field === 'capacity') {
        return isMissingRequiredValue(value) || Number.isNaN(Number(value));
      }
      return isMissingRequiredValue(value);
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        data: null
      });
    }

    const auditUserId = getAuditUserId(req.user?.id || req.user?.userId || req.userId);

    const eventData = {
      title: getTrimmedValue(req.body.title),
      description: getTrimmedValue(req.body.description),
      type: getTrimmedValue(req.body.type),
      category: getTrimmedValue(req.body.category),
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      startTime: getTrimmedValue(req.body.startTime),
      endTime: getTrimmedValue(req.body.endTime),
      venue: getTrimmedValue(req.body.venue),
      address: getTrimmedValue(req.body.address),
      campus: getTrimmedValue(req.body.campus),
      organizer: getTrimmedValue(req.body.organizer),
      organizerEmail: getTrimmedValue(req.body.organizerEmail),
      organizerPhone: getTrimmedValue(req.body.organizerPhone),
      capacity: parseInt(req.body.capacity, 10) || 50,
      registeredCount: parseInt(req.body.registeredCount, 10) || 0,
      waitlistCount: parseInt(req.body.waitlistCount, 10) || 0,
      registrationDeadline: req.body.registrationDeadline ? new Date(req.body.registrationDeadline) : null,
      isRegistrationRequired: req.body.isRegistrationRequired !== undefined ? req.body.isRegistrationRequired : true,
      registrationFee: parseFloat(req.body.registrationFee) || 0,
      speakers: Array.isArray(req.body.speakers) ? req.body.speakers : [],
      schedule: Array.isArray(req.body.schedule) ? req.body.schedule : [],
      status: getTrimmedValue(req.body.status) || 'Upcoming',
      isFeatured: req.body.isFeatured === true || req.body.isFeatured === 'true',
      isPublished: req.body.isPublished !== undefined ? req.body.isPublished !== false && req.body.isPublished !== 'false' : true,
      imageUrl: getTrimmedValue(req.body.imageUrl),
      bannerImage: getTrimmedValue(req.body.bannerImage),
      gallery: Array.isArray(req.body.gallery) ? req.body.gallery : [],
      attachments: Array.isArray(req.body.attachments) ? req.body.attachments : [],
      tags: normalizeStringArray(req.body.tags),
      targetAudience: normalizeStringArray(req.body.targetAudience),
      prerequisites: getTrimmedValue(req.body.prerequisites),
      dressCode: getTrimmedValue(req.body.dressCode),
      parkingInfo: getTrimmedValue(req.body.parkingInfo),
      createdBy: auditUserId,
      updatedBy: auditUserId
    };


    const event = new Event(eventData);
    await event.save();
    
    
    res.status(201).json({ 
      success: true, 
      data: event,
      message: `Event created successfully. ID: ${event.eventId}`
    });
  } catch (error) {
    console.error('❌ Error creating event:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors,
        data: null
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create event',
      error: error.message,
      data: null
    });
  }
};

// Update event - FIXED
export const updateEvent = async (req, res) => {
  try {
    
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found',
        data: null
      });
    }

    const updateableFields = [
      'title', 'description', 'type', 'category', 'startDate', 'endDate',
      'startTime', 'endTime', 'venue', 'address', 'campus', 'organizer',
      'organizerEmail', 'organizerPhone', 'capacity', 'registeredCount',
      'waitlistCount', 'registrationDeadline', 'isRegistrationRequired',
      'registrationFee', 'speakers', 'schedule', 'status', 'isFeatured',
      'isPublished', 'imageUrl', 'bannerImage', 'gallery', 'attachments',
      'tags', 'targetAudience', 'prerequisites', 'dressCode', 'parkingInfo'
    ];
    
    let hasUpdates = false;
    
    updateableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        const value = req.body[field];
        
        // Handle numeric fields
        if (field === 'capacity' || field === 'registeredCount' || field === 'waitlistCount' || field === 'registrationFee') {
          const numValue = parseFloat(value) || 0;
          if (event[field] !== numValue) {
            event[field] = numValue;
            hasUpdates = true;
          }
        } 
        // Handle date fields - FIXED: properly handle empty values
        else if (field === 'startDate' || field === 'endDate' || field === 'registrationDeadline') {
          if (value === '' || value === null || value === undefined) {
            // If value is empty, keep the existing value (don't set to null)
            // This prevents validation errors
          } else {
            const parsedDate = new Date(value);
            if (!isNaN(parsedDate.getTime())) {
              if (event[field]?.getTime() !== parsedDate.getTime()) {
                event[field] = parsedDate;
                hasUpdates = true;
              }
            }
          }
        } 
        // Handle array fields
        else if (field === 'speakers' || field === 'schedule' || field === 'gallery' || field === 'attachments' || field === 'tags' || field === 'targetAudience') {
          const arrayValue = Array.isArray(value) ? value : [];
          if (JSON.stringify(event[field] || []) !== JSON.stringify(arrayValue)) {
            event[field] = arrayValue;
            hasUpdates = true;
          }
        } 
        // Handle boolean fields
        else if (field === 'isRegistrationRequired' || field === 'isFeatured' || field === 'isPublished') {
          const boolValue = value === true || value === 'true';
          if (event[field] !== boolValue) {
            event[field] = boolValue;
            hasUpdates = true;
          }
        } 
        // Handle string fields
        else {
          const stringValue = typeof value === 'string' ? value.trim() : value;
          if (event[field] !== stringValue) {
            event[field] = stringValue;
            hasUpdates = true;
          }
        }
      }
    });

    if (!hasUpdates) {
      return res.json({ 
        success: true, 
        data: event,
        message: 'No changes detected'
      });
    }

    event.updatedBy = getAuditUserId(req.user?.id || req.user?.userId || req.userId);
    await event.save();
    
    
    res.json({ 
      success: true, 
      data: event,
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating event:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors,
        data: null
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update event',
      error: error.message,
      data: null
    });
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found'
      });
    }

    await event.deleteOne();
    
    res.json({ 
      success: true, 
      message: 'Event deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete event',
      error: error.message
    });
  }
};

// Get event statistics
export const getEventStats = async (req, res) => {
  try {
    const total = await Event.countDocuments() || 0;
    const upcoming = await Event.countDocuments({ status: 'Upcoming' }) || 0;
    const ongoing = await Event.countDocuments({ status: 'Ongoing' }) || 0;
    const completed = await Event.countDocuments({ status: 'Completed' }) || 0;
    const cancelled = await Event.countDocuments({ status: 'Cancelled' }) || 0;

    // Get events by category
    const categoryStats = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get upcoming events (next 30 days)
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setDate(nextMonth.getDate() + 30);
    
    const upcomingEvents = await Event.find({
      startDate: { $gte: now, $lte: nextMonth },
      status: { $in: ['Upcoming', 'Ongoing'] }
    }).sort({ startDate: 1 });

    res.json({
      success: true,
      data: {
        total,
        upcoming,
        ongoing,
        completed,
        cancelled,
        categories: categoryStats,
        upcomingEvents: upcomingEvents.map(e => ({
          id: e._id,
          title: e.title,
          type: e.type,
          startDate: e.startDate,
          venue: e.venue,
          registeredCount: e.registeredCount,
          capacity: e.capacity,
          daysLeft: Math.ceil((e.startDate - now) / (1000 * 60 * 60 * 24))
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    res.json({
      success: false,
      data: {
        total: 0,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        cancelled: 0,
        categories: [],
        upcomingEvents: []
      },
      message: error.message || 'Failed to fetch statistics'
    });
  }
};

// Register for event
export const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userDetails } = req.body;
    
    
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found'
      });
    }

    if (event.status !== 'Upcoming' && event.status !== 'Ongoing') {
      return res.status(400).json({
        success: false,
        message: 'Event is not accepting registrations'
      });
    }

    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Event is fully booked. You can join the waitlist.'
      });
    }

    // Check if user already registered
    // This would require a Registration model, for now we'll just increment the count
    event.registeredCount += 1;
    await event.save();

    
    res.json({ 
      success: true, 
      data: event,
      message: 'Successfully registered for event'
    });
  } catch (error) {
    console.error('❌ Error registering for event:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to register for event',
      error: error.message
    });
  }
};