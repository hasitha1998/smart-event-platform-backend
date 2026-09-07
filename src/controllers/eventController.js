import Event from "../models/Event.js";
import User from "../models/User.js";
import { geocodeCity, getWeatherForCoords } from "../utils/weatherApi.js";

// @route GET /api/events
// Supports: ?search=&category=&city=&isOnline=&from=&to=&page=&limit=
export const getEvents = async (req, res, next) => {
  try {
    const { search, category, city, isOnline, from, to, page = 1, limit = 9 } = req.query;
    const query = {};

    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (city) query["location.city"] = new RegExp(city, "i");
    if (isOnline !== undefined) query.isOnline = isOnline === "true";
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [events, total] = await Promise.all([
      Event.find(query).sort({ date: 1 }).skip(skip).limit(Number(limit)),
      Event.countDocuments(query),
    ]);

    res.json({
      events,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/events/:id
export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate("organizer", "name email");
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    next(err);
  }
};

// @route GET /api/events/:id/weather
// Enriches an event with live weather for its location (external API integration).
export const getEventWeather = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.isOnline) {
      return res.status(400).json({ message: "Online events have no physical weather" });
    }

    let { lat, lon } = event.location;

    if (!lat || !lon) {
      const geo = await geocodeCity(event.location.city, event.location.country);
      if (!geo) return res.status(404).json({ message: "Could not resolve event location" });
      lat = geo.lat;
      lon = geo.lon;
      event.location.lat = lat;
      event.location.lon = lon;
      await event.save();
    }

    const weather = await getWeatherForCoords(lat, lon);
    res.json({ location: event.location, weather });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/events
export const createEvent = async (req, res, next) => {
  try {
    const { title, description, category, date, location, isOnline, tags, capacity } = req.body;

    if (!title || !description || !date || (!isOnline && !location?.city)) {
      return res.status(400).json({ message: "Missing required event fields" });
    }

    const event = await Event.create({
      title,
      description,
      category,
      date,
      location,
      isOnline,
      tags,
      capacity,
      organizer: req.user._id,
      isCustom: true,
    });

    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/events/:id
export const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this event" });
    }

    Object.assign(event, req.body);
    await event.save();
    res.json(event);
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/events/:id
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this event" });
    }

    await event.deleteOne();
    res.json({ message: "Event deleted" });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/events/:id/bookmark
export const toggleBookmark = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const user = await User.findById(req.user._id);
    const idx = user.bookmarks.findIndex((b) => b.toString() === event._id.toString());

    let bookmarked;
    if (idx === -1) {
      user.bookmarks.push(event._id);
      bookmarked = true;
    } else {
      user.bookmarks.splice(idx, 1);
      bookmarked = false;
    }

    await user.save();
    res.json({ bookmarked, bookmarks: user.bookmarks });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/events/bookmarks/me
export const getMyBookmarks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("bookmarks");
    res.json(user.bookmarks);
  } catch (err) {
    next(err);
  }
};
