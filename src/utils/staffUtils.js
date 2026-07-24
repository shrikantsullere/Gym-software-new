export const getCurrentStaffId = (user) => {
  if (!user) return null;
  
  // Return staffId if present
  if (user.staffId) {
    return user.staffId;
  }
  
  // Log warning if fallback is used
  console.warn("getCurrentStaffId: staffId is missing from user object. Falling back to user.id.");
  return user.id;
};
