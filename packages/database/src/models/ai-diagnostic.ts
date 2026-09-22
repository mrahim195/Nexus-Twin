import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const aiDiagnosticSchema = new Schema(
  {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: String, required: true },
    summary: { type: String, required: true },
    observations: { type: [String], default: [] },
    likelyCauses: { type: [String], default: [] },
    evidence: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    confidence: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    limitations: { type: [String], default: [] },
    evidencePackage: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

aiDiagnosticSchema.index({ deviceId: 1, createdAt: -1 });

export type AiDiagnosticDoc = InferSchemaType<typeof aiDiagnosticSchema> & {
  _id: Schema.Types.ObjectId;
};

export const AiDiagnosticModel: Model<AiDiagnosticDoc> =
  (models.AiDiagnostic as Model<AiDiagnosticDoc> | undefined) ??
  model<AiDiagnosticDoc>("AiDiagnostic", aiDiagnosticSchema);
