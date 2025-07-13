import React from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaShieldAlt, FaClock, FaStar, FaGraduationCap, FaTools } from 'react-icons/fa';
import { useQuery } from 'react-query';
import axios from '../axios';
import { useAuth } from '../contexts/AuthContext';

const About = () => {
  const { isAuthenticated } = useAuth();
  // Fetch public statistics from the database
  const { data: statsData, isLoading: statsLoading } = useQuery(
    'about-stats',
    async () => {
      const response = await axios.get('/api/public/stats');
      return response.data;
    },
    {
      retry: 2,
      refetchOnWindowFocus: false,
    }
  );

  const stats = [
    { 
      number: statsLoading ? '...' : `${statsData?.data?.totalUsers || 0}+`, 
      label: 'Active Students', 
      icon: <FaUsers className="text-3xl" /> 
    },
    { 
      number: statsLoading ? '...' : `${statsData?.data?.totalProducts || 0}+`, 
      label: 'Items Listed', 
      icon: <FaTools className="text-3xl" /> 
    },
    { 
      number: statsLoading ? '...' : `${statsData?.data?.totalOrders || 0}+`, 
      label: 'Successful Sales', 
      icon: <FaStar className="text-3xl" /> 
    },
    { 
      number: statsLoading ? '...' : `${statsData?.data?.activeRentals || 0}+`, 
      label: 'Active Listings', 
      icon: <FaClock className="text-3xl" /> 
    },
  ];

  const values = [
    {
      icon: <FaShieldAlt className="text-2xl" />,
      title: 'Trust & Safety',
      description: 'A secure, student-only platform for buying, selling, and trading on campus.'
    },
    {
      icon: <FaClock className="text-2xl" />,
      title: 'Convenience',
      description: 'Easily list, browse, and connect with fellow students for quick deals.'
    },
    {
      icon: <FaGraduationCap className="text-2xl" />,
      title: 'Student Empowerment',
      description: 'Helping students save money, declutter, and find what they need from their own community.'
    },
    {
      icon: <FaStar className="text-2xl" />,
      title: 'Community & Sustainability',
      description: 'Encouraging responsible reuse and building a supportive campus network.'
    }
  ];

  const team = [
    {
      name: 'Santosh Seelaboina',
      role: 'Main Developer',
      description: 'Main Developer of the Campus Connect marketplace project',
      image: './santosh.jpg'
    },
    {
      name: 'Bhanu',
      role: 'Software Tester & Proposed Idea',
      description: 'Software Tester and idea contributor for Campus Connect',
      image: './bhanu.jpg'
    },
    {
      name: 'Lokesh',
      role: 'Apprach Design',
      description: 'Designed the approach and contributed to Campus Connect',
      image: './lokesh.jpg'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-green-200 via-green-50 to-green-300">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center bg-white/40 backdrop-blur-md rounded-3xl border border-white/30 shadow-2xl p-10" style={{boxShadow:'0 8px 32px 0 rgba(31, 38, 135, 0.18)'}}>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About Campus Connect
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Campus Connect is your campus marketplace for buying, selling, and trading everything students need—textbooks, electronics, furniture, and more. We connect students to make campus life easier, more affordable, and more sustainable.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Campus Connect was created to help students buy, sell, and trade with each other easily and safely. We noticed students often have items they no longer need, while others are searching for affordable options. Our platform bridges that gap, making it simple to connect and deal within your own campus community.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We’re committed to building a sustainable, student-friendly marketplace that encourages responsible reuse, supports student budgets, and builds a stronger campus network.
              </p>
              <Link
                to="/collection"
                className="btn-primary text-lg px-8 py-3 inline-flex items-center"
              >
                Browse Marketplace
              </Link>
            </div>
            <div className="relative">
              <div className="bg-green-100 rounded-2xl p-8 shadow-xl border border-white/30 backdrop-blur-md" style={{boxShadow:'0 4px 24px 0 rgba(31, 38, 135, 0.10)'}}>
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 mx-auto bg-green-200 rounded-full flex items-center justify-center text-6xl shadow-lg">
                    <span className="">🛒</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Connecting Students
                  </h3>
                  <p className="text-gray-600">
                    Making campus life easier, more affordable, and more sustainable for everyone
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Impact</h2>
            <p className="text-xl text-gray-600">
              Numbers that tell our story of growth and student satisfaction
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center bg-white/70 rounded-2xl p-6 shadow-xl border border-white/30 backdrop-blur-md hover:scale-105 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300" style={{boxShadow:'0 4px 24px 0 rgba(31, 38, 135, 0.10)'}}>
                <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-4xl shadow-lg">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center p-8 rounded-2xl bg-white/60 backdrop-blur-md border border-white/30 shadow-xl hover:scale-105 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300" style={{boxShadow:'0 4px 24px 0 rgba(31, 38, 135, 0.10)'}}>
                <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-4xl shadow-lg">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600">
              The passionate people behind Campus Connect
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center bg-white/70 rounded-2xl p-8 shadow-xl border border-white/30 backdrop-blur-md hover:scale-105 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300" style={{boxShadow:'0 4px 24px 0 rgba(31, 38, 135, 0.10)'}}>
                <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden shadow-lg">
                  {member.name === 'Santosh Seelaboina' ? (
                    <a
                      href="https://santosh-a6qm.onrender.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover cursor-pointer"
                      />
                    </a>
                  ) : (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {member.name === 'Santosh Seelaboina' ? (
                    <a
                      href="https://santosh-a6qm.onrender.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {member.name}
                    </a>
                  ) : (
                    member.name
                  )}
                </h3>
                <p className="text-green-600 font-medium mb-4">{member.role}</p>
                <p className="text-gray-600">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20 bg-green-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students who trust Campus Connect for their equipment rental needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-green-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Sign Up Now
              </Link>
              <Link
                to="/contact"
                className="border-2 border-white text-white hover:bg-white hover:text-green-600 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default About; 