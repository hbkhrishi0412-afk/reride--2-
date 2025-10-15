/**
 * Data Loaders - Lazy load heavy static data to improve initial page load
 * These utilities dynamically import large data files only when needed
 */

export const loadConstants = async () => {
  const module = await import('../constants');
  return module;
};

export const loadVehicleData = async () => {
  const module = await import('../components/vehicleData');
  return module;
};

export const loadNewCarsData = async () => {
  const module = await import('../data/newCarsData');
  return module;
};

// Helper to get PLAN_DETAILS without loading entire constants file
export const loadPlanDetails = async () => {
  const { PLAN_DETAILS } = await import('../constants');
  return PLAN_DETAILS;
};

// Helper to get MOCK_SUPPORT_TICKETS without loading entire constants file
export const loadMockSupportTickets = async () => {
  const { MOCK_SUPPORT_TICKETS } = await import('../constants');
  return MOCK_SUPPORT_TICKETS;
};

// Helper to get MOCK_FAQS without loading entire constants file
export const loadMockFaqs = async () => {
  const { MOCK_FAQS } = await import('../constants');
  return MOCK_FAQS;
};

// Helper to get vehicle placeholder image function
export const loadPlaceholderImageHelper = async () => {
  const { getPlaceholderImage } = await import('../components/vehicleData');
  return getPlaceholderImage;
};

