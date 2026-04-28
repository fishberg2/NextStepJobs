import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Briefcase, GraduationCap, Sparkles, Loader2, CheckCircle2, ChevronLeft, Moon, Sun, LogIn, LogOut, ChevronDown, ExternalLink } from 'lucide-react';
import { getCareerRecommendations, getSkillTranslations, getCareerMap, UserProfile, CareerRecommendation } from './utils/gemini';
import { useAppStore } from './lib/store';
import { signInWithGoogle, logout, auth, fetchUserData, updateUserData, fetchNetworkUsers, handleRedirectResult } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { UserData } from './lib/store';

type AppState = 'home' | 'questionnaire' | 'loading' | 'results' | 'careermap' | 'skillbridge' | 'network';

export default function App() {
  const { theme, setTheme, user, setUser, authLoading, setAuthLoading, userData, setUserData } = useAppStore();
  const [appState, setAppState] = useState<AppState>('home');
  const [profile, setProfile] = useState<UserProfile>({
    educationStage: '',
    interests: '',
    workEnvironment: '',
    skills: ''
  });
  const [results, setResults] = useState<CareerRecommendation[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');
  const [networkUsers, setNetworkUsers] = useState<(UserData & { id: string })[]>([]);
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
  const appMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (appMenuRef.current && !appMenuRef.current.contains(event.target as Node)) {
        setIsAppMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    handleRedirectResult();
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [setUser, setAuthLoading]);

  useEffect(() => {
    if (user) {
      fetchUserData(user.uid).then(data => {
        if (data) {
          setUserData(data);
          if (data.profile) setProfile(data.profile);
          if (data.recommendations) setResults(data.recommendations);
        }
      });
      fetchNetworkUsers().then(users => setNetworkUsers(users.filter(u => u.id !== user.uid)));
    }
  }, [user, setUserData]);

  // Handle theme class on body
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleStart = () => setAppState('questionnaire');

  const handleNextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setAppState('loading');
    setError('');
    try {
      const [recs, skillTrans] = await Promise.all([
        getCareerRecommendations(profile),
        getSkillTranslations(profile)
      ]);
      const target = recs.length > 0 ? recs[0].title : "Professional";
      const careerMap = await getCareerMap(profile, target);

      setResults(recs);
      
      const newUserData: Partial<UserData> = {
        profile,
        recommendations: recs,
        skillTranslations: skillTrans,
        careerMap: careerMap,
        transition: `${profile.educationStage} \u2192 ${target}`
      };
      
      if (user) {
        await updateUserData(user.uid, newUserData);
        const updated = await fetchUserData(user.uid);
        if (updated) setUserData(updated);
      }
      
      setAppState('results');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Something went wrong while generating recommendations. Please try again.');
      setAppState('questionnaire');
    }
  };

  const resetTarget = () => {
    setProfile({
      educationStage: '',
      interests: '',
      workEnvironment: '',
      skills: ''
    });
    setCurrentStep(0);
    setAppState('home');
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50"><Loader2 className="animate-spin" size={32}/></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans flex flex-col p-4 md:p-8 transition-colors duration-200">
        <header className="flex items-center justify-between mb-8 shrink-0 relative z-50">
          <div className="relative" ref={appMenuRef}>
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsAppMenuOpen(!isAppMenuOpen)}>
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl group-hover:bg-indigo-700 transition-colors">N</div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">NextStepJobs <ChevronDown size={18} className={`transition-transform duration-200 ${isAppMenuOpen ? 'rotate-180' : ''}`} /></h1>
            </div>
            
            <AnimatePresence>
              {isAppMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-14 left-0 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col"
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">NextStep Ecosystem</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <a href="#" className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-semibold" onClick={(e) => { e.preventDefault(); setIsAppMenuOpen(false); }}>
                       <span>NextStepJobs</span>
                    </a>
                    <a href="https://nextstepfuture.netlify.app/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition-colors">
                       <span>NextStepFutures</span>
                       <ExternalLink size={16} className="text-slate-400" />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 hover:text-slate-900 bg-transparent hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all focus:outline-none">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button onClick={signInWithGoogle} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
              <LogIn size={16} /> Sign In
            </button>
          </div>
        </header>
        <main className="flex-1 w-full flex flex-col">
          <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center gap-12 lg:gap-24">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-full uppercase tracking-wider">
                <Sparkles size={14} />
                <span>AI-Powered Career Discovery</span>
              </div>
              <h1 className="font-sans text-5xl md:text-7xl leading-[1.1] font-bold tracking-tight dark:text-white">
                Find a career <br className="hidden md:block"/>
                <span className="text-indigo-600 dark:text-indigo-400">you'll genuinely enjoy.</span>
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed mt-4">
                Designed for students, educators, and career counselors. Uncover tailored career paths based on interests, strengths, and preferred environments.
              </p>
              <button 
                onClick={signInWithGoogle}
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-base font-semibold transition-all hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-sm mt-4"
              >
                Log In to Start
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans flex flex-col p-4 md:p-8 transition-colors duration-200">
      {/* Header Navigation */}
      <header className="flex items-center justify-between mb-8 shrink-0 relative z-50">
        <div className="relative" ref={appMenuRef}>
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsAppMenuOpen(!isAppMenuOpen)}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl group-hover:bg-indigo-700 transition-colors">N</div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">NextStepJobs <ChevronDown size={18} className={`transition-transform duration-200 ${isAppMenuOpen ? 'rotate-180' : ''}`} /></h1>
          </div>
          
          <AnimatePresence>
            {isAppMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-14 left-0 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col"
              >
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">NextStep Ecosystem</p>
                </div>
                <div className="p-2 space-y-1">
                  <a href="#" className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-semibold" onClick={(e) => { e.preventDefault(); setIsAppMenuOpen(false); resetTarget(); }}>
                     <span>NextStepJobs</span>
                  </a>
                  <a href="https://nextstepfuture.netlify.app/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition-colors">
                     <span>NextStepFutures</span>
                     <ExternalLink size={16} className="text-slate-400" />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {appState === 'questionnaire' ? (
          <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-4">
            Step {currentStep + 1} of 4
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full text-slate-500 hover:text-slate-900 bg-transparent hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all duration-300 hover:rotate-12 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        ) : (
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-500 dark:text-slate-400 items-center">
            <button onClick={resetTarget} className={`hover:text-indigo-600 dark:hover:text-indigo-400 ${appState === 'home' || appState === 'results' ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>Dashboard</button>
            <button onClick={() => setAppState('careermap')} className={`hover:text-slate-900 dark:hover:text-white ${appState === 'careermap' ? 'text-slate-900 dark:text-white' : ''}`}>Career Map</button>
            <button onClick={() => setAppState('skillbridge')} className={`hover:text-slate-900 dark:hover:text-white ${appState === 'skillbridge' ? 'text-slate-900 dark:text-white' : ''}`}>Skill Bridge</button>
            <button onClick={() => setAppState('network')} className={`hover:text-slate-900 dark:hover:text-white ${appState === 'network' ? 'text-slate-900 dark:text-white' : ''}`}>Network</button>
            
            <button 
              onClick={toggleTheme} 
              className="p-2 ml-2 rounded-full text-slate-500 hover:text-slate-900 bg-transparent hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all duration-300 hover:rotate-12 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            
            {user ? (
              <div className="flex items-center gap-4 ml-2">
                <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" />
                  ) : (
                    <div className="bg-indigo-600 text-white w-full h-full flex items-center justify-center font-bold">{user.email?.[0].toUpperCase() || 'U'}</div>
                  )}
                </div>
                <button onClick={logout} className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-2">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : (
              <button onClick={signInWithGoogle} className="ml-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                <LogIn size={16} /> Sign In
              </button>
            )}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full">
        <AnimatePresence mode="wait">
          {appState === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="flex-1 w-full flex flex-col"
            >
              <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center gap-12 lg:gap-24">
                <div className="flex-1 space-y-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-full uppercase tracking-wider">
                    <Sparkles size={14} />
                    <span>AI-Powered Career Discovery</span>
                  </div>
                  <h1 className="font-sans text-5xl md:text-7xl leading-[1.1] font-bold tracking-tight dark:text-white">
                    Find a career <br className="hidden md:block"/>
                    <span className="text-indigo-600 dark:text-indigo-400">you'll genuinely enjoy.</span>
                  </h1>
                  <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed mt-4">
                    Designed for students, educators, and career counselors. Uncover tailored career paths based on interests, strengths, and preferred environments.
                  </p>
                  <button 
                    onClick={handleStart}
                    className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-base font-semibold transition-all hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-sm mt-4"
                  >
                    Start the Assessment
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <div className="flex-1 w-full flex justify-center lg:justify-end">
                  <div className="relative aspect-square max-h-[500px] w-full rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-8 flex flex-col justify-center items-center">
                    <div className="relative w-64 h-64 flex items-center justify-center mb-6">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                        <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray="691" strokeDashoffset="200" className="text-indigo-500" />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-slate-900 dark:text-white bg-indigo-50 dark:bg-slate-800 rounded-full w-40 h-40 border-8 border-white dark:border-slate-900 shadow-sm">
                        <GraduationCap size={48} className="text-indigo-600 dark:text-indigo-400 mb-2" strokeWidth={2} />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-xl text-slate-900 dark:text-white">Career Readiness</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Take the assessment to unlock insights</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {appState === 'questionnaire' && (
            <motion.div
              key="questionnaire"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl mx-auto px-6 py-12 lg:py-24"
            >
              <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto w-full transition-colors duration-200">
                
                {/* Error */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-2xl text-sm font-medium">
                    {error}
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {currentStep === 0 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Where are you currently at?</h2>
                        <p className="text-slate-500 dark:text-slate-400">Pick the stage that best describes you.</p>
                      </div>
                      <div className="space-y-3">
                        {['High School Student', 'College Student', 'Recent Graduate', 'Educator / Seeking Career Change'].map((stage) => (
                          <button
                            key={stage}
                            onClick={() => {
                              setProfile({ ...profile, educationStage: stage });
                              handleNextStep();
                            }}
                            className={`w-full text-left px-6 py-4 rounded-2xl border transition-all flex items-center justify-between group ${
                              profile.educationStage === stage 
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm' 
                                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700 bg-white dark:bg-slate-800'
                            }`}
                          >
                            <span className={`font-bold ${profile.educationStage === stage ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{stage}</span>
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                              profile.educationStage === stage ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {profile.educationStage === stage && <CheckCircle2 size={14} />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 1 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">What are your interests?</h2>
                        <p className="text-slate-500 dark:text-slate-400">What subjects, hobbies, or activities genuinely excite you?</p>
                      </div>
                      <textarea
                        value={profile.interests}
                        onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                        placeholder="E.g., I love analyzing data, writing stories, playing video games, learning about space..."
                        className="w-full h-48 p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-0 outline-none resize-none transition-colors align-top shadow-sm font-medium dark:text-white"
                      />
                      <div className="flex gap-4">
                        <button onClick={handlePrevStep} className="px-6 py-3 rounded-2xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                          <ChevronLeft size={16} /> Back
                        </button>
                        <button 
                          onClick={handleNextStep}
                          disabled={!profile.interests.trim()}
                          className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                          Continue
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Ideal Work Environment?</h2>
                        <p className="text-slate-500 dark:text-slate-400">Where do you feel most productive and happy?</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {['Office & Corporate', 'Remote / Work from home', 'Outdoors & Nature', 'Hands-on & Workshop', 'Laboratory', 'Classroom or Academic', 'Dynamic / Traveling'].map((env) => (
                          <button
                            key={env}
                            onClick={() => setProfile({ ...profile, workEnvironment: env })}
                            className={`p-4 rounded-2xl border text-left transition-all ${
                              profile.workEnvironment === env 
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 font-bold text-indigo-900 dark:text-indigo-300 shadow-sm' 
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-200 dark:hover:border-indigo-700 font-medium'
                            }`}
                          >
                            {env}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-4">
                        <button onClick={handlePrevStep} className="px-6 py-3 rounded-2xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                          <ChevronLeft size={16} /> Back
                        </button>
                        <button 
                          onClick={handleNextStep}
                          disabled={!profile.workEnvironment}
                          className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                          Continue
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">What are you naturally good at?</h2>
                        <p className="text-slate-500 dark:text-slate-400">List your skills, strengths, or things people say you're great at.</p>
                      </div>
                      <textarea
                        value={profile.skills}
                        onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                        placeholder="E.g., I'm a good listener, I understand math easily, I am very organized..."
                        className="w-full h-48 p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-0 outline-none resize-none transition-colors align-top shadow-sm font-medium dark:text-white"
                      />
                      <div className="flex gap-4">
                        <button onClick={handlePrevStep} className="px-6 py-3 rounded-2xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                          <ChevronLeft size={16} /> Back
                        </button>
                        <button 
                          onClick={handleSubmit}
                          disabled={!profile.skills.trim()}
                          className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Sparkles size={18} /> Discover My Path
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {appState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6"
            >
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 bg-indigo-200 dark:bg-indigo-500/20 rounded-full animate-ping opacity-30"></div>
                <div className="absolute inset-0 flex items-center justify-center bg-indigo-600 text-white rounded-full shadow-lg">
                  <Loader2 size={32} className="animate-spin" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Analyzing your profile...</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">Our AI is reviewing your interests and skills to find the perfect careers for your future.</p>
              </div>
            </motion.div>
          )}

          {appState === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-5xl mx-auto px-6 py-12 lg:py-16 space-y-12"
            >
              <div className="text-center max-w-2xl mx-auto space-y-4 mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                  <CheckCircle2 size={14} />
                  <span>Analysis Complete</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">Your Recommended Career Paths</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">Based on your unique mix of interests, skills, and preferences, here are the fields where we think you'd thrive.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:grid-rows-auto">
                {results.map((career, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx}
                    className={`bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 flex flex-col border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-md ${
                      idx === 0 ? 'md:col-span-12 md:flex-row gap-8 justify-between items-center bg-indigo-50 dark:bg-slate-800 border-indigo-200 dark:border-indigo-900' : 'md:col-span-6'
                    }`}
                  >
                    <div className={idx === 0 ? 'flex-1' : ''}>
                      {idx === 0 && <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full uppercase tracking-wider mb-4 inline-block shadow-sm">Top Match for You</span>}
                      <h3 className={`${idx === 0 ? 'text-4xl leading-tight' : 'text-2xl mb-3'} font-bold text-slate-900 dark:text-white`}>{career.title}</h3>
                      <p className={`text-slate-600 dark:text-slate-400 ${idx === 0 ? 'mt-4 max-w-lg text-lg' : 'mb-6 flex-1'}`}>{career.description}</p>
                    </div>
                    
                    <div className={`space-y-4 rounded-2xl ${idx === 0 ? 'w-full md:w-auto min-w-[300px]' : 'bg-slate-50 dark:bg-slate-800/50 p-6 border border-slate-100 dark:border-slate-700/50'}`}>
                      {idx !== 0 && (
                        <div>
                          <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mb-1">Why It's a Fit</h4>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-300">{career.whyItsAGoodFit}</p>
                        </div>
                      )}
                      
                      {idx !== 0 && <div className="h-px bg-slate-200 dark:bg-slate-700"></div>}
                      
                      <div className={`grid gap-4 ${idx === 0 ? 'grid-cols-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm' : 'grid-cols-2'}`}>
                        <div>
                          <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mb-1">Education Needed</h4>
                          <p className={`font-bold ${idx === 0 ? 'text-lg text-slate-900 dark:text-white' : 'text-sm text-slate-800 dark:text-slate-300'}`}>{career.educationNeeded}</p>
                        </div>
                        <div>
                          <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mb-1">Starting Salary</h4>
                          <p className={`font-bold ${idx === 0 ? 'text-2xl text-emerald-600 dark:text-emerald-400' : 'text-sm text-emerald-600 dark:text-emerald-400'}`}>{career.salaryRange}</p>
                        </div>
                      </div>
                      
                      {idx === 0 && (
                        <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm">
                           <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mb-1">Why It's a Fit</h4>
                           <p className="text-sm font-medium text-slate-800 dark:text-slate-300">{career.whyItsAGoodFit}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-center pt-8">
                <button 
                  onClick={resetTarget}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Start Over
                </button>
              </div>
            </motion.div>
          )}
          {appState === 'careermap' && (
            <motion.div
              key="careermap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-5xl mx-auto px-6 py-12"
            >
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-8">Career Map</h2>
              {userData?.careerMap ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 pointer-events-none">
                    <Briefcase size={200} />
                  </div>
                  <div className="max-w-2xl relative z-10">
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                      Visualize the pathways between your current skills and future roles. The Career Map identifies stepping stones, certifications, and transitional roles to help you get there.
                    </p>
                    
                    <div className="space-y-6">
                      {userData.careerMap.map((step, idx) => (
                        <React.Fragment key={idx}>
                          <div className={`p-6 rounded-2xl border shadow-sm ${idx === userData.careerMap!.length - 1 ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                            <div className="flex items-center gap-4 mb-4">
                              <div className={`w-10 h-10 rounded-full flex flex-col items-center justify-center font-bold ${idx === userData.careerMap!.length - 1 ? 'bg-white/20' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'}`}>{idx + 1}</div>
                              <h3 className={`font-bold text-lg ${idx === userData.careerMap!.length - 1 ? '' : 'dark:text-white'}`}>{step.title}</h3>
                            </div>
                            <p className={`text-sm ${idx === userData.careerMap!.length - 1 ? 'text-indigo-100' : 'dark:text-slate-400'}`}>{step.description}</p>
                          </div>
                          {idx < userData.careerMap!.length - 1 && (
                            <div className="flex justify-center text-indigo-300 dark:text-indigo-600">↓</div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-xl font-bold dark:text-white mb-2">Complete the assessment first</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">Your personalized career map will appear here once you take the assessment.</p>
                  <button onClick={() => setAppState('questionnaire')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm">Start Assessment</button>
                </div>
              )}
            </motion.div>
          )}

          {appState === 'skillbridge' && (
            <motion.div
              key="skillbridge"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-5xl mx-auto px-6 py-12"
            >
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-8">Skill Bridge</h2>
              {userData?.skillTranslations ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  <div className="bg-indigo-600 rounded-3xl p-8 text-white flex flex-col shadow-lg">
                    <h3 className="text-2xl font-bold mb-8">Skill Translator Highlight</h3>
                    <div className="space-y-6 flex-grow flex flex-col justify-center">
                      <div className="bg-white/10 p-6 rounded-2xl border border-white/20">
                        <p className="text-xs text-indigo-200 uppercase font-bold mb-2 tracking-wider">Your Experience</p>
                        <p className="text-xl font-medium">{userData.skillTranslations[0]?.ed || "Your background"}</p>
                      </div>
                      <div className="flex justify-center text-indigo-300 text-2xl">↓</div>
                      <div className="bg-white/20 p-6 rounded-2xl border border-white/30 shadow-inner">
                        <p className="text-xs text-white uppercase font-bold mb-2 tracking-wider">Corporate Value</p>
                        <p className="text-xl font-bold">{userData.skillTranslations[0]?.corp || "Corporate equivalent"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                    <h3 className="text-2xl font-bold mb-6 dark:text-white">Your Translation Library</h3>
                    <div className="space-y-4">
                      {userData.skillTranslations.map((item, i) => (
                        <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Your Term</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{item.ed}</span>
                          </div>
                          <div className="text-indigo-400 hidden sm:block">→</div>
                          <div className="flex-1">
                            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 mb-1 block">Corporate Equivalent</span>
                            <span className="font-bold text-slate-900 dark:text-white">{item.corp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <h3 className="text-xl font-bold dark:text-white mb-2">Complete the assessment first</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">Your translated skills will appear here once you take the assessment.</p>
                  <button onClick={() => setAppState('questionnaire')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm">Start Assessment</button>
                </div>
              )}
            </motion.div>
          )}

          {appState === 'network' && (
            <motion.div
              key="network"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-5xl mx-auto px-6 py-12"
            >
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-8">Peer Network</h2>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                  Connect with real users who successfully made transitions.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {networkUsers.length > 0 ? networkUsers.map((person, idx) => (
                     <div key={idx} className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-500 transition-colors cursor-pointer group dark:bg-slate-800">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex-shrink-0 flex items-center justify-center text-lg font-bold text-indigo-800 dark:text-indigo-300 overflow-hidden">
                          {person.photoURL ? <img src={person.photoURL} alt={person.displayName || "User"} className="w-full h-full object-cover" /> : (person.displayName?.[0] || 'U').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{person.displayName || person.email?.split('@')[0] || "Anonymous"}</p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{person.transition || "Transitioning"}</p>
                        </div>
                     </div>
                  )) : (
                    <div className="col-span-full py-12 text-center">
                      <p className="text-slate-500 dark:text-slate-400 font-medium">No other users in the network yet.</p>
                      <p className="text-slate-400 text-sm mt-1">Check back later or invite friends!</p>
                    </div>
                  )}
                </div>
                
                {networkUsers.length > 0 && (
                  <div className="mt-8 flex justify-center">
                    <button className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-sm hover:bg-indigo-700 transition-colors">
                      Join Alumni Circle
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

