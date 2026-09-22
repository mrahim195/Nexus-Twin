import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const processSnapshotSchema = new Schema(
  {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },
    collectedAt: { type: Date, required: true },
    processes: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: false }
);

processSnapshotSchema.index({ deviceId: 1, collectedAt: -1 });

export type ProcessSnapshotDoc = InferSchemaType<
  typeof processSnapshotSchema
> & { _id: Schema.Types.ObjectId };

export const ProcessSnapshotModel: Model<ProcessSnapshotDoc> =
  (models.ProcessSnapshot as Model<ProcessSnapshotDoc> | undefined) ??
  model<ProcessSnapshotDoc>("ProcessSnapshot", processSnapshotSchema);
