import { LISTING_LIMITS } from './constants';

const isEmpty = (value) =>
  value === null || value === undefined || String(value).trim() === '';

export const validateEmail = (email) => {
  if (isEmpty(email)) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Enter a valid email address';
  return null;
};

export const validatePassword = (password) => {
  if (isEmpty(password)) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
};

export const validateName = (name) => {
  if (isEmpty(name)) return 'Name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  if (name.trim().length > 100) return 'Name is too long';
  return null;
};

export const validatePhone = (phone) => {
  if (isEmpty(phone)) return 'Phone number is required';
  const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, '')))
    return 'Enter a valid 10-digit Indian phone number';
  return null;
};

export const validateCity = (city) => {
  if (isEmpty(city)) return 'Please select a city';
  return null;
};

export const validateRole = (role) => {
  if (isEmpty(role)) return 'Please select your role';
  return null;
};

// pickupAddress is required (min 10, max 200 chars).
// Min 10 prevents "123" or "XYZ" — a real address needs at least a street name.
// Max 200 matches the schema defined in Section 20 of the project context.
export const validatePickupAddress = (address) => {
  if (isEmpty(address)) return 'Pickup address is required';
  if (address.trim().length < 10) return 'Please enter a complete address (min 10 characters)';
  if (address.trim().length > LISTING_LIMITS.ADDRESS_MAX) return `Address must be under ${LISTING_LIMITS.ADDRESS_MAX} characters`;
  return null;
};


export const validateSignupForm = (values) => {
  const errors = {};

  const nameError     = validateName(values.name);
  if (nameError)     errors.name     = nameError;

  const emailError    = validateEmail(values.email);
  if (emailError)    errors.email    = emailError;

  const passwordError = validatePassword(values.password);
  if (passwordError) errors.password = passwordError;

  const phoneError    = validatePhone(values.phone);
  if (phoneError)    errors.phone    = phoneError;

  // Feature : NGOs select multiple cities; restaurants select one city
  if (values.role === 'ngo') {
    const citiesError = validateCities(values.cities);
    if (citiesError) errors.cities = citiesError;
  } else {
    const cityError = validateCity(values.city);
    if (cityError) errors.city = cityError;
  }

  const roleError     = validateRole(values.role);
  if (roleError)     errors.role     = roleError;

  return errors;
};

export const validateLoginForm = (values) => {
  const errors = {};
  const emailError    = validateEmail(values.email);   if (emailError)    errors.email    = emailError;
  const passwordError = validatePassword(values.password); if (passwordError) errors.password = passwordError;
  return errors;
};

export const validateFoodName = (name) => {
  if (isEmpty(name)) return 'Food name is required';
  if (name.trim().length < 2) return 'Food name is too short';
  if (name.trim().length > LISTING_LIMITS.FOOD_NAME_MAX)
    return `Food name must be under ${LISTING_LIMITS.FOOD_NAME_MAX} characters`;
  return null;
};

export const validateQuantity = (qty) => {
  if (isEmpty(qty)) return 'Quantity is required';
  const num = Number(qty);
  if (isNaN(num)) return 'Quantity must be a number';
  if (num < LISTING_LIMITS.QUANTITY_MIN) return `Quantity must be at least ${LISTING_LIMITS.QUANTITY_MIN}`;
  if (num > LISTING_LIMITS.QUANTITY_MAX) return `Quantity cannot exceed ${LISTING_LIMITS.QUANTITY_MAX}`;
  return null;
};

export const validateUnit = (unit) => {
  if (isEmpty(unit)) return 'Please select a unit';
  return null;
};

export const validateDescription = (desc) => {
  if (desc && desc.length > LISTING_LIMITS.DESCRIPTION_MAX)
    return `Description must be under ${LISTING_LIMITS.DESCRIPTION_MAX} characters`;
  return null;
};

export const validateExpiryTime = (expiryTime) => {
  if (isEmpty(expiryTime)) return 'Expiry time is required';
  const expiry = new Date(expiryTime);
  if (isNaN(expiry.getTime())) return 'Invalid expiry time';
  if (expiry <= new Date()) return 'Expiry time must be in the future';
  return null;
};

export const validatePickupWindow = (start, end) => {
  const errors = {};
  if (isEmpty(start)) errors.pickupWindowStart = 'Pickup start time is required';
  if (isEmpty(end))   errors.pickupWindowEnd   = 'Pickup end time is required';
  if (start && end) {
    const s = new Date(start);
    const e = new Date(end);
    if (s >= e)        errors.pickupWindowEnd   = 'Pickup end must be after start';
    if (s <= new Date()) errors.pickupWindowStart = 'Pickup start must be in the future';
  }
  return errors;
};

export const validateListingForm = (values) => {
  const errors = {};

  const foodNameError = validateFoodName(values.foodName);
  if (foodNameError) errors.foodName = foodNameError;

  const quantityError = validateQuantity(values.quantity);
  if (quantityError) errors.quantity = quantityError;

  const unitError = validateUnit(values.unit);
  if (unitError) errors.unit = unitError;

  const descError = validateDescription(values.description);
  if (descError) errors.description = descError;

  const expiryError = validateExpiryTime(values.expiryTime);
  if (expiryError) errors.expiryTime = expiryError;

  const pickupErrors = validatePickupWindow(values.pickupWindowStart, values.pickupWindowEnd);
  Object.assign(errors, pickupErrors);

  const cityError = validateCity(values.city);
  if (cityError) errors.city = cityError;

  // NEW — Feature H: pickupAddress is required on every listing
  const addressError = validatePickupAddress(values.pickupAddress);
  if (addressError) errors.pickupAddress = addressError;

  return errors;
};

export const isFormValid = (errors) => Object.keys(errors).length === 0;

// validateCities is used for NGO multi-city selection.
// validateCity (singular) is still used for restaurants — unchanged.
export const validateCities = (cities) => {
  if (!Array.isArray(cities) || cities.length === 0)
    return 'Please select at least one city';
  return null;
};