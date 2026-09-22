import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const anomalySchema = new Schema(
  {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },
    metric: { type: String, required: true },
    observedValue: { type: Schema.Types.Mixed, required: true },
    expectedValue: { type: Schema.Types.Mixed, default: null },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },
    relatedProcess: { type: String, default: null },
    relatedApplication: { type: String, default: null },
    explanation: { type: String, required: true },
    detectedAt: { type: Date, required: true },
  },
  { timestamps: false }
);

anomalySchema.index({ deviceId: 1, detectedAt: -1 });

export type AnomalyDoc = InferSchemaType<typeof anomalySchema> & {
  _id: Schema.Types.ObjectId;
};

export const AnomalyModel: Model<AnomalyDoc> =
  (models.Anomaly as Model<AnomalyDoc> | undefined) ??
  model<AnomalyDoc>("Anomaly", anomalySchema);
