"use client";
import Link from 'next/link';
import { useState } from 'react';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-blue-300 backdrop-blur-md shadow-sm z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link 
            href="/" 
            className="flex items-center space-x-3 group"
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-1.5 rounded-lg transform transition-transform group-hover:scale-105">
              <span className="text-xl font-bold">TLE</span>
            </div>
            <span className="text-gray-800 font-medium text-lg">Contest Tracker</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium relative group"
            >
              All Contests
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link 
              href="/solutions" 
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium relative group"
            >
              Solutions
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link 
              href="/bookmarks" 
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium relative group"
            >
              Bookmarks
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-blue-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                All Contests
              </Link>
              <Link
                href="/solutions"
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-blue-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Solutions
              </Link>
              <Link
                href="/bookmarks"
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-blue-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Bookmarks
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
