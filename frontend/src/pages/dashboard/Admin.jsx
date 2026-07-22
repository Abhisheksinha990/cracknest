import React, { useEffect, useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api';
import { Users, Star, ShieldAlert } from 'lucide-react';

const Admin = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/admin/users');
        setUsers(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [user]);

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/resume" replace />;
  }

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white tracking-tight flex items-center gap-3">
            <ShieldAlert className="text-red-500" /> Admin Dashboard
          </h1>
          <p className="text-zinc-400 mt-2">Platform-wide overview of users and performance.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Loading admin data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
          {error}
        </div>
      ) : (
        <div className="space-y-6 pb-12">
          {/* Top Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{users.length}</p>
                <p className="text-sm text-zinc-400">Total Users</p>
              </div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                <Star size={24} />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {(users.reduce((acc, curr) => acc + curr.average_rating, 0) / (users.filter(u => u.interviews_completed > 0).length || 1)).toFixed(1)}
                </p>
                <p className="text-sm text-zinc-400">Platform Avg Rating</p>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-900 text-zinc-300 font-medium border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Interviews</th>
                    <th className="px-6 py-4">Avg Rating</th>
                    <th className="px-6 py-4">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{u.name}</p>
                        <p className="text-xs text-zinc-500">{u.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === 'ADMIN' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">{u.interviews_completed}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-yellow-400 fill-current" />
                          {u.average_rating}
                        </div>
                      </td>
                      <td className="px-6 py-4">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Admin;
