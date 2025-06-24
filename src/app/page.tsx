"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Target, Rocket, ArrowRight, Users, Award, BarChart3, Gift, BookOpen, MessageCircle, Clock, Star, Zap, Shield, Brain, PieChart, TrendingDown, Volume2, Eye, DollarSign } from "lucide-react";

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);

const FloatingCard = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
      {children}
    </div>
  );
};

export default function LandingPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (typeof result !== "string") {
      router.push("/dashboard");
    } else {
      if (!result.includes("auth/popup-closed-by-user")) {
        console.error("Google Sign-In Error:", result);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-2 text-sm text-slate-600">Loading...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-2 text-sm text-slate-600">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Floating geometric shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-blue-300 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute bottom-40 left-20 w-20 h-20 bg-blue-400 rounded-full opacity-25 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-blue-500 rounded-full opacity-20 animate-bounce"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 py-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent">
              Oday AI
            </span>
          </div>
          <Button 
            variant="outline" 
            onClick={handleGoogleSignIn} 
            className="border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-24">
        <div className="text-center">
          <FloatingCard>
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-8">
              <Award className="w-4 h-4 mr-2" />
              Complete AI Trading Analysis Platform
            </div>
          </FloatingCard>
          
          <FloatingCard delay={200}>
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-900 via-blue-700 to-blue-800 bg-clip-text text-transparent">
                AI-Powered
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                Chart Analysis
              </span>
            </h1>
          </FloatingCard>

          <FloatingCard delay={400}>
            <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Upload any trading chart and get complete AI analysis with 
              <span className="font-semibold text-slate-800"> Entry/Exit points, Risk Management, and Islamic-compliant strategies.</span>
            </p>
          </FloatingCard>

          <FloatingCard delay={600}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button
                size="lg"
                onClick={handleGoogleSignIn}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <GoogleIcon />
                Start Free Analysis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <div className="text-sm text-slate-500">
                <p className="font-medium">✨ 2 Free Chart Uploads</p>
                <p>Then upgrade for unlimited access</p>
              </div>
            </div>
          </FloatingCard>

          {/* Pricing Preview */}
          <FloatingCard delay={800}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-20">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600 mb-2">FREE</div>
                <div className="text-sm text-slate-600 mb-4">2 Chart Uploads</div>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li>✓ Basic AI Analysis</li>
                  <li>✓ Entry/Exit Points</li>
                  <li>✓ Islamic Compliance Check</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-xl text-white transform scale-105">
                <div className="text-2xl font-bold mb-2">PRO</div>
                <div className="text-sm opacity-90 mb-4">Unlimited Access</div>
                <ul className="text-sm space-y-2">
                  <li>✓ All AI Features</li>
                  <li>✓ Live Training & Quizzes</li>
                  <li>✓ Trading News & Updates</li>
                  <li>✓ Prayer Times & Islamic Features</li>
                  <li>✓ Priority Support</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700 mb-2">GIFTS</div>
                <div className="text-sm text-slate-600 mb-4">Special Rewards</div>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li>🎁 Free Uploads for Muslims</li>
                  <li>🎁 Referral Bonuses</li>
                  <li>🎁 Special Occasions</li>
                </ul>
              </div>
            </div>
          </FloatingCard>
        </div>
      </main>

      {/* AI Analysis Features */}
      <section className="relative z-10 py-24 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Complete AI Trading Analysis
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Every chart upload gets comprehensive analysis with actionable insights
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <FloatingCard delay={100}>
              <div className="group p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-blue-300">
                <Brain className="h-10 w-10 text-blue-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">AI Strategy Session</h3>
                <p className="text-sm text-slate-600">Complete trading strategy with market context</p>
              </div>
            </FloatingCard>

            <FloatingCard delay={200}>
              <div className="group p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-blue-400">
                <TrendingUp className="h-10 w-10 text-blue-700 mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">Trend Detection</h3>
                <p className="text-sm text-slate-600">Identify market trends and direction</p>
              </div>
            </FloatingCard>

            <FloatingCard delay={300}>
              <div className="group p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-blue-500">
                <BarChart3 className="h-10 w-10 text-blue-800 mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">Candlestick Analysis</h3>
                <p className="text-sm text-slate-600">Pattern recognition and signals</p>
              </div>
            </FloatingCard>

            <FloatingCard delay={400}>
              <div className="group p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-blue-600">
                <Volume2 className="h-10 w-10 text-blue-500 mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">Volume & Momentum</h3>
                <p className="text-sm text-slate-600">Market strength and momentum analysis</p>
              </div>
            </FloatingCard>

            <FloatingCard delay={500}>
              <div className="group p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-blue-700">
                <Shield className="h-10 w-10 text-blue-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">Risk/Reward Analysis</h3>
                <p className="text-sm text-slate-600">Complete risk assessment and ratios</p>
              </div>
            </FloatingCard>

            <FloatingCard delay={600}>
              <div className="group p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-blue-800">
                <Target className="h-10 w-10 text-blue-700 mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">Entry • TP • SL</h3>
                <p className="text-sm text-slate-600">Precise entry, take profit, stop loss levels</p>
              </div>
            </FloatingCard>

            <FloatingCard delay={700}>
              <div className="group p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-blue-400">
                <Star className="h-10 w-10 text-blue-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">Islamic Principles</h3>
                <p className="text-sm text-slate-600">Sharia-compliant trading analysis</p>
              </div>
            </FloatingCard>

            <FloatingCard delay={800}>
              <div className="group p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-blue-500">
                <Eye className="h-10 w-10 text-blue-800 mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">Detailed Explanation</h3>
                <p className="text-sm text-slate-600">Step-by-step reasoning and education</p>
              </div>
            </FloatingCard>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Complete Trading Platform
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need for successful trading in one platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FloatingCard delay={200}>
              <div className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100 hover:border-blue-200 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">Trading News & Market Updates</h3>
                <p className="text-slate-600 leading-relaxed">
                  Stay updated with latest trading news, market analysis, and economic events that impact your trades.
                </p>
              </div>
            </FloatingCard>

            <FloatingCard delay={400}>
              <div className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100 hover:border-emerald-200 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">Live Training & Quizzes</h3>
                <p className="text-slate-600 leading-relaxed">
                  Interactive chart reading lessons, live training sessions, and quizzes to improve your trading skills.
                </p>
              </div>
            </FloatingCard>

            <FloatingCard delay={600}>
              <div className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100 hover:border-purple-200 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">Feedback & Support</h3>
                <p className="text-slate-600 leading-relaxed">
                  Get answers to all your trading questions with our dedicated feedback system and expert support.
                </p>
              </div>
            </FloatingCard>

            <FloatingCard delay={800}>
              <div className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100 hover:border-yellow-200 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6">
                  <Gift className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">Special Gifts & Rewards</h3>
                <p className="text-slate-600 leading-relaxed">
                  Enjoy special gifts for Muslim users and other community members, plus referral rewards and bonuses.
                </p>
              </div>
            </FloatingCard>

            <FloatingCard delay={1000}>
              <div className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100 hover:border-green-200 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">Adhan & Prayer Times</h3>
                <p className="text-slate-600 leading-relaxed">
                  Integrated Islamic features including accurate prayer times, Adhan notifications, and trading schedule management.
                </p>
              </div>
            </FloatingCard>

            <FloatingCard delay={1200}>
              <div className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100 hover:border-indigo-200 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">AI-Powered Everything</h3>
                <p className="text-slate-600 leading-relaxed">
                  From chart analysis to market predictions, every feature is enhanced with cutting-edge AI technology.
                </p>
              </div>
            </FloatingCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <FloatingCard>
            <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 rounded-3xl p-12 md:p-16 text-white">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Start Your Trading Journey Today
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Upload your first chart for free and experience the power of AI-driven trading analysis.
              </p>
              <Button
                size="lg"
                onClick={handleGoogleSignIn}
                className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <GoogleIcon />
                Get 2 Free Chart Analysis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="mt-4 text-sm opacity-75">
                No credit card required • Instant access • Islamic-compliant
              </p>
            </div>
          </FloatingCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Oday AI</span>
            </div>
            <p className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} Oday AI. Created and developed by Mouaad Idoufkir.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}