import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import cbiPlugEu2 from "../assets/images/cbi-plug-eu-2.svg";
// Import AOS (Animate On Scroll) library
import AOS from 'aos';
import 'aos/dist/aos.css';

export const MacbookPro = (): JSX.Element => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  // Initialize AOS when component mounts
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: false,
      mirror: true,
      offset: 120,
      easing: 'ease-in-out',
    });
    
    // Refresh AOS on window resize to handle animations properly
    window.addEventListener('resize', () => {
      AOS.refresh();
    });
    
    return () => {
      window.removeEventListener('resize', () => {
        AOS.refresh();
      });
    };
  }, []);

  return (
    <div className="bg-neutral-50 flex flex-col items-center w-full overflow-x-hidden">
  
    {/* Header Section - Centered */}
    <div className="w-full flex justify-center mt-12" data-aos="fade-down">
      <div className="w-full max-w-[1440px] h-20 bg-[#f0f0f0] rounded-[40px] flex items-center justify-between px-5 z-50">
        <div className="inline-flex items-center gap-[3px]">
          <img
            className="w-36 h-10"
            alt="Cbi plug eu"
            src="https://res.cloudinary.com/dvvhyfrjr/image/upload/v1742549448/bcxu4sgnwmnpwmlmk1vs.png"
          />
          </div>
        
        <div 
          className="flex items-center justify-center gap-2.5 px-6 py-2 bg-[#1877f2] rounded-[96px] cursor-pointer hover:bg-blue-600 transition-colors"
          onClick={handleSignUp}
        >
          <div className="text-white text-base text-center">
              Sign up free
          </div>
        </div>
      </div>
    </div>
  
    {/* Main Content Section with Padding */}
    <div className="w-full max-w-[1440px] px-[100px]">
      <div className="flex flex-col items-center justify-center mt-10 mb-20">
        <p className="text-center font-bold text-4xl md:text-5xl lg:text-6xl mb-20" data-aos="fade-up" data-aos-delay="200">
          CNNCT – Easy <br />
          Scheduling Ahead
        </p>
        
        <div className="flex w-full md:w-[234px] h-[68px] justify-center my-8" data-aos="zoom-in" data-aos-delay="400">
          <div 
            className="flex w-full md:w-[234px] h-[67px] items-center justify-center gap-4 px-6 py-3 bg-[#1877f2] rounded-[96px] cursor-pointer hover:bg-blue-600 transition-colors"
            onClick={handleSignUp}
          >
            <div className="text-xl md:text-2xl text-center font-normal text-white whitespace-nowrap">
                Sign up free
            </div>
          </div>
        </div>
      </div>
   
        <div className="w-full flex flex-col items-center justify-center mt-8">
          <img
            className="w-full max-w-[900px] object-cover rounded-lg"
            alt="Screen"
            src="https://res.cloudinary.com/dvvhyfrjr/image/upload/v1742547610/bvypb1g7izfqbpkt1quf.png"
            data-aos="fade-up"
            data-aos-duration="1000"
          />

          <p className="text-center font-semibold text-2xl md:text-3xl mt-8 [font-family:'Inter-SemiBold',Helvetica] text-black text-[40px] tracking-[0] leading-[41.2px] whitespace-nowrap" data-aos="fade-up" data-aos-delay="200">
            Simplified scheduling for you and your team
          </p>
                </div>

        <div className="w-full mt-6 text-center">
          <p className="text-xl mb-24 text-center [font-family:'Inter-Regular',Helvetica] font-normal text-black opacity-80 text-[40px] tracking-[0] leading-[41.2px]" data-aos="fade-up" data-aos-delay="300">
            CNNCT eliminates the back-and-forth of scheduling meetings so you can
            focus on what matters. Set your availability, share your link, and let
            others book time with you instantly.
          </p>
          
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-10 mt-12">
            <div className="md:w-1/2" data-aos="fade-right" data-aos-delay="200">
              <p className="font-semibold text-2xl md:text-3xl mb-4 text-left [font-family:'Inter-SemiBold',Helvetica] text-black text-[40px] tracking-[0] leading-[41.2px] whitespace-nowrap">
                Stay Organized with Your<br/> Calendar &amp; Meetings
              </p>
              
              <p className="text-lg mt-6 text-left [font-family:'Inter-Regular',Helvetica] font-normal text-black opacity-100 text-[40px] tracking-[0] leading-[41.2px] ">
                Seamless Event Scheduling
                <ul className="list-disc list-inside text-lg text-black space-y-12 text-[18px] leading-[32px] mt-4">
                  <li data-aos="fade-up" data-aos-delay="300">View all your upcoming meetings and appointments in one place.</li>
                  <li data-aos="fade-up" data-aos-delay="400">Syncs with Google Calendar, Outlook, and iCloud to avoid conflicts.</li>
                  <li data-aos="fade-up" data-aos-delay="500">Customize event types: one-on-ones, team meetings, group <br/>sessions, and webinars.</li>
                </ul>
              </p>
                </div>
                
            <div className="md:w-1/2 relative" data-aos="fade-left" data-aos-delay="400">
              <img
                className="w-full max-w-[400px] object-cover ml-[75px]"
                alt="Screen"
                src="https://res.cloudinary.com/dvvhyfrjr/image/upload/v1742547749/ofwgixam6xnbq6z7thzh.png"
              />
              
              <img
                className="w-[300px] absolute top-6 left-0 hidden md:block"
                alt="Fantastical"
                src="https://res.cloudinary.com/dvvhyfrjr/image/upload/v1742547750/ckwrvu3mfzfn1jdkn3ip.png"
                data-aos="zoom-in"
                data-aos-delay="600"
              />
                        </div>
                      </div>
                    </div>
                    
        <div className="pt-20 pb-20 flex flex-wrap w-[1257px] items-start gap-[16px_197px] relative">
          <p className="relative w-[660px] mt-[-1.00px] [font-family:'Poppins-Regular',Helvetica] font-normal text-transparent text-5xl tracking-[-0.96px] leading-[48px]" data-aos="fade-right">
            <span className="text-black tracking-[-0.46px]">
              Here&#39;s what our{" "} 
            </span>

            <span className="text-[#1877f2] tracking-[-0.46px]">
              customer
              <br />
            </span>

            <span className="text-black tracking-[-0.46px]">has to says</span>
          </p>

          <div className="flex flex-wrap w-[400px] items-center justify-center gap-[16px_16px] relative" data-aos="fade-left" data-aos-delay="200">
            <img className="relative w-8 h-8" alt="Icon" src="https://res.cloudinary.com/dvvhyfrjr/image/upload/v1742549448/gajds2niue3lzexcs288.png" />

            <p className="relative w-[300px] mt-[-1.00px] [font-family:'Poppins-Medium',Helvetica] font-medium text-[#1e1e1e] text-sm tracking-[0] leading-4">
              [short description goes in here] lorem ipsum is a placeholder text to
              demonstrate.
            </p>
                    </div>
                    
          <button 
            className="all-[unset] box-border inline-flex items-center justify-center gap-2.5 px-6 py-3 relative flex-[0_0_auto] rounded-[99px] border-2 border-solid border-[#1877f2] cursor-pointer hover:bg-[#f0f7ff] transition-colors"
            onClick={() => navigate('/testimonials')}
            data-aos="fade-up"
            data-aos-delay="300"
          >
            <div className="pt-2 relative w-fit mt-[-2.00px] [font-family:'Poppins-Regular',Helvetica] font-normal text-[#1877f2] text-base tracking-[0] leading-6 whitespace-nowrap">
              Read customer stories
                        </div>
          </button>
                  </div>
                  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-[32px] shadow-lg" data-aos="flip-left" data-aos-delay="100">
            <p className="font-light text-xl mb-4">
              Amazing tool! Saved me months
            </p>
            
            <p className="text-base mb-6">
              This is a placeholder for your testimonials and what your
              client has to say, put them here and make sure its 100% true
              and meaningful.
            </p>
            
            <div className="flex items-center gap-4">
              <div className="w-[52px] h-[52px] bg-[#1877f2] rounded-full border-2 border-solid border-[#e3e3e3] relative overflow-hidden">
                <img 
                  src="https://res.cloudinary.com/dvvhyfrjr/image/upload/v1742151485/images/ylkw5ihurat4cel34edf.jpg" 
                  alt="Profile" 
                  className="object-cover w-full h-full"
                />
              </div>
              <div>
                <div className="font-light text-base">John Master</div>
                <div className="text-sm text-[#3c3c3c]">Director, Spark.com</div>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-[#dedede] rounded-[32px] shadow-lg" data-aos="flip-right" data-aos-delay="200">
            <p className="font-light text-xl mb-4 ">
              Amazing tool! Saved me months
            </p>
            
            <p className="text-base mb-6">
              This is a placeholder for your testimonials and what your
              client has to say, put them here and make sure its 100% true
              and meaningful.
            </p>
            
            <div className="flex items-center gap-4">
              <div className="w-[52px] h-[52px] bg-[#1877f2] rounded-full border-2 border-solid border-[#e3e3e3] relative overflow-hidden">
                <img 
                  src="https://res.cloudinary.com/dvvhyfrjr/image/upload/v1742151486/images/mctrb4uru89jqxuoa9ly.jpg" 
                  alt="Profile" 
                  className="object-cover w-full h-full"
                />
                </div>
                  <div>
                <div className="font-light text-base">John Master</div>
                <div className="text-sm text-[#3c3c3c]">Director, Spark.com</div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-[#f0f7ff] rounded-[32px] shadow-lg" data-aos="flip-left" data-aos-delay="300">
            <p className="font-light text-xl mb-4">
              Simplified our team scheduling
            </p>
            
            <p className="text-base mb-6">
              CNNCT has completely transformed how our team manages meetings.
              The intuitive interface and conflict detection have saved us
              countless hours of back-and-forth emails.
            </p>
            
            <div className="flex items-center gap-4">
              <div className="w-[52px] h-[52px] bg-[#1877f2] rounded-full border-2 border-solid border-[#e3e3e3] relative overflow-hidden">
                <img 
                  src="https://res.cloudinary.com/dvvhyfrjr/image/upload/v1742151485/images/zeu7w2gwmfoif6mzk84s.jpg" 
                  alt="Profile" 
                  className="object-cover w-full h-full"
              />
            </div>
              <div>
                <div className="font-light text-base">Sarah Johnson</div>
                <div className="text-sm text-[#3c3c3c]">Product Manager, TechFlow</div>
        </div>
            </div>
          </div>
          
          <div className="p-6 bg-white rounded-[32px] shadow-lg" data-aos="flip-right" data-aos-delay="400">
            <p className="font-light text-xl mb-4">
              Perfect for client meetings
            </p>
            
            <p className="text-base mb-6">
              As a consultant, I need to schedule dozens of client meetings each week.
              CNNCT's availability settings and timezone handling have eliminated
              scheduling conflicts completely.
            </p>
            
            <div className="flex items-center gap-4">
              <div className="w-[52px] h-[52px] bg-[#1877f2] rounded-full border-2 border-solid border-[#e3e3e3] relative overflow-hidden">
                <img 
                  src="https://res.cloudinary.com/dvvhyfrjr/image/upload/v1742151485/images/ylkw5ihurat4cel34edf.jpg" 
                  alt="Profile" 
                  className="object-cover w-full h-full"
                />
                  </div>
                  <div>
                <div className="font-light text-base">Michael Chen</div>
                <div className="text-sm text-[#3c3c3c]">Independent Consultant</div>
              </div>
            </div>
          </div>
        </div>
        
        <footer className="mt-24 w-full p-6 bg-white rounded-xl shadow-lg" data-aos="fade-up">
          <div className="flex flex-wrap gap-8 justify-between mb-8">
            <div className="w-full md:w-auto">
              <div className="flex gap-4 mb-6">
                <div 
                  className="px-4 py-2 bg-[#eff0ec] rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={handleLogin}
                >
                  Log in
                </div>
                <div 
                  className="px-4 py-2 bg-[#1877f2] text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
                  onClick={handleSignUp}
                >
                  Sign up free
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-8 md:gap-12">
              <div className="w-[120px]" data-aos="fade-up" data-aos-delay="100">
                <div className="font-bold text-xs mb-4">About CNNCT</div>
                <div className="font-bold text-xs mb-2">Blog</div>
                <div className="font-bold text-xs mb-2">Press</div>
                <div className="font-bold text-xs mb-2">Social Good</div>
                <div className="font-bold text-xs">Contact</div>
          </div>
          
              <div className="w-[120px]" data-aos="fade-up" data-aos-delay="200">
                <div className="font-bold text-xs mb-4">Careers</div>
                <div className="font-bold text-xs mb-2">Getting Started</div>
                <div className="font-bold text-xs mb-2">Features and How-Tos</div>
                <div className="font-bold text-xs mb-2">FAQs</div>
                <div className="font-bold text-xs">Report a Violation</div>
            </div>
              
              <div className="w-[120px]" data-aos="fade-up" data-aos-delay="300">
                <div className="font-bold text-xs mb-4">Terms and Conditions</div>
                <div className="font-bold text-xs mb-2">Privacy Policy</div>
                <div className="font-bold text-xs mb-2">Cookie Notice</div>
                <div className="font-bold text-xs">Trust Center</div>
            </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-t pt-4">
            <p className="text-xs max-w-[600px] mb-4 md:mb-0">
              We acknowledge the Traditional Custodians of the land on which
              our office stands, The Wurundjeri people of the Kulin Nation,
              and pay our respects to Elders past, present and emerging.
            </p>
            
            <div className="flex gap-4">
              <img
                className="w-8 h-8"
                alt="Cbi plug eu"
                src={cbiPlugEu2}
              />
          </div>
          </div>
        </footer>
        </div>
    </div>
  );
};

// Add default export
export default function Landing() {
  return <MacbookPro />;
}