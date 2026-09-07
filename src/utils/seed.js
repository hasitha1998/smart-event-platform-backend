import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Event from "../models/Event.js";

const sampleEvents = [
  {
    title: "React Summit",
    description: "A conference dedicated to React and the ecosystem around it.",
    category: "Conference",
    date: new Date("2026-11-12"),
    location: { city: "Amsterdam", country: "Netherlands" },
    isOnline: false,
    tags: ["react", "frontend", "javascript"],
    capacity: 2000,
    isCustom: false,
  },
  {
    title: "Node.js Meetup Colombo",
    description: "Monthly meetup for backend developers working with Node.js.",
    category: "Meetup",
    date: new Date("2026-10-05"),
    location: { city: "Colombo", country: "Sri Lanka" },
    isOnline: false,
    tags: ["nodejs", "backend"],
    capacity: 80,
    isCustom: false,
  },
  {
    title: "Global AI Hackathon",
    description: "48-hour hackathon building applied AI products.",
    category: "Hackathon",
    date: new Date("2026-12-01"),
    location: { city: "Online", country: "Online" },
    isOnline: true,
    tags: ["ai", "hackathon"],
    capacity: 500,
    isCustom: false,
  },
  {
    title: "MongoDB Webinar: Schema Design",
    description: "Live webinar on schema design patterns for MongoDB.",
    category: "Webinar",
    date: new Date("2026-09-20"),
    location: { city: "Online", country: "Online" },
    isOnline: true,
    tags: ["mongodb", "database"],
    capacity: 1000,
    isCustom: false,
  },
  {
    title: "Tailwind CSS Workshop",
    description: "Hands-on workshop covering utility-first CSS with Tailwind.",
    category: "Workshop",
    date: new Date("2026-10-18"),
    location: { city: "London", country: "United Kingdom" },
    isOnline: false,
    tags: ["css", "tailwind", "frontend"],
    capacity: 60,
    isCustom: false,
  },
];

const run = async () => {
  await connectDB();

  let system = await User.findOne({ email: "system@eventplatform.dev" });
  if (!system) {
    system = await User.create({
      name: "Event Platform",
      email: "system@eventplatform.dev",
      password: "system-generated-1",
    });
  }

  await Event.deleteMany({ isCustom: false });
  await Event.insertMany(sampleEvents.map((e) => ({ ...e, organizer: system._id })));

  console.log(`Seeded ${sampleEvents.length} sample events.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
