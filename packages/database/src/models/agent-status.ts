import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const agentStatusSchema = new Schema(
  {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      required: true,
      unique: true,
    },
    agentVersion: { type: String, required: true },
    connected: { type: Boolean, default: false },
    lastHeartbeatAt: { type: Date, default: null },
    telemetryActive: { type: Boolean, default: false },
    queueSize: { type: Number, default: 0 },
    failedUploads: { type: Number, default: 0 },
    lastSyncAt: { type: Date, default: null },
    collectors: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

export type AgentStatusDoc = InferSchemaType<typeof agentStatusSchema> & {
  _id: Schema.Types.ObjectId;
};

export const AgentStatusModel: Model<AgentStatusDoc> =
  (models.AgentStatus as Model<AgentStatusDoc> | undefined) ??
  model<AgentStatusDoc>("AgentStatus", agentStatusSchema);
