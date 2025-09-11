import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Added useLocation import
import Footer from '../components/Footer';
import MainMenu from '../components/MainMenu';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const location = useLocation();
    const { user, openAuthModal } = useAuth();

    return (
        <div className="h-full bg-[#f7f3ec] max-h-100dvh text-gray-900 overflow-x-hidden justify-between flex flex-col">
            <MainMenu background="bg-[#f7f3ec]" />
            <section className="flex items-center mx-auto px-4 md:px-16">
                <div className="flex flex-col md:flex-row items-center w-full mx-auto">
                    {/* Hero Content */}
                    <div className="flex-1 max-w-lg md:max-w-xl text-center">
                        <h1 className="text-5xl md:text-7xl lg:text-7xl font-normal leading-none mb-10">
                            Modern Invoice Management
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed ">
                            Envoyce provides modern tools to <span className="standout bg-[#c7f9cc]">create</span>&nbsp;
                            <span className="standout bg-[#fae588]">manage </span>
                             and <span className="standout bg-[#a2d2ff]">share</span> professional invoices with ease.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-center">
                            <button
                                className="bg-black/90 text-white px-12 py-4 rounded-full text-lg
                                font-semibold transition-all duration-300 hover:shadow-lg"
                                onClick={(e) => {
                                    if (!user) {
                                        e.preventDefault();
                                        openAuthModal('login');
                                    }
                                }}
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            <svg>
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#34D399" />
                        <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                </defs>
            </svg>

            <Footer />
        </div>
    );
};

export default Home;