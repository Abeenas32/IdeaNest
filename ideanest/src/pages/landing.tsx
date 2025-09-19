"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Heart,
  TrendingUp,
  Lightbulb,
  Rocket,
  Users,
  Zap,
} from "lucide-react";
import { posts } from "@/dummydata/data";
import { useState } from "react";
import LoginModal from "@/components/created/login";

type Category = "Startup" | "Knowledge" | "Funny" | string;

const IdenestLanding = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const getCategoryColor = (category: Category) => {
    switch (category) {
      case "Startup":
        return "bg-blue-900/80 text-blue-200 hover:bg-blue-800/80";
      case "Knowledge":
        return "bg-green-900/80 text-green-200 hover:bg-green-800/80";
      case "Funny":
        return "bg-yellow-900/80 text-yellow-200 hover:bg-yellow-800/80";
      default:
        return "bg-gray-700/80 text-gray-200 hover:bg-gray-600/80";
    }
  };

  const getCategoryIcon = (category: Category) => {
    switch (category) {
      case "Startup":
        return <Rocket className="w-3 h-3" />;
      case "Knowledge":
        return <Lightbulb className="w-3 h-3" />;
      case "Funny":
        return <Zap className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col relative text-white cursor-pointer"
      style={{
        background:
          "linear-gradient(135deg, #0a0a0f 0%, #111827 50%, #0a0a0f 100%)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-700 bg-black/70 backdrop-blur-md">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-semibold text-white">
                Ideanest
              </span>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="default"
                onClick={() => setIsLoginOpen(true)}
                className="text-xs sm:text-sm md:text-base px-3 sm:px-4 
                           bg-gradient-to-r from-blue-500 to-purple-500 
                           hover:from-blue-600 hover:to-purple-600 
                           text-white font-medium shadow-lg hover:scale-105 
                           transition-transform duration-200"
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsLoginOpen(true)}
                className="text-xs sm:text-sm md:text-base px-3 sm:px-4
                           border-gray-600 text-gray-400 
                           hover:bg-gray-800 hover:text-white 
                           hover:scale-105 transition-transform duration-200"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 text-center">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-4xl">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Share Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              {" "}
              Ideas
            </span>
            <br />
            Change the World
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            From groundbreaking startups to brilliant insights and hilarious
            thoughts — Ideanest is where creativity meets community.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Button
              size="sm"
              onClick={() => setIsLoginOpen(true)}
              className="px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-lg 
                         bg-gradient-to-r from-blue-500 to-purple-500 
                         hover:from-blue-600 hover:to-purple-600 
                         text-white font-medium shadow-lg 
                         hover:scale-105 transition-transform duration-200"
            >
              Start Sharing Ideas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLoginOpen(true)}
              className="px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-lg 
                         border-gray-600 text-gray-400 
                         hover:bg-gray-800 hover:text-white 
                         hover:scale-105 transition-transform duration-200"
            >
              Explore Ideas
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-10 sm:py-14 bg-gray-800/40">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
              Trending Ideas
            </h2>
            <p className="text-sm sm:text-lg text-gray-300 max-w-2xl mx-auto">
              Discover what's capturing imaginations across our community
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="group hover:shadow-xl transition-all duration-300 
                           hover:-translate-y-1 border-gray-600 bg-gray-800/80 
                           backdrop-blur-sm h-fit cursor-pointer"
              >
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant="secondary"
                      className={`${getCategoryColor(
                        post.category
                      )} flex items-center gap-1 text-xs px-2 py-1`}
                    >
                      {getCategoryIcon(post.category)}
                      {post.category}
                    </Badge>
                    {post.trending && (
                      <Badge
                        variant="default"
                        className="bg-orange-900/80 text-orange-200 hover:bg-orange-800 
                                   flex items-center gap-1 text-xs px-2 py-1"
                      >
                        <TrendingUp className="w-3 h-3" />
                        <span className="hidden sm:inline">Trending</span>
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-sm sm:text-base leading-tight group-hover:text-blue-400 transition-colors font-semibold line-clamp-2 text-gray-100">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-4 pb-4">
                  <CardDescription className="text-xs sm:text-sm text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                    {post.description}
                  </CardDescription>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-[10px] sm:text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          {post.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] sm:text-xs text-gray-400 truncate max-w-[70px] sm:max-w-[80px]">
                        {post.author.split(" ")[0]}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 sm:space-x-2 text-gray-400">
                      <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="text-[10px] sm:text-xs">{post.likes}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 sm:py-12 bg-gradient-to-r from-gray-900 via-black to-gray-900 text-center">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-3xl">
          <h2 className="text-xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
            Got an Idea Worth Sharing?
          </h2>
          <p className="text-xs sm:text-base text-gray-400 mb-5 sm:mb-6">
            Join the community where creativity meets collaboration.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center">
            <Button
              size="sm"
              onClick={() => setIsLoginOpen(true)}
              className="px-5 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base 
                         bg-gradient-to-r from-blue-500 to-purple-500 
                         hover:from-blue-600 hover:to-purple-600 
                         text-white font-medium shadow-lg 
                         hover:scale-105 transition-transform duration-200"
            >
              Join Now
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsLoginOpen(true)}
              className="px-5 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base 
                         border-gray-600 text-gray-400 
                         hover:bg-gray-800 hover:text-white 
                         hover:scale-105 transition-transform duration-200"
            >
              Explore
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-400 py-5 sm:py-6 border-t border-gray-800">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-3 sm:mb-0 cursor-pointer">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded flex items-center justify-center">
                <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="text-sm sm:text-lg font-semibold text-white">
                Ideanest
              </span>
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500">
              © 2025 Ideanest · Built for dreamers
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </div>
  );
};

export default IdenestLanding;
