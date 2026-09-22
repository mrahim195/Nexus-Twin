import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const metricSnapshotSchema = new Schema(
  {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },
    collectedAt: { type: Date, required: true },
    cpu: { type: Schema.Types.Mixed, required: true },
    memory: { type: Schema.Types.Mixed, required: true },
    disks: { type: [Schema.Types.Mixed], default: [] },
    gpu: { type: Schema.Types.Mixed, default: null },
    network: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: false }
);

metricSnapshotSchema.index({ deviceId: 1, collectedAt: -1 });

export type MetricSnapshotDoc = InferSchemaType<typeof metricSnapshotSchema> & {
  _id: Schema.Types.ObjectId;
};

export const MetricSnapshotModel: Model<MetricSnapshotDoc> =
  (models.MetricSnapshot as Model<MetricSnapshotDoc> | undefined) ??
  model<MetricSnapshotDoc>("MetricSnapshot", metricSnapshotSchema);
