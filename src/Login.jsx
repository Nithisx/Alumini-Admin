import React, { useState } from 'react';


// URL=`https://pubmed-mart-immunology-area.trycloudflare.com/login/admin/`

const LoginPage = () => {
    const [username, setusername] = useState('');
    const [password, setPassword] = useState('');
    
    const handleLogin = async (e) => {
        e.preventDefault();
        
        const userData = {
          username,
          password,
        };
      
        try {
          const response = await fetch("https://pubmed-mart-immunology-area.trycloudflare.com/login/admin/", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });
      
          const data = await response.json(); // ✅ correctly parse the JSON body
      
          if (!response.ok) {
            console.error('Login failed:', data?.detail || 'Unknown error');
            return;
          }
      
          const token = data?.token;
          if (token) {
            localStorage.setItem('Token', token); // ✅ store the token properly
            console.log('Login success:', data);
          } else {
            console.error('Token not found in response');
          }
      
        } catch (error) {
          console.error('Login failed:', error);
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
        <input
          type="text"
          placeholder="Email"
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
          value={username}
          onChange={(e) => setusername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded transition"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
