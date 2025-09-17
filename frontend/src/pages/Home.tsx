import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Added useLocation import
import Footer from '../components/Footer';
import MainMenu from '../components/MainMenu';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const location = useLocation();
    const { user, openAuthModal } = useAuth();

    return (
        <>
        <div className="h-full bg-[#f6f4ed] max-h-100dvh  text-gray-900 overflow-x-hidden justify-between flex flex-col">
            <MainMenu background="bg-[#f6f4ed]" />
            <section className="flex items-center mx-auto px-8 md:px-16">
                <div className="flex flex-col md:flex-row items-center w-full mx-auto">
                    {/* Hero Content */}
                    <div className="flex-1 max-w-lg md:max-w-2xl text-center">
                    <span className="text-md font-medium text-gray-500 mb-4 inline-block">
                    <div className="avatar avatar-sm mr-2 inline-block">
                        <img
                            src="https://plus.unsplash.com/premium_photo-1671656349218-5218444643d8?q=80&w=987&auto=format&fit=crop&ixlib=rb-
                            4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="Envoyce Logo"
                            className="rounded-full object-cover w-6 h-6 md:w-9 md:h-9 inline-block border-2 border-white"

                        />
                        <img
                            src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=1480&auto=format&fit=crop&ixlib=rb-
                            4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="Envoyce Logo"
                            className="rounded-full w-6 h-6 md:w-9 md:h-9 inline-block -ml-2 border-2 border-white"
                        />
                        <img
                            src="https://images.unsplash.com/photo-1620075225255-8c2051b6c015?q=80&w=1494&auto=format&fit=crop&ixlib=rb-
                            4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="Envoyce Logo"
                            className="rounded-full w-6 h-6 md:w-9 md:h-9 inline-block -ml-2 border-2 border-white"
                        />
                    </div>
                        Already used by 597+ freelancers worldwide&nbsp;
                        </span>
                        <h1 className="text-5xl font-normal leading-none mb-4">
                            A Simpler Way to Invoice
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed ">
                            Envoyce provides tools to help you <span className="standout bg-[#c7f9cc]">create</span>&nbsp;
                            <span className="standout bg-[#fae588]">manage</span>&nbsp;
                            and&nbsp;<span className="standout bg-[#a2d2ff]">share</span> professional invoices seamlessly.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-center">
                        <Link to="/new">
                          <button className="bg-black/90 text-white px-12 py-4 rounded-full text-lg
                                font-semibold transition-all duration-300 hover:shadow-lg">
                            Create Invoice
                          </button>
                        </Link>
                        </div>
                    </div>
                </div>
            </section>
            <section className="w-full px-4 md:px-0">
            <div className="relative bottom-0 max-w-5xl w-full mx-auto md:mt-6 border-b-1 border-white overflow-hidden rounded-t-3xl">
              <img
                src="https://images.unsplash.com/photo-1755541516450-644adb257ad0?q=80&w=1480&auto=format&fit=crop&ixlib=rb-
                4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                className="w-full h-40 md:h-80 object-cover object-[90%_25%] hover:scale-105 transition-transform duration-300"
              />

            </div>
            <Footer />
            </section>
        </div>
        </>
    );
};

export default Home;