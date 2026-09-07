import { Router } from "express";
import {
  getEvents,
  getEventById,
  getEventWeather,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleBookmark,
  getMyBookmarks,
} from "../controllers/eventController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/", getEvents);
router.get("/bookmarks/me", protect, getMyBookmarks);
router.get("/:id", getEventById);
router.get("/:id/weather", getEventWeather);
router.post("/", protect, createEvent);
router.put("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);
router.post("/:id/bookmark", protect, toggleBookmark);

export default router;
