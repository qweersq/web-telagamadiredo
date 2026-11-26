// Utility to calculate distance between two coordinates (in meters)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

// Outlet location (can be moved to config if needed)
// export const OUTLET_LOCATION = {
//   lat: -8.064968, // Latitude outlet pakisaji
//   lng: 112.578566, // Longitude outlet pakisaji
// };
export const OUTLET_LOCATION = {
  lat: -7.9672551820063, // Latitude outlet Katsikat
  lng: 112.64457771475513, // Longitude outlet Katsikat
};

// Allowed radius in meters
export const ALLOWED_RADIUS = 100;

// Validate if user is within allowed radius from outlet
export function validateLocation(userLat, userLng, outlet = OUTLET_LOCATION, allowedRadius = ALLOWED_RADIUS) {
  return calculateDistance(userLat, userLng, outlet.lat, outlet.lng);
} 