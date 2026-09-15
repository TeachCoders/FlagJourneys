"use client";
import { SingUpClinet } from "@/feature/auth/components/SignUpClient";
import { Login } from "@/feature/auth/components/LoginClient";
import { useState } from "react";
import { Plane, MapPin, Globe, Compass } from "lucide-react";

export function AuthClient() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Travel Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-brand-navy via-[#034d7a] to-brand-teal overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 opacity-10">
            <Globe size={120} className="text-white" />
          </div>
          <div className="absolute bottom-32 right-16 opacity-10">
            <Plane size={80} className="text-white -rotate-12" />
          </div>
          <div className="absolute top-1/2 left-1/3 opacity-10">
            <Compass size={60} className="text-white" />
          </div>
          {/* Dotted Map Pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg">
                <img src="/logo.png" alt="Flag Journeys" className="w-full h-full object-contain" />
              </div>             
           
            <h1 className="text-4xl font-extrabold leading-tight mb-4">
              Flag Journeys<br />
            
            </h1>
             </div>
            <p className="text-white/70 text-lg max-w-md leading-relaxed">
              Manage destinations, packages, and bookings — all from one powerful dashboard.
            </p>
          </div>

       
        </div>

        {/* Bottom Gradient Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-gold via-brand-teal to-brand-gold" />
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
            {isLogin ? <Login /> : <SingUpClinet />}

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-slate-500 hover:text-brand-primary transition-colors"
              >
                {isLogin ? (
                  <>Don&apos;t have an account? <span className="font-semibold text-brand-primary">Sign Up</span></>
                ) : (
                  <>Already have an account? <span className="font-semibold text-brand-primary">Log In</span></>
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400 mt-6">
            &copy; {new Date().getFullYear()} {process.env.NEXT_PUBLIC_BRAND_NAME || "Flag Journeys"}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
