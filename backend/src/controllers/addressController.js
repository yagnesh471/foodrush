import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// All address CRUD lives on req.user, which requireAuth guarantees is the
// authenticated user's own document — so addresses are private to the
// account and available on any device, unlike the previous
// localStorage-only implementation which lost every address as soon as
// the browser storage was cleared or a different device was used.

export const listAddresses = asyncHandler(async (req, res) => {
  res.json(req.user.addresses);
});

export const addAddress = asyncHandler(async (req, res) => {
  const { type, fullAddress, landmark, city, pincode, latitude, longitude, isDefault } = req.body;

  const cleanFullAddress = String(fullAddress || "").trim();
  if (!cleanFullAddress) throw new ApiError(400, "Please enter a full address");

  const isFirstAddress = req.user.addresses.length === 0;

  if (isDefault || isFirstAddress) {
    req.user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  req.user.addresses.push({
    type: type || "Home",
    fullAddress: cleanFullAddress,
    landmark: String(landmark || "").trim(),
    city: String(city || "").trim(),
    pincode: String(pincode || "").trim(),
    latitude,
    longitude,
    // The very first address a user saves is automatically their
    // default, so checkout has something to preselect immediately
    // instead of forcing an extra "select an address" step.
    isDefault: isDefault || isFirstAddress,
  });

  await req.user.save();

  res.status(201).json(req.user.addresses);
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, "Address not found");

  const { type, fullAddress, landmark, city, pincode, latitude, longitude, isDefault } = req.body;

  if (fullAddress !== undefined) address.fullAddress = String(fullAddress).trim();
  if (type !== undefined) address.type = type;
  if (landmark !== undefined) address.landmark = String(landmark).trim();
  if (city !== undefined) address.city = String(city).trim();
  if (pincode !== undefined) address.pincode = String(pincode).trim();
  if (latitude !== undefined) address.latitude = latitude;
  if (longitude !== undefined) address.longitude = longitude;

  if (isDefault) {
    req.user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.equals(address._id);
    });
  }

  await req.user.save();

  res.json(req.user.addresses);
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, "Address not found");

  const wasDefault = address.isDefault;
  address.deleteOne();

  if (wasDefault && req.user.addresses.length > 0) {
    req.user.addresses[0].isDefault = true;
  }

  await req.user.save();

  res.json(req.user.addresses);
});
