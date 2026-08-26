"use client";

import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import VotingBooth from "@/components/landing/VotingBooth";
import ResultsAudit from "@/components/landing/ResultsAudit";
import ContractDetails from "@/components/landing/ContractDetails";
import Features from "@/components/landing/Features";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-cyan/20 selection:text-cyan">
      <Navbar />
      <main>
        <Hero />
        <VotingBooth />
        <ResultsAudit />
        <ContractDetails />
        <Features />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
