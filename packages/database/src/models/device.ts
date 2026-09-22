import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const deviceSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    hostname: { type: String, required: true },
    platform: {
      type: String,
      enum: ["windows", "macos", "linux", "unknown"],
      required: true,
    },
    osVersion: { type: String, required: true },
    architecture: { type: String, required: true },
    agentVersion: { type: String, required: true },
    status: {
      type: String,
      enum: ["ONLINE", "IDLE", "SLEEPING", "OFFLINE", "UNKNOWN"],
      default: "UNKNOWN",
    },
    lastHeartbeatAt: { type: Date, default: null, index: true },
    lastSeenAt: { type: Date, default: null },
    lastKnownReason: { type: String, default: null },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

deviceSchema.index({ ownerId: 1, hostname: 1 });

export type DeviceDoc = InferSchemaType<typeof deviceSchema> & {
  _id: Schema.Types.ObjectId;
};

export const DeviceModel: Model<DeviceDoc> =
  (models.Device as Model<DeviceDoc> | undefined) ??
  model<DeviceDoc>("Device", deviceSchema);
