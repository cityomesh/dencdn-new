// app/servers/page.tsx
"use client";

import ServersPageContent from "../../components/Servers/ServersPageContent";
import Header from "../../components/Header";

const ServersPage = () => {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <ServersPageContent />
    </div>
  );
};

export default ServersPage;