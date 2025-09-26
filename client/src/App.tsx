import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import exampleImage from 'figma:asset/fd62271bea73f36be352fe2bd6ad548c32ecd9b7.png';
import { 
  Brain, 
  Headphones, 
  Mic, 
  MessageSquare,
  Sparkles,
  Play,
  Users,
  Github,
  Linkedin,
  Mail,
  Code,
  Zap,
  BookOpen,
  Globe
} from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-xl font-bold text-white">
            {'> Tech_Digest_AI'}
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#demo" className="text-gray-300 hover:text-white transition-colors">Demo</a>
            <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
            <Button className="bg-red-600 hover:bg-red-500 text-white">Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-green-600 hover:bg-green-500 text-black mb-6 px-4 py-2">
                [AI_POWERED_NEWS_ENGINE]
              </Badge>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl mb-6 leading-tight">
                <span className="text-white">Stay Ahead</span><br />
                <span className="text-gray-200">in Tech,</span><br />
                <span className="text-gray-300">Smarter</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-xl">
                AI summarizes the latest IT news into quick digests, podcasts & audiobooks. 
                <span className="text-gray-200">No more information overload.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 text-lg h-auto">
                  <Play className="mr-2 h-5 w-5" />
                  ./get_started
                </Button>
                <Button variant="outline" className="border-2 border-gray-400 text-gray-300 hover:bg-gray-400 hover:text-black px-8 py-4 text-lg h-auto bg-transparent">
                  <Code className="mr-2 h-5 w-5" />
                  ./explore_features
                </Button>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>System Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span>AI Processing</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-red-600/20 via-orange-500/20 to-yellow-400/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
                <div className="bg-black px-4 py-2 flex items-center gap-2 border-b border-gray-700">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-400 text-sm ml-2">tech_digest_ai.exe</span>
                </div>
                <ImageWithFallback 
                  src={exampleImage}
                  alt="Tech Digest AI Interface"
                  className="w-full h-80 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview Section */}
      <section id="features" className="py-20 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl mb-6">
              <span className="text-white">{'<features>'}</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Powerful AI-driven tools to revolutionize your tech news consumption
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Brain,
                title: "AI_Summaries",
                description: "Smart condensation of complex tech articles",
                color: "from-orange-500 to-red-500",
                accent: "orange"
              },
              {
                icon: Headphones,
                title: "Audio_Generation",
                description: "Transform content into immersive audiobooks",
                color: "from-cyan-500 to-blue-500",
                accent: "cyan"
              },
              {
                icon: Mic,
                title: "Podcast_Mode",
                description: "Engaging podcast-style tech news delivery",
                color: "from-green-500 to-teal-500",
                accent: "green"
              },
              {
                icon: MessageSquare,
                title: "Debate_Stories",
                description: "Interactive debates and narrative formats",
                color: "from-purple-500 to-pink-500",
                accent: "purple"
              }
            ].map((feature, index) => (
              <Card key={index} className="group bg-black border-2 border-gray-700 hover:border-orange-500 p-6 transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg mb-2 text-white group-hover:text-gray-200 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>
                <div className="mt-4 text-xs text-gray-500 group-hover:text-gray-400">
                  {'> status: active'}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section id="demo" className="py-20 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl mb-6">
              <span className="text-white">{'<live_demo>'}</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              See the AI in action - transforming complex tech news into digestible content
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Demo Cards */}
            {[
              {
                title: "GPT-5_News",
                description: "Latest OpenAI developments summarized",
                color: "bg-gradient-to-br from-orange-600 to-red-600",
                tag: "[AI/ML]"
              },
              {
                title: "React_19_Updates",
                description: "New features and breaking changes",
                color: "bg-gradient-to-br from-cyan-600 to-blue-600",
                tag: "[FRONTEND]"
              },
              {
                title: "Cloud_Security",
                description: "Latest cybersecurity threats and solutions",
                color: "bg-gradient-to-br from-green-600 to-teal-600",
                tag: "[SECURITY]"
              },
              {
                title: "DevOps_Tools",
                description: "Container orchestration improvements",
                color: "bg-gradient-to-br from-purple-600 to-pink-600",
                tag: "[DEVOPS]"
              },
              {
                title: "Blockchain_News",
                description: "Web3 and cryptocurrency developments",
                color: "bg-gradient-to-br from-yellow-600 to-orange-600",
                tag: "[WEB3]"
              },
              {
                title: "Mobile_Trends",
                description: "iOS and Android platform updates",
                color: "bg-gradient-to-br from-red-600 to-pink-600",
                tag: "[MOBILE]"
              }
            ].map((demo, index) => (
              <Card key={index} className="group bg-gray-900 border border-gray-700 hover:border-yellow-500 p-0 overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className={`${demo.color} h-32 flex items-center justify-center`}>
                  <div className="text-center">
                    <Badge className="bg-black/50 text-white mb-2">{demo.tag}</Badge>
                    <div className="text-white text-sm">{'> processing...'}</div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg text-white mb-2">{demo.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{demo.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Ready for consumption</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Community & Impact Section */}
      <section id="about" className="py-20 px-6 bg-black">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl mb-6">
            <span className="text-white">{'<community>'}</span>
          </h2>
          <h3 className="text-2xl md:text-3xl text-white mb-4">
            Made for Developers, Students & IT Pros
          </h3>
          <p className="text-xl text-gray-300 mb-16 max-w-3xl mx-auto">
            Save time, stay updated, and learn with fun formats. 
            <span className="text-gray-200">Join the revolution.</span>
          </p>

          <div className="mb-16">
            <p className="text-lg text-gray-400 mb-8">{'> data_sources = ['}</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              {[
                { name: "TechCrunch" },
                { name: "Dev.to" },
                { name: "HackerNews" },
                { name: "GitHub" },
                { name: "StackOverflow" }
              ].map((source, index) => (
                <div key={index} className="group cursor-pointer">
                  <span className="text-gray-300 hover:text-white text-xl hover:scale-110 transition-all duration-300">
                    "{source.name}"{index < 4 ? ',' : ''}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-lg text-gray-400 mt-8">{']'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl text-white mb-2">10K+</h3>
              <p className="text-gray-400">Active Users</p>
              <div className="text-xs text-gray-500 mt-2">{'> status: growing'}</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl text-white mb-2">1M+</h3>
              <p className="text-gray-400">Articles Processed</p>
              <div className="text-xs text-gray-500 mt-2">{'> status: processed'}</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl text-white mb-2">99%</h3>
              <p className="text-gray-400">Accuracy Rate</p>
              <div className="text-xs text-gray-500 mt-2">{'> status: optimized'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gray-900 border-2 border-gray-700 rounded-2xl p-12">
            <h2 className="text-3xl md:text-4xl mb-6">
              <span className="text-white">{'> Ready to revolutionize'}</span><br />
              <span className="text-gray-200">{'your tech news experience?'}</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who are already saving hours every week with AI-powered tech digests.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 text-lg h-auto">
                <Play className="mr-2 h-5 w-5" />
                ./start_free_trial
              </Button>
              <Button variant="outline" className="border-2 border-gray-400 text-gray-300 hover:bg-gray-400 hover:text-black px-8 py-4 text-lg h-auto bg-transparent">
                <Globe className="mr-2 h-5 w-5" />
                ./view_demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-xl text-white mb-4">{'> Tech_Digest_AI'}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Revolutionizing tech news consumption through AI-powered summarization and audio generation.
              </p>
            </div>
            <div>
              <h4 className="text-lg text-white mb-4">Product</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Features</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Pricing</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">API</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Docs</a>
              </div>
            </div>
            <div>
              <h4 className="text-lg text-white mb-4">Company</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">About</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Blog</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Careers</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Contact</a>
              </div>
            </div>
            <div>
              <h4 className="text-lg text-white mb-4">Connect</h4>
              <div className="flex items-center gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Github className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                <span className="text-green-500">●</span> System Status: Online
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-500 text-sm">
              {'© 2024 Tech_Digest_AI. All rights reserved. | Built with <3 for developers'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}