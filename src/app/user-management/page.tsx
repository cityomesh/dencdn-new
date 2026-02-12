// app/user-management/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  FiPlus, FiEdit2, FiTrash2, FiUser, FiShield, FiActivity, 
  FiX, FiAlertCircle 
} from "react-icons/fi";
import Header from "../../components/Header";

interface User {
  id: number;
  username: string;
  role: string;
  created: string;
  status: string;
  lastLogin?: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [deleteUsername, setDeleteUsername] = useState("");
  
  // New user form
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("USER");
  const [formError, setFormError] = useState("");

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setIsLoading(true);
    const savedUsers = localStorage.getItem('users');
    
    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);
        setUsers(parsedUsers);
      } catch {
        setUsers([{
          id: 1,
          username: "rcastcdn",
          role: "ADMIN",
          created: "Feb 4, 2026, 01:02 PM",
          status: "ACTIVE",
          lastLogin: new Date().toLocaleString('en-US', { 
            year: 'numeric', month: 'short', day: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
          })
        }]);
      }
    } else {
      setUsers([{
        id: 1,
        username: "rcastcdn",
        role: "ADMIN",
        created: "Feb 4, 2026, 01:02 PM",
        status: "ACTIVE",
        lastLogin: new Date().toLocaleString('en-US', { 
          year: 'numeric', month: 'short', day: 'numeric', 
          hour: '2-digit', minute: '2-digit' 
        })
      }]);
    }
    setIsLoading(false);
  };

  // Save users
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('users', JSON.stringify(users));
    }
  }, [users, isLoading]);

  const handleCreateUser = () => {
    setNewUsername("");
    setNewPassword("");
    setNewRole("USER");
    setFormError("");
    setShowCreateModal(true);
  };

  const validateForm = () => {
    if (!newUsername.trim()) {
      setFormError("Username is required");
      return false;
    }
    if (users.some(u => u.username === newUsername)) {
      setFormError("Username already exists");
      return false;
    }
    if (!newPassword) {
      setFormError("Password is required");
      return false;
    }
    if (newPassword.length < 6) {
      setFormError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleSubmitUser = () => {
    if (!validateForm()) return;
    
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username: newUsername,
      role: newRole,
      created: new Date().toLocaleString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      }),
      status: "ACTIVE",
      lastLogin: "Never"
    };
    
    setUsers([...users, newUser]);
    setShowCreateModal(false);
    alert(`User "${newUsername}" created successfully!`);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setNewUsername(user.username);
    setNewRole(user.role);
    setFormError("");
    setShowEditModal(true);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;
    
    if (!newUsername.trim()) {
      setFormError("Username is required");
      return;
    }
    
    if (newUsername !== selectedUser.username && 
        users.some(u => u.username === newUsername)) {
      setFormError("Username already exists");
      return;
    }
    
    const updatedUsers = users.map(u => 
      u.id === selectedUser.id 
        ? { ...u, username: newUsername, role: newRole }
        : u
    );
    
    setUsers(updatedUsers);
    setShowEditModal(false);
    setSelectedUser(null);
    alert(`User "${newUsername}" updated successfully!`);
  };

  const handleDeleteClick = (userId: number, username: string) => {
    if (username === "rcastcdn") {
      alert("Cannot delete the main user!");
      return;
    }
    setDeleteUserId(userId);
    setDeleteUsername(username);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (deleteUserId) {
      const updatedUsers = users.filter(u => u.id !== deleteUserId);
      setUsers(updatedUsers);
      setShowDeleteConfirm(false);
      setDeleteUserId(null);
      alert(`User "${deleteUsername}" deleted successfully!`);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      {/* Main Content */}
      <div className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-7xl">
          
          {/* Page Title - EXACTLY as screenshot */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
            <p className="text-gray-400">Manage system users and their permissions</p>
          </div>

          {/* Create User Button - EXACTLY as screenshot */}
          <div className="flex justify-end mb-6">
            <button
              onClick={handleCreateUser}
              className="flex items-center gap-2 px-5 py-2.5 bg-yellow-700 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors border border-yellow-600 shadow-lg"
            >
              <FiPlus className="text-lg" />
              Create User
            </button>
          </div>

          {/* Users Grid - EXACTLY as screenshot */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-6 animate-pulse">
                  <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-[#1e1e1e] rounded-xl border border-gray-700 overflow-hidden"
                >
                  {/* Card Content - EXACT format from screenshot */}
                  <div className="p-6">
                    {/* Header with username and status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                          <FiUser className="text-2xl text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">{user.username}</h3>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-600/20 text-purple-400 border border-purple-500/40 mt-1">
                            <FiShield className="mr-1 text-xs" />
                            {user.role}
                          </span>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs bg-green-600/20 text-green-400 border border-green-500/40">
                        {user.status}
                      </span>
                    </div>

                    {/* User Details - EXACT format from screenshot */}
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center">
                        <span className="w-20 text-gray-500">Username</span>
                        <span className="text-white font-mono">{user.username}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="w-20 text-gray-500">Role</span>
                        <span className="text-purple-400 font-medium">{user.role}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="w-20 text-gray-500">Created</span>
                        <span className="text-gray-400 text-xs">{user.created}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="w-20 text-gray-500">Status</span>
                        <span className="text-green-400 inline-flex items-center gap-1.5">
                          <FiActivity className="text-xs" />
                          {user.status}
                        </span>
                      </div>
                      
                      {user.lastLogin && (
                        <div className="flex items-center">
                          <span className="w-20 text-gray-500">Last Login</span>
                          <span className="text-gray-400 text-xs">{user.lastLogin}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions - Edit and Delete buttons */}
                  <div className="px-6 py-3 bg-[#252525] border-t border-gray-700 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-blue-400"
                      disabled={user.username === "rcastcdn"}
                      title={user.username === "rcastcdn" ? "Cannot edit main user" : "Edit User"}
                    >
                      <FiEdit2 className="text-sm" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(user.id, user.username)}
                      className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-400"
                      disabled={user.username === "rcastcdn"}
                      title={user.username === "rcastcdn" ? "Cannot delete main user" : "Delete User"}
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal - Clean version */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4">
          <div className="bg-[#1e1e1e] rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
            
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Create New User</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                <FiX className="text-gray-400 text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Username */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-4 py-2.5 bg-[#252525] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-yellow-700"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-2.5 bg-[#252525] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-yellow-700"
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#252525] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-700"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>

              {/* Error message */}
              {formError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <FiAlertCircle className="text-xs" />
                  {formError}
                </p>
              )}

              {/* Note */}
              <div className="p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                <p className="text-xs text-yellow-300/90">
                  Users will be able to log in with these credentials and access the CDN management system.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitUser}
                className="px-5 py-2.5 bg-yellow-700 hover:bg-yellow-600 rounded-lg text-sm font-medium text-white"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4">
          <div className="bg-[#1e1e1e] rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
            
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Edit User</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                <FiX className="text-gray-400 text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Username */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-4 py-2.5 bg-[#252525] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-yellow-700"
                  disabled={selectedUser.username === "rcastcdn"}
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#252525] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-700"
                  disabled={selectedUser.username === "rcastcdn"}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>

              {/* Error message */}
              {formError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <FiAlertCircle className="text-xs" />
                  {formError}
                </p>
              )}

              {/* Note */}
              <div className="p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                <p className="text-xs text-yellow-300/90">
                  Users will be able to log in with these credentials and access the CDN management system.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-5 py-2.5 bg-yellow-700 hover:bg-yellow-600 rounded-lg text-sm font-medium text-white"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80] p-4">
          <div className="bg-[#1e1e1e] rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
            
            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center">
                  <FiTrash2 className="text-3xl text-red-500" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Delete User</h3>
              <p className="text-gray-400 mb-2">
                Are you sure you want to delete user
              </p>
              <p className="text-yellow-500 font-bold text-lg mb-6">
                &quot;{deleteUsername}&quot;?
              </p>
              <p className="text-sm text-gray-500">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium text-white flex items-center gap-2"
              >
                <FiTrash2 className="text-sm" />
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
