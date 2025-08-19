import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "../lib/auth";
import { useBitcoinPrice } from "../lib/bitcoin";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Bitcoin,
  Shield,
  TrendingUp,
  Headphones,
  Circle,
  Trophy,
  CreditCard,
  Gem,
  ChartBar,
  Star,
  ThumbsUp,
} from "lucide-react";

interface HomeProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

export function Home({ onLoginClick, onSignupClick }: HomeProps) {
  const { data: user } = useAuth();
  const { data: bitcoinPrice } = useBitcoinPrice();
  const [livePayouts, setLivePayouts] = useState<any[]>([]);

  const plans = [
    {
      id: "basic",
      name: "Basic Plan",
      icon: Circle,
      investment: 500,
      returns: 2000,
      roi: 300,
      multiplier: "4.0x",
      duration: 7,
      popular: false,
    },
    {
      id: "gold",
      name: "Gold Plan",
      icon: Trophy,
      investment: 1000,
      returns: 6500,
      roi: 550,
      multiplier: "6.5x",
      duration: 7,
      popular: true,
    },
    {
      id: "platinum",
      name: "Platinum Plan",
      icon: CreditCard,
      investment: 2000,
      returns: 15000,
      roi: 650,
      multiplier: "7.5x",
      duration: 7,
      popular: false,
    },
    {
      id: "diamond",
      name: "Diamond Plan",
      icon: Gem,
      investment: 5000,
      returns: 50000,
      roi: 900,
      multiplier: "10x",
      duration: 7,
      popular: false,
    },
  ];

  const payoutData = [
    {
      name: "James W.",
      plan: "Platinum Plan",
      amount: 15000,
      time: "1 min ago",
    },
    { name: "Alex K.", plan: "Gold Plan", amount: 6500, time: "5 min ago" },
    { name: "Maria S.", plan: "Basic Plan", amount: 2000, time: "8 min ago" },
    {
      name: "Chen L.",
      plan: "Diamond Plan",
      amount: 50000,
      time: "12 min ago",
    },
    {
      name: "Ahmed R.",
      plan: "Platinum Plan",
      amount: 15000,
      time: "18 min ago",
    },
  ];

  useEffect(() => {
    const updatePayouts = () => {
      const shuffled = [...payoutData]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      setLivePayouts(shuffled);
    };

    updatePayouts();
    const interval = setInterval(updatePayouts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStartInvesting = () => {
    if (user && user.role !== "admin") {
      window.location.href = "/dashboard";
    } else if (!user) {
      onSignupClick();
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center crypto-bg-black"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Grow Your Wealth with{" "}
            <span className="crypto-text-gold">Bitcoin</span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Bitcoin is secure, limited in supply, borderless, and has made
            thousands of millionaires. Join the digital revolution and multiply
            your investment with our proven strategies.
          </p>

          {/* Live Bitcoin Price */}
          <Card className="crypto-bg-gray border-gray-600 mb-8 max-w-md mx-auto shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-2">
                <Bitcoin className="crypto-text-gold h-8 w-8 mr-2" />
                <span className="text-gray-300 font-medium">
                  Live Bitcoin Price
                </span>
              </div>
              <div className="text-3xl md:text-4xl font-bold crypto-text-gold mb-1">
                ${bitcoinPrice?.price?.toLocaleString() || "117,672.00"}
              </div>
              <div
                className={`text-sm flex items-center justify-center ${
                  bitcoinPrice?.change && bitcoinPrice.change > 0
                    ? "crypto-text-success"
                    : "crypto-text-error"
                }`}
              >
                <ChartBar className="w-4 h-4 mr-1" />
                {bitcoinPrice?.change
                  ? `${
                      bitcoinPrice.change > 0 ? "+" : ""
                    }${bitcoinPrice.change.toFixed(2)}%`
                  : "+0.96%"}{" "}
                (24h)
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleStartInvesting}
              size="lg"
              className="crypto-bg-gold text-black hover:bg-yellow-400 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Start Investing Now
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-2 crypto-border-gold crypto-text-gold hover:crypto-bg-gold hover:text-black px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200"
            >
              <a href="#how-it-works">Learn More</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Investment Plans Section */}
      <section id="plans" className="py-16 crypto-bg-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Investment Plans
            </h2>
            <p className="text-xl text-gray-300">
              Choose the plan that fits your investment goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card
                  key={plan.id}
                  className={`crypto-bg-gray border-gray-600 hover:crypto-border-gold transition-all duration-300 relative hover:shadow-2xl hover:transform hover:scale-105 ${
                    plan.popular ? "border-2 crypto-border-gold shadow-lg" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="crypto-bg-gold text-black px-3 py-1 text-sm font-semibold rounded-full">
                        POPULAR
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <Icon className="crypto-text-gold h-12 w-12 mx-auto mb-3" />
                      <h3 className="text-xl font-semibold text-white">
                        {plan.name}
                      </h3>
                    </div>
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold crypto-text-gold mb-2">
                        ${plan.investment.toLocaleString()}
                      </div>
                      <div className="text-gray-300 text-sm">
                        Minimum Investment
                      </div>
                    </div>
                    <div className="crypto-bg-black rounded-lg p-4 mb-6">
                      <div className="text-center">
                        <div className="text-gray-300 text-sm mb-1">
                          Returns in {plan.duration} days
                        </div>
                        <div className="text-2xl font-bold crypto-text-success">
                          ${plan.returns.toLocaleString()}
                        </div>
                        <div className="crypto-text-gold text-sm font-semibold">
                          {plan.roi}% ROI
                        </div>
                        <div className="text-gray-400 text-xs">
                          {plan.multiplier} multiplier
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() =>
                        user
                          ? (window.location.href = "/dashboard")
                          : onSignupClick()
                      }
                      className="w-full crypto-bg-gold text-black hover:bg-yellow-400 font-semibold py-3 rounded-lg transition-all duration-200"
                    >
                      Select Plan
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Live Payouts Section */}
      <section className="py-16 crypto-bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Live Payouts
            </h2>
            <p className="text-xl text-gray-300">
              Real-time payments to our investors
            </p>
          </div>

          <Card className="crypto-bg-gray border-gray-600 max-w-4xl mx-auto shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">
                  Recent Transactions
                </h3>
                <div className="flex items-center crypto-text-success text-sm font-medium">
                  <div className="w-2 h-2 crypto-bg-success rounded-full mr-2 animate-pulse"></div>
                  Live
                </div>
              </div>

              <div className="space-y-4">
                {livePayouts.map((payout, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 crypto-bg-black rounded-lg hover:bg-gray-800 transition-colors duration-200"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 crypto-bg-gold rounded-full flex items-center justify-center mr-4">
                        <span className="text-black font-semibold">
                          {payout.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          {payout.name}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {payout.plan}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="crypto-text-success font-semibold text-lg">
                        ${payout.amount.toLocaleString()}
                      </div>
                      <div className="text-gray-400 text-sm">{payout.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Why Choose Bitcoin Investment Section */}
      <section id="about" className="py-16 crypto-bg-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-8">
                Why Choose Bitcoin Investment?
              </h2>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="crypto-bg-gold rounded-lg p-3 mr-4">
                    <Shield className="text-black h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Secure & Regulated
                    </h3>
                    <p className="text-gray-300">
                      Our platform uses bank-level security and follows strict
                      regulatory compliance to protect your investments.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="crypto-bg-gold rounded-lg p-3 mr-4">
                    <TrendingUp className="text-black h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Proven Returns
                    </h3>
                    <p className="text-gray-300">
                      Our expert trading algorithms have consistently delivered
                      exceptional returns for our investors since 2019.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="crypto-bg-gold rounded-lg p-3 mr-4">
                    <Headphones className="text-black h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
                    <p className="text-gray-300">
                      Our dedicated support team is available around the clock
                      to assist you with any questions or concerns.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <Card className="crypto-bg-gray border-gray-600 p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-transparent"></div>
                <div className="relative z-10">
                  <ChartBar className="crypto-text-gold h-16 w-16 mb-4" />
                  <h3 className="text-2xl font-bold mb-4">
                    Professional Trading
                  </h3>
                  <p className="text-gray-300">
                    Advanced algorithms and market analysis ensure optimal
                    investment performance.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 crypto-bg-black">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 crypto-bg-dark rounded-lg shadow-md">
              <Star className="crypto-text-gold h-10 w-10 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Choose a Plan
              </h3>
              <p className="text-gray-300">
                Browse our carefully designed investment plans tailored to your
                goals.
              </p>
            </div>
            <div className="p-6 crypto-bg-dark rounded-lg shadow-md">
              <Bitcoin className="crypto-text-gold h-10 w-10 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Deposit Bitcoin
              </h3>
              <p className="text-gray-300">
                Deposit your Bitcoin securely using our seamless payment
                interface.
              </p>
            </div>
            <div className="p-6 crypto-bg-dark rounded-lg shadow-md">
              <TrendingUp className="crypto-text-gold h-10 w-10 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Watch it Grow
              </h3>
              <p className="text-gray-300">
                Sit back and watch your investment grow with our automated
                trading system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 crypto-bg-dark">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-12">
            What Our Investors Say
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 crypto-bg-black rounded-lg shadow-md">
              <p className="text-gray-300 italic mb-4">
                “CryptoPay helped me multiply my savings in just one week. Best
                decision I made in 2024!”
              </p>
              <div className="font-semibold crypto-text-gold">Samantha L.</div>
            </div>
            <div className="p-6 crypto-bg-black rounded-lg shadow-md">
              <p className="text-gray-300 italic mb-4">
                “I was skeptical at first, but the support and returns are
                unmatched. Highly recommended!”
              </p>
              <div className="font-semibold crypto-text-gold">Marcus G.</div>
            </div>
            <div className="p-6 crypto-bg-black rounded-lg shadow-md">
              <p className="text-gray-300 italic mb-4">
                “Simple process, secure platform, and real results. CryptoPay
                delivers on its promise.”
              </p>
              <div className="font-semibold crypto-text-gold">Angela R.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="contact"
        className="crypto-bg-black border-t border-gray-600 py-12"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Bitcoin className="crypto-text-gold h-8 w-8 mr-2" />
                <span className="text-xl font-bold crypto-text-gold">
                  CryptoPay
                </span>
              </div>
              <p className="text-gray-300">
                Your trusted partner in cryptocurrency investment. We provide
                secure, profitable, and transparent investment opportunities in
                the digital currency market.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#about"
                    className="text-gray-300 crypto-hover-gold transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#plans"
                    className="text-gray-300 crypto-hover-gold transition-colors"
                  >
                    Investment Plans
                  </a>
                </li>
                <li>
                  <a
                    href="/faq"
                    className="text-gray-300 crypto-hover-gold transition-colors"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="text-gray-300 crypto-hover-gold transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
              <ul className="space-y-2">
                <li className="text-gray-300">thecryptopayteam@gmail.com</li>
                <li className="text-gray-300">+1 (865) 356-5182</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-600 mt-8 pt-8 text-center">
            <p className="text-gray-300">
              &copy; 2025 CryptoPay. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
