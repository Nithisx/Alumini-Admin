import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Prevent long usernames that may break the backend
    if (username.length > 100) {
      console.error('Username too long (max 100 characters)');
      return;
    }

    const userData = { username, password };
    console.log('Login data:', userData);
    const loginUrl =
      role === 'admin'
        ? 'https://touring-caps-order-recruitment.trycloudflare.com/login/admin/'
        : 'https://touring-caps-order-recruitment.trycloudflare.com/login/staff/';

    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json' // <- add this too
        },
        body: JSON.stringify(userData),
      });

      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        const text = await response.text();
        console.error('Login failed (non-200):', text);
        return;
      }

      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error('Expected JSON but got:', text);
        return;
      }

      const data = await response.json();
      const token = data?.token;

      if (token) {
        localStorage.setItem('Token', token);
        localStorage.setItem('Role', role);

        console.log('Login success:', data);
        navigate(role === 'admin' ? '/admin/dashboard' : '/staff/dashboard');
      } else {
        console.error('Token not found in response');
      }
    } catch (error) {
      console.error('Login failed (exception):', error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <form
        onSubmit={handleLogin}
        className="bg-gray-100 p-8 rounded-lg shadow-md w-80"
      >
        <h2 className="text-2xl font-semibold text-green-600 text-center mb-6">
          Login
        </h2>

        {/* Role Dropdown */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded 
                     focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
        </select>

        {/* Username Input */}
        <input
          type="text"
          placeholder="Email"
          maxLength={100}
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded 
                     focus:outline-none focus:ring-2 focus:ring-green-400"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        {/* Password Input */}
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 px-4 py-2 border border-gray-300 rounded 
                     focus:outline-none focus:ring-2 focus:ring-green-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* Login Button */}
        <button
          type="submit"
          className="w-full bg-green-500 hover:bg-green-600 text-white 
                     font-medium py-2 rounded transition"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
