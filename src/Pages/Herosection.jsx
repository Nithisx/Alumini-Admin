import React, { useState, useEffect } from 'react';
import Image1 from "../images/image1.jpeg"
import Image2 from "../images/image2.jpg"
import Image3 from "../images/image3.jpg"
import { useNavigate } from 'react-router-dom';
const AlumniHeroSection = ({ data }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
     const navigate = useNavigate();
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % 3);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="relative min-h-screen bg-gradient-to-br from-slate-50 to-green-50 overflow-hidden">
            {/* Geometric Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-green-100/30 to-emerald-100/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-emerald-100/20 to-green-100/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-emerald-50/40 to-green-50/40 rounded-full blur-3xl"></div>
            </div>

            {/* Subtle Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.02]">
                <div className="w-full h-full" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
            </div>

            <div className="relative z-10 container mx-auto px-6 py-20">
                <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
                    
                    {/* Left Content */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-100 rounded-full text-green-700 text-sm font-medium">
                            <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
                            Alumni Network
                        </div>
                        
                        <div className="space-y-6">
                            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 leading-tight">
                                Welcome to
                                <span className="block bg-gradient-to-r from-green-500 via-emerald-500 to-lime-500 bg-clip-text text-transparent mt-2">
                                    KAHE Alumni
                                </span>
                            </h1>
                            
                            <p className="text-xl lg:text-2xl text-slate-600 leading-relaxed max-w-2xl">
                                Join a distinguished community of <span className="font-semibold text-green-600">{data?.total_users?.toLocaleString() || '10,000'}+</span> accomplished alumni. 
                                Build meaningful connections, advance your career, and contribute to our legacy of excellence.
                            </p>
                        </div>

                       

                       

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                className="group px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                                onClick={() => navigate('/signup')}
                            >
                                <span>Join Our Community</span>
                                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </button>
                            
                            <button  onClick={() => navigate('/about')} className="px-8 py-4 bg-white/80 backdrop-blur-sm text-slate-700 font-semibold rounded-xl border border-slate-200 hover:bg-white hover:border-slate-300 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl">
                                About us 
                            </button>
                        </div>

                        
                        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-200">
                            <div className="text-center">
                                <div className="text-2xl lg:text-3xl font-bold text-slate-900">{data?.total_users?.toLocaleString() || '10K'}+</div>
                                <div className="text-sm text-slate-600 mt-1">Alumni</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl lg:text-3xl font-bold text-slate-900">150+</div>
                                <div className="text-sm text-slate-600 mt-1">Companies</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl lg:text-3xl font-bold text-slate-900">50+</div>
                                <div className="text-sm text-slate-600 mt-1">Countries</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Image Carousel */}
                    <div className="relative">
                        <div className="relative w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl">
                            {[Image1, Image2, Image3].map((image, index) => (
                                <div
                                    key={index}
                                    className={`absolute inset-0 transition-all duration-1000 ${
                                        index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"
                                    }`}
                                >
                                    <img
                                        src={image}
                                        alt={`Alumni Success Story ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>
                                </div>
                            ))}

                            {/* Image Overlay Content */}
                            <div className="absolute bottom-8 left-8 right-8 text-white">
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                                    <h3 className="text-xl font-semibold mb-2">Success Stories</h3>
                                    <p className="text-white/90 text-sm">Discover how our alumni are making impact across industries worldwide</p>
                                </div>
                            </div>
                        </div>

                        {/* Slide Navigation */}
                        <div className="flex justify-center mt-6 space-x-2">
                            {[Image1, Image2, Image3].map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`w-12 h-1 rounded-full transition-all duration-300 ${
                                        index === currentSlide 
                                            ? "bg-green-600" 
                                            : "bg-slate-300 hover:bg-slate-400"
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Floating Elements */}
                        <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl rotate-12 opacity-80"></div>
                        <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg rotate-45 opacity-60"></div>
                    </div>
                </div>
            </div>

            {/* Bottom Wave */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" fillOpacity="0.1"/>
                </svg>
            </div>
        </section>
    );
};

export default AlumniHeroSection;