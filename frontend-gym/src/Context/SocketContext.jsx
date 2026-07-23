import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const u = userStr ? JSON.parse(userStr) : null;
    
    if (!u || !u.id) return;

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
    const newSocket = io(backendUrl, { withCredentials: true });

    newSocket.on("connect", () => {
      newSocket.emit("join_room", u.id);
      
      const adminId = u.adminId || u.id;
      if (adminId) {
        newSocket.emit("join_room", `admin_${adminId}`);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
