import React from "react";

const UserInfo = ({ user }) => {
  return (
    <div>
      <p><strong>First Name:</strong> {user.u_firstname}</p>
      <p><strong>Last Name:</strong> {user.u_lastname}</p>
      <p><strong>Email:</strong> {user.u_email}</p>
      {/* Add UIN if available */}
      <button onClick={() => window.location.href = "/change-password.html"}>
        Change Password
      </button>
      <button onClick={() => window.location.href = "/update-info.html"}>
        Update Info
      </button>
    </div>
  );
};

export default UserInfo;
