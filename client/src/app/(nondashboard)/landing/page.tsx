import React from "react";
import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";
import DiscoverSection from "./DiscoverSection";
import CallToActionSection from "./CallToActionSection";
import FooterSection from "./FooterSection";
import NewsLetter from "@/components/NewsLetter";
import CTA from "@/components/CTA";

const Landing = () => {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <DiscoverSection />
      <CallToActionSection />
      <CTA/>
      <NewsLetter/>
      <FooterSection />
    </div>
  );
};

export default Landing;
