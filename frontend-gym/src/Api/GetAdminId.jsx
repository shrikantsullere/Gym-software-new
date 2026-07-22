const GetAdminId = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.adminId || user.id;
    }
  } catch (e) {
    console.error("Error in GetAdminId:", e);
  }
  return localStorage.getItem("userId"); 
};
export default GetAdminId;






//  const getUserFromStorage = () => {
//     try {
//       const userStr = localStorage.getItem('user');
//       return userStr ? JSON.parse(userStr) : null;
//     } catch (err) {
//       console.error('Error parsing user from localStorage:', err);
//       return null;
//     }
//   };

//   const user = getUserFromStorage();
//   const memberId = user?.id || null;
//   const branchId = user?.branchId || null;
//   const name = user?.fullName || null;
//   const staffId = user?.staffId || null;

