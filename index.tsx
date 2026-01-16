import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Search, 
  Briefcase, 
  MapPin, 
  Sparkles, 
  FileText, 
  Target, 
  MessageSquare, 
  ChevronRight, 
  ExternalLink,
  User,
  History,
  TrendingUp,
  Loader2,
  X,
  FileSearch,
  CheckCircle2,
  BrainCircuit,
  Bell,
  Mail,
  Check,
  Filter,
  ChevronDown,
  Clock,
  Zap,
  RotateCcw,
  Heart,
  LineChart,
  Lightbulb,
  ArrowRight,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Types ---
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  sourceUrl?: string;
  sourceTitle?: string;
  salary?: string;
  type?: string;
  level?: string;
}

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, loading = false, type = "button" }: any) => {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: any = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
    ghost: "text-gray-600 hover:bg-gray-100",
    accent: "bg-emerald-600 text-white hover:bg-emerald-700",
    outline: "bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50",
    danger: "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100"
  };

  return (
    <button type={type} onClick={onClick} className={`${baseStyles} ${variants[variant]} ${className}`} disabled={disabled || loading}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
};

const Modal = ({ isOpen, onClose, children, title }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center shrink-0">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

const Header = ({ onOpenSavedJobs, savedCount, currentView, onViewChange }: any) => (
  <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange('search')}>
        <div className="bg-indigo-600 p-2 rounded-xl">
          <Briefcase className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-violet-600">
          CareerAI
        </span>
      </div>
      <nav className="hidden md:flex items-center gap-6">
        <button 
          onClick={() => onViewChange('search')} 
          className={`text-sm font-medium transition-colors cursor-pointer ${currentView === 'search' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
        >
          Find Jobs
        </button>
        <button onClick={onOpenSavedJobs} className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5 relative cursor-pointer">
          Saved Jobs
          {savedCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {savedCount}
            </span>
          )}
        </button>
        <button 
          onClick={() => onViewChange('insights')} 
          className={`text-sm font-medium transition-colors cursor-pointer ${currentView === 'insights' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
        >
          Career Insights
        </button>
        <a href="#" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors cursor-pointer">Resume AI</a>
      </nav>
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="hidden sm:flex" onClick={onOpenSavedJobs}>
          <Heart className={`w-4 h-4 ${savedCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} /> 
          <span className="ml-1">My Jobs</span>
        </Button>
        <Button className="rounded-full px-6">Get Started</Button>
      </div>
    </div>
  </header>
);

const JobCard = ({ job, onClick, isSelected, isSaved, onToggleSave }: any) => (
  <div 
    onClick={onClick}
    className={`p-5 rounded-xl border transition-all cursor-pointer group hover:shadow-lg relative ${
      isSelected ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600' : 'border-gray-200 bg-white'
    }`}
  >
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onToggleSave(job);
      }}
      className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 z-10 cursor-pointer ${
        isSaved ? 'bg-rose-50 text-rose-500' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-rose-500'
      }`}
    >
      <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500' : ''}`} />
    </button>

    <div className="flex justify-between items-start mb-3 pr-8">
      <div>
        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-lg leading-tight">{job.title}</h3>
        <p className="text-indigo-600 font-medium text-sm mt-1">{job.company}</p>
      </div>
      <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-md shrink-0">New</span>
    </div>
    <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-gray-500 mb-4">
      <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</div>
      {job.salary && <div className="flex items-center gap-1 font-medium text-gray-700">$ {job.salary}</div>}
    </div>
    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4">
      {job.description}
    </p>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span className="text-xs text-amber-700 font-medium">AI Ready</span>
      </div>
      <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? 'translate-x-1 text-indigo-600' : 'text-gray-300'}`} />
    </div>
  </div>
);

const InsightsView = () => {
  const [insightQuery, setInsightQuery] = useState('');
  const [insightResponse, setInsightResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [groundingLinks, setGroundingLinks] = useState<{uri: string, title: string}[]>([]);

  const fetchInsights = async (customQuery?: string) => {
    const queryToUse = customQuery || insightQuery;
    if (!queryToUse) return;

    setLoading(true);
    setInsightResponse(null);
    setGroundingLinks([]);

    try {
      const prompt = `Provide detailed career insights, industry trends, or salary expectations for: "${queryToUse}". 
      Focus on actionable advice, skills in demand, and current market reality. 
      Use Markdown formatting with clear sections.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      setInsightResponse(result.text || "No insights available.");
      
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const links = chunks.map((c: any) => c.web).filter(Boolean);
      setGroundingLinks(links);
    } catch (error) {
      console.error("Insights error:", error);
      setInsightResponse("Sorry, I couldn't generate insights at this moment.");
    } finally {
      setLoading(false);
    }
  };

  const trendingTopics = [
    { title: "AI Engineering Outlook 2025", icon: <BrainCircuit className="w-5 h-5" />, query: "What is the job market outlook for AI engineers in 2025?" },
    { title: "Salary Trends: Data Science", icon: <LineChart className="w-5 h-5" />, query: "What are the current salary trends for Data Scientists in major tech hubs?" },
    { title: "Soft Skills for Leadership", icon: <Lightbulb className="w-5 h-5" />, query: "Most important soft skills for transitioning into tech leadership roles." },
    { title: "Remote Work Sustainability", icon: <Briefcase className="w-5 h-5" />, query: "Current state and future sustainability of remote work in software development." }
  ];

  return (
    <section className="max-w-5xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Career <span className="text-indigo-600">Intelligence</span> Dashboard</h2>
        <p className="text-gray-600 text-lg">Get data-driven career advice, industry forecasts, and strategic planning powered by Gemini AI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {trendingTopics.map((topic, i) => (
          <button 
            key={topic.title}
            onClick={() => fetchInsights(topic.query)}
            className="p-5 bg-white border border-gray-100 rounded-2xl text-left hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col justify-between h-full cursor-pointer"
          >
            <div className="bg-indigo-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors text-indigo-600">
              {topic.icon}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1 leading-tight">{topic.title}</h4>
              <p className="text-xs text-gray-500 flex items-center gap-1 group-hover:text-indigo-600">
                Explore topic <ArrowRight className="w-3 h-3" />
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="glass-card p-6 rounded-2xl shadow-xl mb-12 border-2 border-indigo-50">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Ask anything (e.g., 'How to move from marketing to product management?')"
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-gray-700"
              value={insightQuery}
              onChange={(e) => setInsightQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchInsights()}
            />
          </div>
          <Button 
            loading={loading}
            onClick={() => fetchInsights()}
            className="sm:w-40 py-4"
          >
            Get Insights
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <BrainCircuit className="absolute inset-0 m-auto w-6 h-6 text-indigo-600" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900">Synthesizing Data...</h3>
            <p className="text-gray-500">Gemini is scouring market trends and expert advice.</p>
          </div>
        </div>
      )}

      {insightResponse && (
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-50">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-gray-900">Strategic Career Analysis</h3>
              <p className="text-sm text-gray-500 uppercase tracking-widest font-semibold">Grounded in Real-time Market Data</p>
            </div>
          </div>
          
          <div className="prose prose-indigo max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed text-base lg:text-lg">
            {insightResponse}
          </div>

          {groundingLinks.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-50">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Supporting Sources
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groundingLinks.slice(0, 4).map((link, i) => (
                  <a 
                    key={i} 
                    href={link.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                  >
                    <div className="bg-white p-2 rounded-lg border border-gray-100 group-hover:border-indigo-100">
                      <ExternalLink className="w-3 h-3 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-600 truncate">{link.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 p-6 bg-linear-to-r from-indigo-50 to-violet-50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-full shadow-sm">
                <GraduationCap className="w-6 h-6 text-indigo-600" />
              </div>
              <p className="text-indigo-900 font-bold">Ready to take the next step in your career?</p>
            </div>
            <Button className="shrink-0 rounded-full px-8">Talk to a Coach</Button>
          </div>
        </div>
      )}
    </section>
  );
};

const App = () => {
  const [currentView, setCurrentView] = useState<'search' | 'insights'>('search');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [resume, setResume] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'fit' | 'letter' | 'interview'>('fit');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // Saved Jobs State
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [showSavedJobsModal, setShowSavedJobsModal] = useState(false);

  // Alert Subscription States
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Advanced Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [jobType, setJobType] = useState('any'); // any, full-time, part-time, contract
  const [experienceLevel, setExperienceLevel] = useState('any'); // any, entry, mid, senior
  const [datePosted, setDatePosted] = useState('any'); // any, 24h, week, month

  // Persistence: Load saved jobs on mount
  useEffect(() => {
    const stored = localStorage.getItem('career_ai_saved_jobs');
    if (stored) {
      try {
        setSavedJobs(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved jobs", e);
      }
    }
    
    // Initial sample jobs load
    const initialJobs = [
      { id: '1', title: 'Senior Frontend Engineer', company: 'TechFlow Systems', location: 'San Francisco, CA (Remote)', description: 'We are looking for an expert in React, TypeScript and modern CSS frameworks. You will lead our design system effort and build high-performance web applications.', salary: '160k - 210k' },
      { id: '2', title: 'Product Product Designer', company: 'Nova Creative', location: 'New York, NY', description: 'Join a world-class creative team building the next generation of e-commerce experiences. Expertise in Figma and prototyping is essential.', salary: '120k - 150k' },
      { id: '3', title: 'Machine Learning Researcher', company: 'Aether AI', location: 'London, UK', description: 'Working on cutting edge LLM research. PhD in Computer Science or related field required. Experience with PyTorch or JAX.', salary: '140k - 190k' }
    ];
    setJobs(initialJobs);
  }, []);

  // Save to localStorage when savedJobs changes
  useEffect(() => {
    localStorage.setItem('career_ai_saved_jobs', JSON.stringify(savedJobs));
  }, [savedJobs]);

  const toggleSaveJob = (job: Job) => {
    const isAlreadySaved = savedJobs.some(sj => sj.id === job.id);
    if (isAlreadySaved) {
      setSavedJobs(prev => prev.filter(sj => sj.id !== job.id));
    } else {
      setSavedJobs(prev => [job, ...prev]);
    }
  };

  const isJobSaved = (jobId: string) => savedJobs.some(sj => sj.id === jobId);

  // Function to handle global view changes, ensuring 'Find Jobs' link resets the state
  const handleViewChange = (view: 'search' | 'insights') => {
    setCurrentView(view);
    if (view === 'search') {
      // If we switch back to search, reset detail view to show the landing state
      setSelectedJob(null);
      setAiResponse(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setSelectedJob(null);
    setAiResponse(null);
    setIsSubscribed(false); 

    try {
      const filterDetails = [];
      if (jobType !== 'any') filterDetails.push(`Type: ${jobType}`);
      if (experienceLevel !== 'any') filterDetails.push(`Experience Level: ${experienceLevel}`);
      if (datePosted !== 'any') filterDetails.push(`Posted: last ${datePosted === '24h' ? '24 hours' : datePosted === 'week' ? 'week' : 'month'}`);
      
      const filterString = filterDetails.length > 0 ? ` Apply these filters: ${filterDetails.join(', ')}.` : '';

      const prompt = `Search for real current job openings for: "${query}" in "${location || 'Anywhere'}".${filterString} 
      Provide a diverse list of jobs including Title, Company, Location, and a brief Description. 
      Focus on providing high-quality results from recent listings.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      const parsedJobs: Job[] = groundingChunks.map((chunk: any, index: number) => ({
        id: `search-${index}-${Date.now()}`, 
        title: chunk.web?.title?.split(' - ')[0] || query,
        company: chunk.web?.title?.split(' - ')[1] || "Various Companies",
        location: location || "Remote/On-site",
        description: `Source: ${chunk.web?.title}. Click for more details on the original listing site.`,
        sourceUrl: chunk.web?.uri,
        sourceTitle: chunk.web?.title
      })).filter((j: any) => j.sourceUrl);

      if (parsedJobs.length === 0) {
        const fallbackJobs = [
          { id: `gen-1-${Date.now()}`, title: `${experienceLevel !== 'any' ? experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1) : ''} ${query} ${jobType !== 'any' ? '(' + jobType + ')' : ''}`, company: 'InnovateX', location: location || 'Global Remote', description: `Exciting opportunity for a ${query} matching your specific filters.` },
          { id: `gen-2-${Date.now()}`, title: `Junior ${query}`, company: 'CloudBase Corp', location: location || 'Hybrid', description: `Perfect entry level role for someone passionate about ${query}.` },
          { id: `gen-3-${Date.now()}`, title: `Senior ${query} Manager`, company: 'Enterprise Solutions', location: location || 'New York, NY', description: `Strategic leadership role managing ${query} initiatives across the organization.` }
        ];
        setJobs(fallbackJobs);
      } else {
        setJobs(parsedJobs);
      }

      setSearchHistory(prev => [query, ...prev.slice(0, 4)]);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setJobType('any');
    setExperienceLevel('any');
    setDatePosted('any');
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberEmail) return;
    
    setIsSubscribing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubscribing(false);
    setIsSubscribed(true);
    setShowSubscribeModal(false);
  };

  const runAiTool = async (type: 'fit' | 'letter' | 'interview') => {
    if (!selectedJob) return;
    setAiLoading(true);
    setAiResponse(null);
    setActiveTab(type);

    let prompt = "";
    if (type === 'fit') {
      prompt = `Analyze how well this user fits the job based on their resume. 
      Job: ${selectedJob.title} at ${selectedJob.company}. 
      Job Description: ${selectedJob.description}.
      User Resume: ${resume || "No resume provided. Please simulate a fit analysis based on typical requirements for this title."}
      
      Provide a Match Score (0-100%), Key Strengths, and Missing Skills or Improvement Areas. Use Markdown.`;
    } else if (type === 'letter') {
      prompt = `Write a professional, persuasive, and personalized cover letter for:
      Job: ${selectedJob.title} at ${selectedJob.company}.
      Job Description: ${selectedJob.description}.
      User Profile: ${resume || "Professional with relevant experience in this field."}
      
      The tone should be enthusiastic and confident.`;
    } else {
      prompt = `Prepare the user for an interview at ${selectedJob.company} for the role of ${selectedJob.title}.
      Based on the description: ${selectedJob.description}.
      
      Provide:
      1. 5 specific interview questions they might face.
      2. Recommended answers/talking points for each.
      3. A "Pro-tip" for this specific company or industry.`;
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      setAiResponse(response.text || "Failed to generate AI insights.");
    } catch (error) {
      setAiResponse("Error: Could not complete AI analysis.");
    } finally {
      setAiLoading(false);
    }
  };

  const hasActiveFilters = jobType !== 'any' || experienceLevel !== 'any' || datePosted !== 'any';

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onOpenSavedJobs={() => setShowSavedJobsModal(true)} 
        savedCount={savedJobs.length} 
        currentView={currentView}
        onViewChange={handleViewChange}
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        {currentView === 'search' ? (
          <>
            {/* Search Bar & Filter Section */}
            <section className="max-w-4xl mx-auto mb-12">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                  Find your <span className="text-indigo-600">dream career</span> with AI
                </h1>
                <p className="text-gray-600 text-lg">Personalized job matching, AI-generated cover letters, and interview coaching.</p>
              </div>

              <div className="glass-card p-2 rounded-2xl shadow-xl space-y-2">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2 items-stretch">
                  <div className="flex-1 flex items-center px-4 py-3 bg-white rounded-xl border border-gray-100 focus-within:ring-2 focus-within:ring-indigo-500 transition-all shadow-xs">
                    <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                    <input 
                      type="text" 
                      placeholder="Job title, keywords, or company..." 
                      className="w-full bg-transparent border-none focus:outline-hidden text-gray-700"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 flex items-center px-4 py-3 bg-white rounded-xl border border-gray-100 focus-within:ring-2 focus-within:ring-indigo-500 transition-all shadow-xs">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                    <input 
                      type="text" 
                      placeholder="City, state, or 'Remote'" 
                      className="w-full bg-transparent border-none focus:outline-hidden text-gray-700"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      className={`px-3 md:px-4 cursor-pointer ${hasActiveFilters ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : ''}`}
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="w-4 h-4" />
                      <span className="hidden sm:inline">Filters</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
                    </Button>
                    <Button type="submit" loading={loading} className="px-8 rounded-xl cursor-pointer">
                      Search
                    </Button>
                  </div>
                </form>

                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'max-h-64 py-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-2 pt-2 border-t border-gray-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3" /> Job Type
                      </label>
                      <select 
                        className="w-full p-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value)}
                      >
                        <option value="any">Any Type</option>
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Zap className="w-3 h-3" /> Experience Level
                      </label>
                      <select 
                        className="w-full p-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value)}
                      >
                        <option value="any">Any Level</option>
                        <option value="entry">Entry Level</option>
                        <option value="mid">Mid Level</option>
                        <option value="senior">Senior / Lead</option>
                        <option value="executive">Executive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Date Posted
                      </label>
                      <select 
                        className="w-full p-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                        value={datePosted}
                        onChange={(e) => setDatePosted(e.target.value)}
                      >
                        <option value="any">Any Time</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="week">Last Week</option>
                        <option value="month">Last Month</option>
                      </select>
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <div className="mt-4 flex justify-end px-2">
                      <button 
                        onClick={handleResetFilters}
                        className="text-xs font-semibold text-gray-400 hover:text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset Filters
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {searchHistory.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center items-center">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider mr-2 flex items-center gap-1">
                    <History className="w-3 h-3" /> Recent:
                  </span>
                  {searchHistory.map((h, i) => (
                    <button key={i} onClick={() => setQuery(h)} className="text-sm text-gray-600 hover:text-indigo-600 bg-white px-3 py-1 rounded-full border border-gray-200 transition-colors shadow-xs cursor-pointer">
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-4 h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
                
                <div className="sticky top-0 z-10 bg-[#f8fafc] pb-4">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-500" />
                      {loading ? 'Searching...' : `${jobs.length} Results Found`}
                    </h2>
                    <div className="text-xs font-medium text-gray-500 uppercase">Sort by: Relevancy</div>
                  </div>

                  {!loading && query && (
                    <div className={`p-4 rounded-xl border-2 border-dashed transition-all duration-300 ${isSubscribed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-indigo-100 hover:border-indigo-300'}`}>
                      {isSubscribed ? (
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-500 p-2 rounded-full">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-emerald-800 font-bold text-sm">Alert active!</p>
                            <p className="text-emerald-600 text-xs">We'll notify you when new "{query}" roles appear.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-xl">
                              <Bell className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-gray-900 font-bold text-sm">Get alerts for this search</p>
                              <p className="text-gray-500 text-xs">Stay updated on new opportunities.</p>
                            </div>
                          </div>
                          <Button variant="primary" onClick={() => setShowSubscribeModal(true)} className="py-2 text-xs cursor-pointer">
                            Subscribe
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-5 rounded-xl border border-gray-100 bg-white">
                      <div className="h-6 w-3/4 shimmer rounded mb-2"></div>
                      <div className="h-4 w-1/4 shimmer rounded mb-4"></div>
                      <div className="h-16 w-full shimmer rounded mb-4"></div>
                      <div className="h-4 w-1/3 shimmer rounded"></div>
                    </div>
                  ))
                ) : jobs.length > 0 ? (
                  jobs.map(job => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      onClick={() => setSelectedJob(job)} 
                      isSelected={selectedJob?.id === job.id}
                      isSaved={isJobSaved(job.id)}
                      onToggleSave={toggleSaveJob}
                    />
                  ))
                ) : (
                  <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <FileSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-gray-900 font-semibold">No jobs found</h3>
                    <p className="text-gray-500 text-sm mt-1">Try broadening your search criteria.</p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-7">
                {selectedJob ? (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-280px)]">
                    <div className="p-6 border-b bg-linear-to-b from-gray-50 to-white">
                      <div className="flex justify-between items-start mb-4">
                        <div className="pr-12">
                          <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">{selectedJob.title}</h2>
                          <p className="text-lg text-indigo-600 font-semibold mt-1">{selectedJob.company}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={() => toggleSaveJob(selectedJob)}
                            className={`p-2.5 rounded-xl border transition-all duration-200 flex items-center gap-2 text-sm font-semibold cursor-pointer ${
                              isJobSaved(selectedJob.id) 
                                ? 'bg-rose-50 border-rose-200 text-rose-600' 
                                : 'bg-white border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-500'
                            }`}
                            title={isJobSaved(selectedJob.id) ? "Remove from saved" : "Save this job"}
                          >
                            <Heart className={`w-5 h-5 ${isJobSaved(selectedJob.id) ? 'fill-rose-500' : ''}`} />
                            {isJobSaved(selectedJob.id) ? 'Saved' : 'Save'}
                          </button>
                          {selectedJob.sourceUrl && (
                            <a 
                              href={selectedJob.sourceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2.5 text-gray-400 hover:text-indigo-600 border border-transparent hover:border-gray-200 rounded-xl transition-colors cursor-pointer"
                              title="View original source"
                            >
                              <ExternalLink className="w-6 h-6" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 mb-6">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium border border-indigo-100">
                          <MapPin className="w-4 h-4" /> {selectedJob.location}
                        </span>
                        {selectedJob.salary && (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-100">
                            <CheckCircle2 className="w-4 h-4" /> {selectedJob.salary}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 text-sm font-medium border border-gray-100">
                          Full-time
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => runAiTool('fit')} variant={activeTab === 'fit' ? 'primary' : 'secondary'} className="flex-1 py-3 text-sm cursor-pointer">
                          <Target className="w-4 h-4" /> Analyze Fit
                        </Button>
                        <Button onClick={() => runAiTool('letter')} variant={activeTab === 'letter' ? 'primary' : 'secondary'} className="flex-1 py-3 text-sm cursor-pointer">
                          <FileText className="w-4 h-4" /> Cover Letter
                        </Button>
                        <Button onClick={() => runAiTool('interview')} variant={activeTab === 'interview' ? 'primary' : 'secondary'} className="flex-1 py-3 text-sm cursor-pointer">
                          <MessageSquare className="w-4 h-4" /> Interview Prep
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                      {aiLoading ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
                          <div className="relative">
                            <BrainCircuit className="w-12 h-12 text-indigo-600 animate-pulse" />
                            <div className="absolute inset-0 w-12 h-12 bg-indigo-600/20 blur-xl rounded-full animate-ping"></div>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-gray-900">AI is analyzing the role...</p>
                            <p className="text-gray-500 text-sm">Crafting personalized career insights just for you.</p>
                          </div>
                        </div>
                      ) : aiResponse ? (
                        <div className="prose prose-indigo max-w-none">
                          <div className="flex items-center gap-2 mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                            <span className="font-semibold text-indigo-900">AI Insight: {activeTab === 'fit' ? 'Role Match' : activeTab === 'letter' ? 'Draft Generated' : 'Interview Strategy'}</span>
                          </div>
                          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm lg:text-base">
                            {aiResponse}
                          </div>
                          <div className="mt-8 pt-8 border-t flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setAiResponse(null)}>Close Insight</Button>
                            <Button variant="accent"><FileText className="w-4 h-4" /> Download PDF</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <FileText className="w-5 h-5 text-gray-400" />
                              Job Description
                            </h3>
                            <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm lg:text-base">
                              {selectedJob.description}
                            </div>
                          </div>

                          <div className="bg-linear-to-br from-indigo-900 to-violet-900 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-white/20 rounded-lg">
                                <Sparkles className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-bold">CareerAI Professional Plus</h4>
                                <p className="text-white/70 text-sm">Boost your chances of getting hired</p>
                              </div>
                            </div>
                            <div className="mb-4">
                              <textarea 
                                value={resume}
                                onChange={(e) => setResume(e.target.value)}
                                placeholder="Paste your resume here for better AI analysis..."
                                className="w-full h-32 bg-white/10 border border-white/20 rounded-xl p-4 text-sm focus:outline-hidden focus:ring-2 focus:ring-white/50 transition-all placeholder:text-white/40"
                              />
                            </div>
                            <Button variant="primary" onClick={() => runAiTool('fit')} className="w-full bg-white text-indigo-900 hover:bg-gray-100 border-none font-bold cursor-pointer">
                              Run Professional Match Analysis
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-200 border-dashed p-12 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                      <Briefcase className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Select a job to view details</h3>
                    <p className="text-gray-500 max-w-sm">
                      Click on any job listing from the sidebar to see the full description and unlock AI career tools.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <InsightsView />
        )}
      </main>

      {/* Subscription Modal */}
      <Modal 
        isOpen={showSubscribeModal} 
        onClose={() => setShowSubscribeModal(false)}
        title="Subscribe to Job Alerts"
      >
        <div className="text-center mb-6">
          <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-gray-600">
            Never miss an opening for <span className="font-bold text-gray-900">"{query}"</span> in <span className="font-bold text-gray-900">{location || 'Anywhere'}</span>.
          </p>
        </div>
        <form onSubmit={handleSubscribe} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="email" 
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="you@example.com"
                value={subscriberEmail}
                onChange={(e) => setSubscriberEmail(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            By subscribing, you agree to receive email notifications when new relevant jobs are found. You can unsubscribe at any time.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowSubscribeModal(false)} className="flex-1 cursor-pointer">Cancel</Button>
            <Button type="submit" loading={isSubscribing} className="flex-1 cursor-pointer">Activate Alerts</Button>
          </div>
        </form>
      </Modal>

      {/* Saved Jobs Modal */}
      <Modal
        isOpen={showSavedJobsModal}
        onClose={() => setShowSavedJobsModal(false)}
        title="My Saved Jobs"
      >
        {savedJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-gray-200" />
            </div>
            <h4 className="text-lg font-bold text-gray-900">No saved jobs yet</h4>
            <p className="text-gray-500 mt-1 max-w-xs mx-auto">Jobs you save will appear here for quick access later.</p>
            <Button variant="primary" onClick={() => setShowSavedJobsModal(false)} className="mt-6 mx-auto cursor-pointer">Browse Jobs</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {savedJobs.map(job => (
              <div key={job.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors group relative cursor-pointer" onClick={() => {
                setSelectedJob(job);
                handleViewChange('search');
                setShowSavedJobsModal(false);
              }}>
                <div className="flex justify-between items-start mb-2 pr-10">
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">{job.title}</h4>
                    <p className="text-indigo-600 text-sm font-medium">{job.company}</p>
                  </div>
                  <Button 
                    variant="danger" 
                    className="p-1.5 h-auto absolute top-4 right-4 cursor-pointer" 
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      toggleSaveJob(job);
                    }}
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</div>
                  {job.salary && <div className="font-medium text-gray-700">$ {job.salary}</div>}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    className="flex-1 py-1.5 text-xs cursor-pointer"
                  >
                    View Details
                  </Button>
                  {job.sourceUrl && (
                    <a 
                      href={job.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Apply <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <footer className="bg-white border-t py-12 shrink-0">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleViewChange('search')}>
              <div className="bg-gray-900 p-2 rounded-lg">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">CareerAI</span>
            </div>
            <div className="flex gap-8 text-sm font-medium text-gray-500">
              <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Cookies</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Help Center</a>
            </div>
            <p className="text-gray-400 text-sm">&copy; 2025 CareerAI. Powered by Gemini.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);