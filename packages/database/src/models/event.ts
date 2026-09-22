import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const eventSchema = new Schema(
  {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },
    type: { type: String, required: true },
    severity: {
      type: String,
      enum: ["info", "warning", "error", "critical"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    occurredAt: { type: Date, required: true },
    metadata: { type: Schema.Types.Mixed },
    reportedByAgent: { type: Boolean, default: true },
  },
  { timestamps: false }
);

eventSchema.index({ deviceId: 1, occurredAt: -1 });

export type EventDoc = InferSchemaType<typeof eventSchema> & {
  _id: Schema.Types.ObjectId;
};

export const EventModel: Model<EventDoc> =
  (models.SystemEvent as Model<EventDoc> | undefined) ??
  model<EventDoc>("SystemEvent", eventSchema);
