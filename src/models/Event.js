import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["Conference", "Meetup", "Hackathon", "Webinar", "Workshop", "Other"],
      default: "Other",
    },
    date: { type: Date, required: true },
    location: {
      city: { type: String, required: true },
      country: { type: String, required: true },
      // Cached lat/lon so we don't re-geocode on every detail view
      lat: { type: Number },
      lon: { type: Number },
    },
    isOnline: { type: Boolean, default: false },
    tags: [{ type: String, trim: true }],
    capacity: { type: Number, default: 0 },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isCustom: { type: Boolean, default: true }, // false = seeded/sample event
  },
  { timestamps: true }
);

eventSchema.index({ title: "text", description: "text", tags: "text" });

export default mongoose.model("Event", eventSchema);
