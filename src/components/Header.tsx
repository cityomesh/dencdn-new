// // components/Header.tsx
// "use client";
// import React, { useState, useEffect } from "react";
// import Link from "next/link";
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
// import CreateRouteModal from "./CreateRouteModal";

// interface Server {
//   id: number;
//   displayName: string;
//   ipAddress: string;
//   sshUsername: string;
//   sshPassword: string;
//   port: string;
//   sshPort?: number;
//   serverType: "origin" | "edge";
// }

// interface HeaderProps {
//   onCreateRoute?: (data: { originUrls: string[]; selectedServers: Server[] }) => void;
// }

// const Header: React.FC<HeaderProps> = ({ onCreateRoute }) => {
//   const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [isScrolled, setIsScrolled] = useState(false);
//   const [isCreateRouteModalOpen, setCreateRouteModalOpen] = useState(false);
//   const [servers, setServers] = useState<Server[]>([]);
//   const [loggedInUser, setLoggedInUser] = useState<string>("");
//   const router = useRouter();

//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 20);
//     };
//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   useEffect(() => {
//     const user = localStorage.getItem('loggedInUser');
//     if (user) {
//       setLoggedInUser(user);
//     } else {
//       setLoggedInUser("rcastcdn");
//       localStorage.setItem('loggedInUser', "rcastcdn");
//     }
//   }, []);

//   useEffect(() => {
//     fetchServers();
//   }, []);

//   const fetchServers = async () => {
//     try {
//       const response = await fetch('/api/servers');
//       const data = await response.json();
      
//       if (data.success) {
//         setServers(data.servers);
//         console.log("Loaded servers from API:", data.servers.length);
//       } else {
//         console.error("Failed to load servers:", data.error);
//       }
//     } catch (error) {
//       console.error("Error fetching servers:", error);
//     }
//   };

//   const handleAdminLogout = () => {
//     localStorage.removeItem('loggedInUser');
//     router.push("/");
//   };

//   const handleCreateRoute = (data: { originUrls: string[]; selectedServers: Server[] }) => {
//     console.log("Creating route from Header:", data);
    
//     // If onCreateRoute prop is provided, call it (for Homepage)
//     if (onCreateRoute) {
//       onCreateRoute(data);
//     }
    
//     // Close modal
//     setCreateRouteModalOpen(false);
//   };

//   return (
//     <>
//       <header
//         className={`fixed top-0 left-0 w-full z-50 shadow-md transition-all duration-500 ease-in-out ${
//           isScrolled ? "bg-red-700/90 backdrop-blur-sm py-3" : "bg-yellow-700 py-4"
//         }`}
//       >
//         <div className="container mx-auto px-6 flex items-center justify-between">
          
//           <div className="flex items-center space-x-4">
//             <div className="relative w-30 h-30">
//               <Image
//                 src="/Rcast.webp"
//                 alt="Rcast Logo"
//                 width={80}
//                 height={80}
//                 className="object-contain w-full h-full"
//                 priority
//               />
//             </div>
            
//             <Link 
//               href="/homepage"
//               className="text-xl font-bold text-white hover:text-gray-200 transition-colors"
//             >
//               CDN Management System
//             </Link>
//           </div>

//           <nav className="hidden md:block">
//             <ul className="flex items-center space-x-8">
//               <li>
//                 <Link
//                   href="/servers"
//                   className="text-white hover:text-gray-200 font-medium transition-colors"
//                 >
//                   Servers
//                 </Link>
//               </li>
//               <li>
//                 <button
//                   onClick={() => setCreateRouteModalOpen(true)}
//                   className="text-white hover:text-gray-200 font-medium transition-colors"
//                 >
//                   Route-Server Assignments
//                 </button>
//               </li>
//               <li>
//                 <Link
//                   href="/user-management"
//                   className="text-white hover:text-gray-200 font-medium transition-colors"
//                 >
//                   User Management
//                 </Link>
//               </li>
//             </ul>
//           </nav>

//           <div className="flex items-center space-x-4">
//             <div className="hidden md:flex items-center gap-2 text-white bg-white/10 px-3 py-1.5 rounded-lg">
//               <FaUserCircle className="text-xl" />
//               <span className="text-sm font-medium">{loggedInUser}</span>
//             </div>
            
//             <button
//               onClick={handleAdminLogout}
//               className="px-4 py-2 bg-white text-red-700 font-semibold rounded hover:bg-gray-100 transition-colors"
//             >
//               Logout
//             </button>

//             {/* Mobile Menu Button */}
//             <button
//               className="md:hidden text-white p-2"
//               onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
//             >
//               {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
//             </button>
//           </div>
//         </div>

//         {/* Mobile Menu */}
//         <div
//           className={`md:hidden bg-blue-800 border-t border-blue-700 transition-all duration-300 ${
//             isMobileMenuOpen 
//               ? "max-h-96 opacity-100 py-4" 
//               : "max-h-0 opacity-0 overflow-hidden"
//           }`}
//         >
//           <div className="container mx-auto px-6">
//             {/* Mobile User Info */}
//             <div className="flex items-center gap-3 mb-4 pb-4 border-b border-blue-700">
//               <FaUserCircle className="text-2xl text-white" />
//               <span className="text-white font-medium">{loggedInUser}</span>
//             </div>

//             <ul className="space-y-4">
//               <li>
//                 <Link
//                   href="/servers"
//                   className="block py-2 text-white hover:text-gray-200 text-lg"
//                   onClick={() => setMobileMenuOpen(false)}
//                 >
//                   Servers
//                 </Link>
//               </li>
//               <li>
//                 <button
//                   onClick={() => {
//                     setCreateRouteModalOpen(true);
//                     setMobileMenuOpen(false);
//                   }}
//                   className="text-lg text-white hover:text-gray-200 transition-colors"
//                 >
//                   Route-Server Assignments
//                 </button>
//               </li>
//               <li>
//                 <Link
//                   href="/user-management"
//                   className="block py-2 text-white hover:text-gray-200 text-lg"
//                   onClick={() => setMobileMenuOpen(false)}
//                 >
//                   User Management
//                 </Link>
//               </li>
//               <li className="pt-4 border-t border-blue-700">
//                 <button
//                   onClick={() => {
//                     handleAdminLogout();
//                     setMobileMenuOpen(false);
//                   }}
//                   className="w-full px-4 py-2 bg-white text-blue-700 font-semibold rounded hover:bg-gray-100 transition-colors text-center"
//                 >
//                   Logout
//                 </button>
//               </li>
//             </ul>
//           </div>
//         </div>
//       </header>

//       {/* Create Route Modal */}
//       <CreateRouteModal
//         isOpen={isCreateRouteModalOpen}
//         onClose={() => setCreateRouteModalOpen(false)}
//         onSubmit={handleCreateRoute}
//         availableServers={servers}
//       />
//     </>
//   );
// };

// export default Header;



// components/Header.tsx
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
import CreateRouteModal from "./CreateRouteModal";

interface Server {
  id: number;
  displayName: string;
  ipAddress: string;
  sshUsername: string;
  sshPassword: string;
  port: string;
  sshPort?: number;
  serverType: "origin" | "edge";
}

interface HeaderProps {
  onCreateRoute?: (data: { originUrls: string[]; selectedServers: Server[] }) => Promise<void>; // Changed to Promise<void>
}

const Header: React.FC<HeaderProps> = ({ onCreateRoute }) => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCreateRouteModalOpen, setCreateRouteModalOpen] = useState(false);
  const [servers, setServers] = useState<Server[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const user = localStorage.getItem('loggedInUser');
    if (user) {
      setLoggedInUser(user);
    } else {
      setLoggedInUser("rcastcdn");
      localStorage.setItem('loggedInUser', "rcastcdn");
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const response = await fetch('/api/servers');
      const data = await response.json();
      
      if (data.success) {
        setServers(data.servers);
        console.log("Loaded servers from API:", data.servers.length);
      } else {
        console.error("Failed to load servers:", data.error);
      }
    } catch (error) {
      console.error("Error fetching servers:", error);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('loggedInUser');
    router.push("/");
  };

  // Make this function async and return Promise
  const handleCreateRoute = async (data: { originUrls: string[]; selectedServers: Server[] }) => {
    console.log("Creating route from Header:", data);
    
    // If onCreateRoute prop is provided, call it (for Homepage)
    if (onCreateRoute) {
      await onCreateRoute(data); // Await the promise
    }
    
    // Close modal
    setCreateRouteModalOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 shadow-md transition-all duration-500 ease-in-out ${
          isScrolled ? "bg-red-700/90 backdrop-blur-sm py-3" : "bg-yellow-700 py-4"
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          
          <div className="flex items-center space-x-4">
            <div className="relative w-30 h-30">
              <Image
                src="/Rcast.webp"
                alt="Rcast Logo"
                width={80}
                height={80}
                className="object-contain w-full h-full"
                priority
              />
            </div>
            
            <Link 
              href="/homepage"
              className="text-xl font-bold text-white hover:text-gray-200 transition-colors"
            >
              CDN Management System
            </Link>
          </div>

          <nav className="hidden md:block">
            <ul className="flex items-center space-x-8">
              <li>
                <Link
                  href="/servers"
                  className="text-white hover:text-gray-200 font-medium transition-colors"
                >
                  Servers
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setCreateRouteModalOpen(true)}
                  className="text-white hover:text-gray-200 font-medium transition-colors"
                >
                  Route-Server Assignments
                </button>
              </li>
              <li>
                <Link
                  href="/user-management"
                  className="text-white hover:text-gray-200 font-medium transition-colors"
                >
                  User Management
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center gap-2 text-white bg-white/10 px-3 py-1.5 rounded-lg">
              <FaUserCircle className="text-xl" />
              <span className="text-sm font-medium">{loggedInUser}</span>
            </div>
            
            <button
              onClick={handleAdminLogout}
              className="px-4 py-2 bg-white text-red-700 font-semibold rounded hover:bg-gray-100 transition-colors"
            >
              Logout
            </button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden bg-blue-800 border-t border-blue-700 transition-all duration-300 ${
            isMobileMenuOpen 
              ? "max-h-96 opacity-100 py-4" 
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="container mx-auto px-6">
            {/* Mobile User Info */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-blue-700">
              <FaUserCircle className="text-2xl text-white" />
              <span className="text-white font-medium">{loggedInUser}</span>
            </div>

            <ul className="space-y-4">
              <li>
                <Link
                  href="/servers"
                  className="block py-2 text-white hover:text-gray-200 text-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Servers
                </Link>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCreateRouteModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-lg text-white hover:text-gray-200 transition-colors"
                >
                  Route-Server Assignments
                </button>
              </li>
              <li>
                <Link
                  href="/user-management"
                  className="block py-2 text-white hover:text-gray-200 text-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  User Management
                </Link>
              </li>
              <li className="pt-4 border-t border-blue-700">
                <button
                  onClick={() => {
                    handleAdminLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-white text-blue-700 font-semibold rounded hover:bg-gray-100 transition-colors text-center"
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </header>

      {/* Create Route Modal */}
      <CreateRouteModal
        isOpen={isCreateRouteModalOpen}
        onClose={() => setCreateRouteModalOpen(false)}
        onSubmit={handleCreateRoute}
        availableServers={servers}
      />
    </>
  );
};

export default Header;
