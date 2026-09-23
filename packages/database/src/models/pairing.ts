import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const pairingSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    label: { type: String },
    consumedAt: { type: Date, default: null },
    // TTL index declared once below — do not also set index: true here
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

pairingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PairingCodeDoc = InferSchemaType<typeof pairingSchema> & {
  _id: Schema.Types.ObjectId;
};

export const PairingCodeModel: Model<PairingCodeDoc> =
  (models.PairingCode as Model<PairingCodeDoc> | undefined) ??
  model<PairingCodeDoc>("PairingCode", pairingSchema);
