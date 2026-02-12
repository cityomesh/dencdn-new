// app/homepage/page.tsx
"use client";

import Homepage from "../../components/Homepage"
import Header from "../../components/Header";

const HomepagePage = () => {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <Homepage />
    </div>
  );
};

export default HomepagePage;