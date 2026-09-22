import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const credentialSchema = new Schema(
  {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    label: { type: String },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export type DeviceCredentialDoc = InferSchemaType<typeof credentialSchema> & {
  _id: Schema.Types.ObjectId;
};

export const DeviceCredentialModel: Model<DeviceCredentialDoc> =
  (models.DeviceCredential as Model<DeviceCredentialDoc> | undefined) ??
  model<DeviceCredentialDoc>("DeviceCredential", credentialSchema);
