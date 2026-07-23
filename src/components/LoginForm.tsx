import React, { useState } from "react";
import { Landmark, Lock, User, ShieldAlert, CheckCircle2 } from "lucide-react";

interface LoginFormProps {
  onLogin: () => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      // Validate credentials
      if (username.trim() === "admin" && password === "smc@sarthana2026") {
        onLogin();
      } else {
        setError("ખોટો યુઝરનેમ અથવા પાસવર્ડ! (Invalid username or password)");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-orange-500 p-4 rounded-full shadow-md text-white">
            <Landmark className="h-12 w-12" />
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          સુરત મહાનગરપાલિકા
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          નવા પૂર્વ (સરથાણા) ઝોન - હોર્ડિંગ મેનેજમેન્ટ પોર્ટલ
        </p>
        <p className="text-center text-xs font-mono text-slate-400 mt-1">
          SMC New East (Sarthana) Zone - Hoarding System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-md">
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-900">
                  ડેમો લોગીન માહિતી (Demo Credentials):
                </p>
                <p className="text-xs text-blue-800 mt-1">
                  <strong>યુઝરનેમ (Username):</strong> <code className="bg-white px-1 border rounded font-mono">admin</code>
                </p>
                <p className="text-xs text-blue-800">
                  <strong>પાસવર્ડ (Password):</strong> <code className="bg-white px-1 border rounded font-mono">smc@sarthana2026</code>
                </p>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span className="text-xs font-medium text-red-800">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                યુઝરનેમ / Username
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-sm"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                પાસવર્ડ / Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {loading ? "પ્રવેશ કરી રહ્યા છીએ..." : "પ્રવેશ કરો / Secure Login"}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <div className="text-center text-xs text-slate-500">
              સુરક્ષા ચેતવણી: આ સિસ્ટમ માત્ર અધિકૃત કર્મચારીઓ માટે જ છે.
              <br />
              Authorized Access Only. Actions are audited.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
