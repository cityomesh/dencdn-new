// app/page.tsx (Login page)
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Login() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsSuccess(false);

    if (username === "rcastcdn" && password === "rcastcdn@123") {
      setMessage("Login successfully");
      setIsSuccess(true);
      
      // Save logged in user to localStorage
      localStorage.setItem('loggedInUser', username);

      setTimeout(() => {
        router.push("/homepage");
      }, 1500);
    } else {
      setMessage("Invalid Username or Password");
      setIsSuccess(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div
        className="w-full max-w-md rounded-lg p-8 shadow-lg
        bg-gradient-to-br from-[#0a0601] via-[#FDF2E9] to-[#1f23d6]
        border border-[#E6D3B1]"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/rcast_logo.png"
            alt="Rcast Logo"
            width={220}
            height={100}
            priority
          />
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-red-500"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-red-500"
            required
          />

          {/* Message shown below password */}
          {message && (
            <p
              className={`text-sm font-medium ${
                isSuccess ? "text-green-700" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-red-600 text-white font-semibold py-3 rounded hover:bg-red-700 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
