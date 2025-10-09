import React, { useEffect, useState } from "react";
import UserInfo from "./UserInfo";

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch logged-in user info from backend
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:4040/user/12"); // Replace 1 with dynamic user ID
        const data = await res.json();
        if (res.ok) setUser(data.result);
        else console.error(data.message);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, []);

  if (!user) return <p>Loading user info...</p>;

  return (
    <div>
      <h1>Welcome, {user.u_firstname}!</h1>
      <UserInfo user={user} />
    </div>
  );
};

export default Dashboard;
