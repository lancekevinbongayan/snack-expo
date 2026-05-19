import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, FlatList, Alert, StatusBar, Dimensions, Image 
} from 'react-native';
import { supabase } from './supabase'; 
import { MaterialCommunityIcons } from '@expo/vector-icons'; 

export default function App() {
  // --- 1. STATE MANAGEMENT ---
  const [view, setView] = useState('landing');
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Job Filter & UI Dropdown Anchors
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [activeLocation, setActiveLocation] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  // Profile Data Structural Hooks
  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);

  // Multi-Tenant Real-Time Database Companies State Matrix
  const [companies, setCompanies] = useState([]); 
  const [companySearch, setCompanySearch] = useState(''); 
  const [selectedIndustry, setSelectedIndustry] = useState(null); 
  const [selectedBenefit, setSelectedBenefit] = useState(null); 
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false); 
  const [showBenefitDropdown, setShowBenefitDropdown] = useState(false); 
  
  // Cross-Filtering Selector Anchor Variable State
  const [activeCompanyFilter, setActiveCompanyFilter] = useState(null);

  // Company Panel Overlay State Management Block
  const [showCompanyJobOverlay, setShowCompanyJobOverlay] = useState(false);
  const [companyOverlayName, setCompanyOverlayName] = useState('');
  const [companyOverlayJobs, setCompanyOverlayJobs] = useState([]);

  // Chat / Messages Interactive Layout State System
  const [selectedChatId, setSelectedChatId] = useState(1);
  const [typeMessage, setTypeMessage] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  // Modal Stacking visibility controller variables
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [modalJobData, setModalJobData] = useState(null);
  const [isSavedJob, setIsSavedJob] = useState(true); 

  const [chatThreads, setChatThreads] = useState([
    {
      id: 1,
      recruiter: 'Gladirish Bernardo',
      role: 'Recruiter',
      activity: 'More than ten replies today',
      company: 'Workstream',
      position: 'Customer Support Specialist',
      salary: '₱30-35K [Monthly]',
      timestamp: '1:10 PM',
      messages: [
        { id: 1, text: "Hi, I'm interested in this position. May I learn more about this job?", sender: 'user', time: '1:10 PM' }
      ],
      resumeSent: false 
    },
    {
      id: 2,
      recruiter: 'Gondemer Gallardo',
      role: 'Recruiter',
      activity: 'Active 1 hour ago',
      company: 'Techify Solutions',
      position: 'Junior Full-Stack Developer',
      salary: '₱40-50K [Monthly]',
      timestamp: '1:02 PM',
      messages: [
        { id: 1, text: "Hi, I've attached my resume for the developer vacancy.", sender: 'user', time: '1:02 PM' }
      ],
      resumeSent: false 
    },
    {
      id: 3,
      recruiter: 'Neksjob Lhyza',
      role: 'System Match',
      activity: 'Automated Agent',
      company: 'Neksjob Philippines',
      position: 'Technical Support Representative',
      salary: '₱25-30K [Monthly]',
      timestamp: 'MON',
      messages: [
        { id: 1, text: "The platform has recommended this role matching your IT profile architecture parameters.", sender: 'recruiter', time: 'MON' }
      ],
      resumeSent: false
    }
  ]);

  // Helper utility function to fetch the current local time dynamically formatted
  const getRealTimeTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --- 2. INITIALIZATION & DATA PIPELINES ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setView('dashboard'); 
      }
    });
    fetchJobs();
  }, [activeLocation, activeCategory, searchQuery, activeCompanyFilter]);

  useEffect(() => {
    if (user) {
      fetchFilterOptions();
      fetchProfileData();
    }
  }, [user]);

  useEffect(() => {
    if (user && view === 'companies') {
      fetchCompaniesFromSupabase();
    }
  }, [user, view, companySearch, selectedIndustry, selectedBenefit]);

  async function fetchFilterOptions() {
    const [catResponse, locResponse] = await Promise.all([
      supabase.from('jobs').select('category'),
      supabase.from('jobs').select('location')
    ]);

    if (!catResponse.error && catResponse.data) {
      const uniqueCategories = [...new Set(catResponse.data.map(item => item.category).filter(Boolean))];
      setCategories(uniqueCategories);
    }

    if (!locResponse.error && locResponse.data) {
      const uniqueLocations = [...new Set(locResponse.data.map(item => item.location).filter(Boolean))];
      setLocations(uniqueLocations);
    }
  }

  async function fetchJobs() {
    let query = supabase.from('jobs').select('*');
    if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);
    if (activeLocation) query = query.eq('location', activeLocation);
    if (activeCategory) query = query.eq('category', activeCategory);
    
    if (activeCompanyFilter) {
      query = query.ilike('company', activeCompanyFilter);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error) {
      setJobs(data || []);
      if (data && data.length > 0 && !selectedJob) {
        setSelectedJob(data[0]);
      }
    }
  }

  async function fetchCompaniesFromSupabase() {
    try {
      let query = supabase.from('companies').select('*');
      if (companySearch) query = query.ilike('name', `%${companySearch}%`); 
      if (selectedIndustry) query = query.eq('industry', selectedIndustry); 
      if (selectedBenefit) query = query.eq('benefit', selectedBenefit); 

      const { data, error } = await query.order('name', { ascending: true });
      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      Alert.alert("Database Error", error.message);
    }
  }

  async function fetchProfileData() {
    const { data: sData } = await supabase.from('profile_skills').select('*');
    setSkills(sData || []);

    const { data: expData = [] } = await supabase.from('profile_experience').select('*');
    setExperience(expData || []);

    const { data: eduData = [] } = await supabase.from('profile_education').select('*');
    setEducation(eduData || []);
  }

  async function handleAuth() {
    if (!email || !password) return Alert.alert("Input Required", "Enter credentials.");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert("Login Failed", error.message);
    else {
      setUser(data.user);
      setView('dashboard');
    }
  }

  async function handleFetchCompanyOpeningsTab(companyName) {
    try {
      setCompanyOverlayName(companyName);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .ilike('company', companyName)
        .order('created_at', { ascending: false });

      if (!error) {
        setCompanyOverlayJobs(data || []);
        setShowCompanyJobOverlay(true); 
      }
    } catch (e) {
      Alert.alert("Error", "Could not complete overlay index query loop.");
    }
  }

  function handleApplyAndRedirect(jobItem) {
    const safeCompany = jobItem?.company || 'Employer';
    const safeTitle = jobItem?.title || 'Specialist Role';
    const threadIndex = chatThreads.findIndex(t => t.company === safeCompany);
    const currentTimeStamp = getRealTimeTimestamp();
    
    if (threadIndex !== -1) {
      setSelectedChatId(chatThreads[threadIndex].id);
    } else {
      const newId = chatThreads.length + 1;
      const dynamicNewThread = {
        id: newId,
        recruiter: `${safeCompany} HR Desk`,
        role: 'Recruiter Liaison',
        activity: 'Online now',
        company: safeCompany,
        position: safeTitle,
        salary: jobItem?.salary ? `PHP ${jobItem.salary.toLocaleString()}` : 'Negotiable Structure',
        timestamp: currentTimeStamp,
        messages: [
          { id: 1, text: `Hi, I'm interested in this position. May I learn more about this job?`, sender: 'user', time: currentTimeStamp }
        ],
        resumeSent: true 
      };
      setChatThreads([dynamicNewThread, ...chatThreads]);
      setSelectedChatId(newId);
    }

    setShowCompanyJobOverlay(false);
    Alert.alert("Application Sent", `You have applied to ${safeCompany}. Redirecting to conversations.`);
    setView('messages');
  }

  function handleSendMessage() {
    if (!typeMessage.trim()) return;
    const currentTimeStamp = getRealTimeTimestamp();

    setChatThreads(prevThreads => prevThreads.map(thread => {
      if (thread.id === selectedChatId) {
        return {
          ...thread,
          messages: [...thread.messages, { id: thread.messages.length + 1, text: typeMessage, sender: 'user', time: currentTimeStamp }]
        };
      }
      return thread;
    }));
    setTypeMessage('');
  }

  function handleTriggerSendResumeWidget() {
    setChatThreads(prevThreads => prevThreads.map(thread => {
      if (thread.id === selectedChatId) {
        if (thread.resumeSent) {
          Alert.alert("Already Sent", "Your resume has already been forwarded inside this active channel.");
          return thread;
        }
        return {
          ...thread,
          resumeSent: true
        };
      }
      return thread;
    }));
  }

  async function handleOpenJobDetailsModal(threadItem) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .ilike('company', threadItem.company)
        .ilike('title', threadItem.position)
        .limit(1);

      if (!error && data && data.length > 0) {
        setModalJobData(data[0]);
      } else {
        setModalJobData({
          title: threadItem.position || 'QA Tester',
          company: threadItem.company || 'BugSquash',
          salary_text: threadItem.salary || 'PHP 43K - 53K / mo',
          working_framework: 'Iloilo City',
          experience_range: '1-3 Yrs Exp',
          education_minimum: 'Edu not required',
          job_type: 'Full-time',
          description: 'We are seeking a meticulous, analytical, and detail-oriented QA Tester to join our engineering team. In this role, you will be the ultimate guardian of our product\'s quality, functionality, and user experience. You will be responsible for designing comprehensive workflows.',
          key_responsibilities: '• Quality System Development: Design, implement, and maintain the Product Quality Management System (QMS), establishing standardized testing protocols, verification metrics, and acceptance criteria.\n• New Product Introduction (NPI): Partner with Product Management and Engineering during early design phases to conduct Failure Mode and Effects Analysis (FMEA), proactively identifying and mitigating potential design or structural vulnerabilities.\n• Supplier & Factory Auditing: Audit and evaluate third-party manufacturing partners, testing laboratories, and component suppliers to ensure quality agreements and quality control (QC) tracking are secure.',
          qualifications: '• Bachelor\'s degree in Computer Science, Information Technology, or relevant technical fields.\n• Proven engineering experience designing functional automated script suites.\n• Exceptional multi-tenant logical diagnostics capacity troubleshooting systems schema dropouts.'
        });
      }
      setShowJobDetailsModal(true);
    } catch (e) {
      setShowJobDetailsModal(false);
    }
  }

  async function handleRedirectToJobOverview(threadItem) {
    try {
      setCompanyOverlayJobs([]);
      setShowCompanyJobOverlay(false);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .ilike('company', threadItem.company)
        .ilike('title', threadItem.position)
        .limit(1);

      if (!error && data && data.length > 0) {
        setSelectedJob(data[0]); 
      } else {
        setSelectedJob({
          title: threadItem.position,
          company: threadItem.company,
          location: 'Remote Workspace Framework',
          description: 'Detailed job overview snapshot referenced from chat thread parameters. Live posting content sync pending refresh loops.'
        });
      }
      setView('dashboard');
    } catch (e) {
      setView('dashboard');
    }
  }

  const uniqueIndustries = [...new Set(companies.map(c => c.industry).filter(Boolean))];
  const uniqueBenefits = [...new Set(companies.map(c => c.benefit).filter(Boolean))];
  
  const filteredChatThreads = chatThreads.filter(thread => 
    thread.recruiter.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
    thread.company.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
    thread.position.toLowerCase().includes(chatSearchQuery.toLowerCase())
  );

  const currentActiveChat = chatThreads.find(t => t.id === selectedChatId) || chatThreads[0];

  // --- 3. VIEW CONDITIONAL RENDERING ---

  if (view === 'landing' && !user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <StatusBar barStyle="dark-content" />
        
        <View style={styles.landingHeaderNav}>
          <Text style={styles.navLogo}>Career<Text style={{color: '#3b82f6'}}>Flow</Text></Text>
          <View style={styles.landingHeaderRight}>
            <TouchableOpacity style={styles.landingTextLink}><Text style={styles.navLinkTextText}>Home</Text></TouchableOpacity>
            <TouchableOpacity style={styles.landingTextLink}><Text style={styles.navLinkTextText}>Company</Text></TouchableOpacity>
            <TouchableOpacity style={styles.wireframeSignInOutlineBtn} onPress={() => setView('auth')}>
              <Text style={styles.wireframeSignInBtnTxt}>Sign-in</Text>
            </TouchableOpacity>
            <MaterialCommunityIcons name="account-circle-outline" size={24} color="#1e293b" style={{marginLeft: 10}} />
          </View>
        </View>

        <View style={styles.landingCenterHeroContainer}>
          <Text style={styles.landingHeroHugeLogo}>Career<Text style={{color: '#3b82f6'}}>Flow</Text></Text>
          <Text style={styles.landingHeroHeadline}>Your next job starts here</Text>
          <Text style={styles.landingHeroSubtext}>Create an account or sign in to see your personalized job recommendations.</Text>

          <View style={styles.landingCenterSearchFrame}>
            <MaterialCommunityIcons name="magnify" size={22} color="#94a3b8" style={{marginLeft: 16}} />
            <TextInput 
              style={styles.landingCenterInput} 
              placeholder="Search jobs, skillsets, or fields..." 
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setView('auth'); 
              }}
            />
          </View>

          <TouchableOpacity style={styles.landingHighContrastCtaBtn} onPress={() => setView('auth')}>
            <Text style={styles.landingCtaText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.phRegionLinkFrame} onPress={() => setView('auth')}>
            <Text style={styles.phRegionLinkText}>For jobs in the Philippines, visit <Text style={{color: '#3b82f6', textDecorationLine: 'underline'}}>www.careerflow.ph</Text></Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.wireframeFooterScribbleRow}>
          <Text style={styles.scribbleTextFallback}>•••••••• •••••• ••••••••</Text>
          <Text style={styles.scribbleTextFallback}>~~~~~~~~~~~~</Text>
        </View>
      </View>
    );
  }

  if (view === 'auth' && !user) {
    return (
      <View style={styles.authContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.heroCircle} />
        <View style={styles.authContentWrapper}>
          
          <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', marginBottom: 20}} onPress={() => setView('landing')}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#64748b" />
            <Text style={{color: '#64748b', marginLeft: 6, fontWeight: '600'}}>Back to Home</Text>
          </TouchableOpacity>

          <Text style={styles.logoText}>Career<Text style={{color: '#3b82f6'}}>Flow</Text></Text>
          <View style={styles.authBox}>
            <Text style={styles.instruction}>Sign in to access premium roles.</Text>
            <TextInput style={styles.creativeInput} placeholder="Email" placeholderTextColor="#94a3b8" value={email} onChangeText={setEmail} autoCapitalize="none" />
            <TextInput style={styles.creativeInput} placeholder="Password" placeholderTextColor="#94a3b8" secureTextEntry value={password} onChangeText={setPassword} />
            <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}><Text style={styles.buttonText}>Continue</Text></TouchableOpacity>
            <View style={styles.divider}><View style={styles.line} /><Text style={styles.dividerText}> OR </Text><View style={styles.line} /></View>
            <TouchableOpacity style={styles.googleButton}><MaterialCommunityIcons name="google" size={20} color="white" /><Text style={styles.googleButtonText}>Continue with Google</Text></TouchableOpacity>
          </View>
        </View> 
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />
      
      {/* GLOBAL TOP NAVIGATION HEADER */}
      <View style={styles.headerNav}>
        <Text style={styles.navLogo}>Career<Text style={{color: '#3b82f6'}}>Flow</Text></Text>
        <View style={styles.iconGroup}>
          <TouchableOpacity onPress={() => setView('dashboard')}><MaterialCommunityIcons name="compass" size={26} color={view === 'dashboard' ? "#3b82f6" : "#94a3b8"} /></TouchableOpacity>
          <TouchableOpacity onPress={() => setView('companies')}><MaterialCommunityIcons name="office-building" size={26} color={view === 'companies' ? "#3b82f6" : "#94a3b8"} /></TouchableOpacity>
          <TouchableOpacity onPress={() => setView('messages')}><MaterialCommunityIcons name="comment-text-multiple" size={25} color={view === 'messages' ? "#3b82f6" : "#94a3b8"} /></TouchableOpacity>
          <TouchableOpacity onPress={() => setView('profile')}><MaterialCommunityIcons name="account-circle" size={26} color={view === 'profile' ? "#3b82f6" : "#94a3b8"} /></TouchableOpacity>
          <TouchableOpacity onPress={() => supabase.auth.signOut().then(() => { setUser(null); setView('landing'); })}><MaterialCommunityIcons name="power" size={26} color="#ef4444" /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainWrapper}>
        {view === 'dashboard' && (
          /* --- DASHBOARD VIEW --- */
          <View style={styles.splitLayout}>
            <View style={styles.masterList}>
              
              {activeCompanyFilter && (
                <View style={styles.activeFilterNotificationBadge}>
                  <Text style={styles.activeFilterNotificationText} numberOfLines={1}>Showing jobs at: <Text style={{fontWeight: '800'}}>{activeCompanyFilter}</Text></Text>
                  <TouchableOpacity onPress={() => setActiveCompanyFilter(null)} style={styles.closeBadgeFilterCrossBtn}>
                    <MaterialCommunityIcons name="close-circle" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.searchSection}>
                <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
                <TextInput style={styles.searchBar} placeholder="Search jobs..." value={searchQuery} onChangeText={setSearchQuery} />
              </View>

              <View style={styles.filterMenuAnchor}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingBottom: 5}}>
                  <TouchableOpacity
                    style={[styles.filterChip, (activeLocation || showLocationDropdown) && styles.activeChip]}
                    onPress={() => {
                      setShowLocationDropdown(!showLocationDropdown);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text style={[styles.filterText, (activeLocation || showLocationDropdown) && styles.activeFilterText]} numberOfLines={1}>
                      {activeLocation ? `Loc: ${activeLocation}` : 'Location'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={16} color={(activeLocation || showLocationDropdown) ? "#fff" : "#64748b"} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.filterChip, (activeCategory || showCategoryDropdown) && styles.activeChip]}
                    onPress={() => {
                      setShowCategoryDropdown(!showCategoryDropdown);
                      setShowLocationDropdown(false);
                    }}
                  >
                    <Text style={[styles.filterText, (activeCategory || showCategoryDropdown) && styles.activeFilterText]} numberOfLines={1}>
                      {activeCategory ? `Cat: ${activeCategory}` : 'Category'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={16} color={(activeCategory || showCategoryDropdown) ? "#fff" : "#64748b"} />
                  </TouchableOpacity>
                </ScrollView>

                {showLocationDropdown && (
                  <View style={[styles.dropdownOverlayCard, { left: 0 }]}>
                    <ScrollView nestedScrollEnabled={true}>
                      {activeLocation && (
                        <TouchableOpacity style={styles.dropdownOptionRow} onPress={() => { setActiveLocation(null); setShowLocationDropdown(false); }}>
                          <Text style={styles.clearFilterText}>• Clear Location</Text>
                        </TouchableOpacity>
                      )}
                      {locations.map((loc) => (
                        <TouchableOpacity key={loc} style={[styles.dropdownOptionRow, activeLocation === loc && styles.selectedOptionRow]} onPress={() => { setActiveLocation(loc); setShowLocationDropdown(false); }}>
                          <Text style={[styles.dropdownOptionText, activeLocation === loc && styles.selectedOptionText]} numberOfLines={1}>{loc}</Text>
                          {activeLocation === loc && <MaterialCommunityIcons name="check" size={16} color="#3b82f6" />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {showCategoryDropdown && (
                  <View style={[styles.dropdownOverlayCard, { left: 95 }]}>
                    <ScrollView nestedScrollEnabled={true}>
                      {activeCategory && (
                        <TouchableOpacity style={styles.dropdownOptionRow} onPress={() => { setActiveCategory(null); setShowCategoryDropdown(false); }}>
                          <Text style={styles.clearFilterText}>• Clear Category</Text>
                        </TouchableOpacity>
                      )}
                      {categories.map((cat) => (
                        <TouchableOpacity key={cat} style={[styles.dropdownOptionRow, activeCategory === cat && styles.selectedOptionRow]} onPress={() => { setActiveCategory(cat); setShowCategoryDropdown(false); }}>
                          <Text style={[styles.dropdownOptionText, activeCategory === cat && styles.selectedOptionText]} numberOfLines={1}>{cat}</Text>
                          {activeCategory === cat && <MaterialCommunityIcons name="check" size={16} color="#3b82f6" />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <Text style={styles.sectionTitle}>Jobs for you</Text>
              <FlatList
                data={jobs}
                showsVerticalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.jobCard, selectedJob?.id === item.id && styles.activeCard]} onPress={() => setSelectedJob(item)}>
                    
                    {/* Dynamic Image Logo Client Loader URL Matrix */}
                    <View style={styles.companyIcon}>
                      {item.logo_url ? (
                        <Image 
                          source={{ uri: item.logo_url }} 
                          style={{ width: '100%', height: '100%', borderRadius: 10 }} 
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={{color: '#fff', fontWeight: 'bold'}}>{item.company?.charAt(0)}</Text>
                      )}
                    </View>

                    <View style={{ flex: 1 }}><Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text><Text style={styles.jobSub}>{item.company}</Text></View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#cbd5e1" />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No openings match this filter criteria.</Text>}
              />
            </View>

            <View style={styles.detailPane}>
              {selectedJob ? (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 24}}>
                  <Text style={styles.detailTitleLarge}>{selectedJob.title}</Text>
                  <Text style={styles.detailCompanySub}>{selectedJob.company} • {selectedJob.location}</Text>
                  <Text style={styles.salaryRange}>PHP {selectedJob.salary?.toLocaleString() || "Negotiable"} / mo</Text>
                  <TouchableOpacity style={styles.inlineApplyButton} onPress={() => handleApplyAndRedirect(selectedJob)}>
                    <Text style={styles.applyButtonText}>Apply</Text>
                  </TouchableOpacity>
                  <View style={styles.detailDivider} />
                  <Text style={styles.detailSectionLabel}>Working Hours</Text>
                  <Text style={[styles.detailBodyText, {marginBottom: 20}]}>{selectedJob.working_hours || "Standard shift framework."}</Text>
                  
                  <Text style={styles.detailSectionLabel}>Job Detail</Text>
                  <Text style={styles.detailBodyText}>{selectedJob.description || "Detailed overview coming soon."}</Text>
                  
                  <Text style={[styles.detailSectionLabel, {marginTop: 24}]}>Key Responsibilities</Text>
                  <Text style={styles.detailBodyText}>
                    {selectedJob.key_responsibilities || "• General duties as assigned."}
                  </Text>
                  
                  <Text style={[styles.detailSectionLabel, {marginTop: 24}]}>Qualifications</Text>
                  <Text style={styles.detailBodyText}>
                    {selectedJob.qualifications || "• Qualifications details coming soon."}
                  </Text>
                </ScrollView>
              ) : <View style={styles.emptyState}><Text style={{color: '#94a3b8'}}>Select a job card from left column</Text></View>}
            </View>
          </View>
        )}

        {view === 'companies' && (
          /* --- COMPANIES VIEW (Supports Multi-Tenant Side Overlays & Remote Logos) --- */
          <View style={{ flex: 1, flexDirection: 'row', gap: 20 }}>
            <View style={{ flex: 3 }}>
              <View style={styles.globalCompanyFilterContainer}>
                <Text style={styles.companySearchTitle}>Find your ideal company</Text>
                <View style={styles.companySearchBox}>
                  <MaterialCommunityIcons name="magnify" size={22} color="#94a3b8" />
                  <TextInput 
                    style={styles.companySearchInput} 
                    placeholder="Search brand or corporate entity..." 
                    value={companySearch} 
                    onChangeText={setCompanySearch} 
                  />
                </View>
                
                <View style={styles.companyFilterRow}>
                  <View style={{ zIndex: 999 }}>
                    <TouchableOpacity 
                      style={[styles.filterChip, selectedIndustry && styles.activeChip]} 
                      onPress={() => { setShowIndustryDropdown(!showIndustryDropdown); setShowBenefitDropdown(false); }}
                    >
                      <Text style={[styles.filterText, selectedIndustry && styles.activeFilterText]} numberOfLines={1}>
                        {selectedIndustry ? `Industry: ${selectedIndustry}` : '💼 Industry'}
                      </Text>
                      <MaterialCommunityIcons name="chevron-down" size={16} color={selectedIndustry ? "#fff" : "#64748b"} />
                    </TouchableOpacity>
                    
                    {showIndustryDropdown && (
                      <View style={[styles.dropdownOverlayCard, { left: 0, width: 220, top: 38 }]}>
                        <ScrollView nestedScrollEnabled>
                          <TouchableOpacity style={styles.dropdownOptionRow} onPress={() => { setSelectedIndustry(null); setShowIndustryDropdown(false); }}>
                            <Text style={styles.clearFilterText}>• Clear Industry Filter</Text>
                          </TouchableOpacity>
                          {uniqueIndustries.map(ind => (
                            <TouchableOpacity key={ind} style={styles.dropdownOptionRow} onPress={() => { setSelectedIndustry(ind); setShowIndustryDropdown(false); }}>
                              <Text style={styles.dropdownOptionText}>{ind}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  <View style={{ zIndex: 998 }}>
                    <TouchableOpacity 
                      style={[styles.filterChip, selectedBenefit && styles.activeChip]} 
                      onPress={() => { setShowBenefitDropdown(!showBenefitDropdown); setShowIndustryDropdown(false); }}
                    >
                      <Text style={[styles.filterText, selectedBenefit && styles.activeFilterText]} numberOfLines={1}>
                        {selectedBenefit ? `Benefit: ${selectedBenefit}` : '🎁 Benefits'}
                      </Text>
                      <MaterialCommunityIcons name="chevron-down" size={16} color={selectedBenefit ? "#fff" : "#64748b"} />
                    </TouchableOpacity>

                    {showBenefitDropdown && (
                      <View style={[styles.dropdownOverlayCard, { left: 0, width: 200, top: 38 }]}>
                        <ScrollView nestedScrollEnabled>
                          <TouchableOpacity style={styles.dropdownOptionRow} onPress={() => { setSelectedBenefit(null); setShowBenefitDropdown(false); }}>
                            <Text style={styles.clearFilterText}>• Clear Benefits Filter</Text>
                          </TouchableOpacity>
                          {uniqueBenefits.map(ben => (
                            <TouchableOpacity key={ben} style={styles.dropdownOptionRow} onPress={() => { setSelectedBenefit(ben); setShowBenefitDropdown(false); }}>
                              <Text style={styles.dropdownOptionText}>{ben}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Popular companies</Text>
              
              <FlatList
                data={companies}
                keyExtractor={(item) => item.id.toString()}
                numColumns={Dimensions.get('window').width > 900 ? 3 : 2}
                key={Dimensions.get('window').width > 900 ? 'compGrid3' : 'compGrid2'}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.companyGridCard} onPress={() => handleFetchCompanyOpeningsTab(item.name)}>
                    
                    {/* Dynamic Image Logo Client Loader URL Matrix for Companies Grid */}
                    <View style={styles.companyGridBadge}>
                      {item.logo_url ? (
                        <Image 
                          source={{ uri: item.logo_url }} 
                          style={{ width: '100%', height: '100%', borderRadius: 12 }} 
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.companyBadgeLetter}>{item.logo_letter || 'C'}</Text>
                      )}
                    </View>

                    <Text style={styles.companyGridName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.companyGridSub}>{item.industry || 'General Corporate'}</Text>
                    <Text style={styles.companyGridLoc}>📍 {item.location || 'Philippines'}</Text>
                    {item.benefit && (
                      <View style={styles.benefitPill}>
                        <Text style={styles.benefitPillText}>{item.benefit}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={{color: '#94a3b8', fontStyle: 'italic'}}>No multi-tenant entities matching current query parameters.</Text>
                  </View>
                }
              />
            </View>

            {showCompanyJobOverlay && (
              <View style={styles.companySidebarJobOpeningsTab}>
                <View style={styles.sidebarTabHeaderFlex}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.sidebarTabHeaderTitle} numberOfLines={1}>{companyOverlayName}</Text>
                    <Text style={styles.sidebarTabHeaderSubtitle}>Available Opportunities</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowCompanyJobOverlay(false)} style={styles.closeSidebarTabCrossIcon}>
                    <MaterialCommunityIcons name="close" size={20} color="#475569" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                  {companyOverlayJobs.length > 0 ? (
                    companyOverlayJobs.map((job) => (
                      <View key={job.id} style={styles.sidebarJobCardItem}>
                        <Text style={styles.sidebarJobCardTitle} numberOfLines={1}>{job.title}</Text>
                        <Text style={styles.sidebarJobCardLoc}>📍 {job.location || 'Manila'}</Text>
                        <Text style={styles.sidebarJobCardSalary}>PHP {job.salary?.toLocaleString() || 'Negotiable'}</Text>
                        
                        <TouchableOpacity 
                          style={styles.sidebarJobCardApplyBtn}
                          onPress={() => handleApplyAndRedirect(job)}
                        >
                          <Text style={styles.sidebarJobCardApplyBtnText}>Apply Now</Text>
                          <MaterialCommunityIcons name="chevron-right" size={14} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                      <MaterialCommunityIcons name="folder-alert-outline" size={32} color="#94a3b8" />
                      <Text style={styles.sidebarTabEmptyText}>No active job listings found for this entity.</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}

          </View>
        )}

        {view === 'messages' && (
          /* ==========================================
              RECRUITER CHAT WORKSPACE CONTEXT (SPLIT PANE)
             ========================================== */
          <View style={styles.splitLayout}>
            <View style={[styles.masterList, { maxWidth: 300, borderRightWidth: 1, borderRightColor: '#e2e8f0', paddingRight: 10 }]}>
              <View style={styles.chatSearchHeaderWrapper}>
                <Text style={styles.chatTitleBoldText}>Chat</Text>
                
                <View style={styles.chatHeaderSearchContainer}>
                  <MaterialCommunityIcons name="magnify" size={16} color="#475569" style={{ marginLeft: 8 }} />
                  <TextInput
                    style={styles.chatHeaderSearchInputController}
                    placeholder="Search thread..."
                    placeholderTextColor="#94a3b8"
                    value={chatSearchQuery}
                    onChangeText={setChatSearchQuery}
                  />
                  {chatSearchQuery !== '' && (
                    <TouchableOpacity onPress={() => setChatSearchQuery('')} style={{ marginRight: 8 }}>
                      <MaterialCommunityIcons name="close-circle" size={14} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.chatTabsRowBar}>
                <Text style={[styles.chatTabLabelNode, styles.activeChatTabLink]}>All</Text>
                <Text style={styles.chatTabLabelNode}>New</Text>
                <Text style={styles.chatTabLabelNode}>In Progress</Text>
                <Text style={styles.chatTabLabelNode}>More</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {filteredChatThreads.map((thread) => (
                  <TouchableOpacity 
                    key={thread.id} 
                    style={[styles.threadItemCardRow, selectedChatId === thread.id && styles.activeThreadSelectedBackground]}
                    onPress={() => setSelectedChatId(thread.id)}
                  >
                    <View style={styles.recruiterAvatarCircleMarker}>
                      <MaterialCommunityIcons name="account" size={24} color="#64748b" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.threadRecruiterNameText} numberOfLines={1}>{thread.recruiter}</Text>
                        <Text style={styles.threadTimeMarkerText}>{thread.timestamp}</Text>
                      </View>
                      <Text style={styles.threadMessageBodySnippetText} numberOfLines={1}>
                        {thread.messages[thread.messages.length - 1]?.text || 'No exchange record found.'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {filteredChatThreads.length === 0 && (
                  <Text style={styles.emptyText}>No threads found matching criteria.</Text>
                )}
                <Text style={styles.contactLimitTrackerLabel}>Contacted in the past 90 days</Text>
              </ScrollView>
            </View>

            <View style={[styles.detailPane, { flex: 3, backgroundColor: '#fff', borderRadius: 16, position: 'relative' }]}>
              <View style={styles.activeChatIdentityDashboardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.recruiterAvatarCircleMarker}>
                    <MaterialCommunityIcons name="account" size={26} color="#475569" />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.headerRecruiterMainTitleName}>{currentActiveChat.recruiter} <Text style={styles.headerRecruiterSubtitleRole}>{currentActiveChat.role} • {currentActiveChat.activity}</Text></Text>
                    <Text style={styles.headerContextCompanyBreadcrumb}>{currentActiveChat.company}</Text>
                    <Text style={styles.headerCommunicatingPositionTrackingLabel}>Communicating: <Text style={{fontWeight: '600'}}>{currentActiveChat.position}</Text> • {currentActiveChat.salary}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TouchableOpacity style={styles.jobDetailsActionLinkButton} onPress={() => handleOpenJobDetailsModal(currentActiveChat)}>
                    <MaterialCommunityIcons name="file-document-outline" size={16} color="#fff" />
                    <Text style={styles.jobDetailsActionLinkText}>Job Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.pinToTopSecondaryToggleBtn}>
                    <MaterialCommunityIcons name="pin-outline" size={16} color="#1e293b" />
                    <Text style={styles.pinToTopSecondaryToggleText}>Pin to the top</Text>
                  </TouchableOpacity>
                  <MaterialCommunityIcons name="dots-horizontal" size={22} color="#64748b" />
                </View>
              </View>

              <ScrollView 
                style={styles.chatScrollMessageContentFieldArea} 
                contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 24 }}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.chatSystemGlobalTimestampLabel}>{currentActiveChat.timestamp}</Text>
                <Text style={styles.jobInDiscussionContextTrackingLabel}>Job in discussion: <Text style={{color: '#3b82f6', textDecorationLine: 'underline'}}>{currentActiveChat.position}</Text></Text>

                {currentActiveChat.messages.map((msg) => (
                  <View 
                    key={msg.id} 
                    style={[styles.chatBubbleLayoutWrapper, msg.sender === 'user' ? styles.userChatBubbleAlignedRight : styles.recruiterChatBubbleAlignedLeft]}
                  >
                    <Text style={[styles.chatBubbleTextPayload, msg.sender === 'user' ? styles.userTextPayloadColor : styles.recruiterTextPayloadColor]}>
                      {msg.text}
                    </Text>
                    <View style={{ flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: 2, marginTop: 4 }}>
                      <Text style={{ fontSize: 9, color: msg.sender === 'user' ? '#64748b' : '#94a3b8' }}>{msg.time}</Text>
                      {msg.sender === 'user' && <MaterialCommunityIcons name="check" size={12} color="#3b82f6" />}
                    </View>
                  </View>
                ))}

                {currentActiveChat.resumeSent && (
                  <View style={styles.resumeAttachedStatusSystemRow}>
                    <Text style={styles.resumeAttachedStatusTextLabel}>You have sent your attached resume: <Text style={{color: '#3b82f6', fontWeight: '700', textDecorationLine: 'underline'}}>View</Text></Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.contextMacroFastActionsUtilityBar}>
                <TouchableOpacity style={styles.macroPillActionUtilityNode} onPress={handleTriggerSendResumeWidget}>
                  <MaterialCommunityIcons name="file-upload-outline" size={14} color="#1e293b" />
                  <Text style={styles.macroPillActionUtilityLabel}>Send resume</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.macroPillActionUtilityNode}>
                  <MaterialCommunityIcons name="phone-outline" size={14} color="#1e293b" />
                  <Text style={styles.macroPillActionUtilityLabel}>Exchange mobile number</Text>
                </TouchableOpacity>
                <View style={[styles.macroPillActionUtilityNode, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }]}>
                  <MaterialCommunityIcons name="calendar-blank-outline" size={14} color="#94a3b8" />
                  <Text style={[styles.macroPillActionUtilityLabel, { color: '#94a3b8' }]}>No Interview yet</Text>
                </View>
                <TouchableOpacity style={styles.macroPillActionUtilityNode}>
                  <MaterialCommunityIcons name="close-circle-outline" size={14} color="#1e293b" />
                  <Text style={styles.macroPillActionUtilityLabel}>Not interested</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.coreRealTimeChatInputConsoleSystemFieldDeck}>
                <MaterialCommunityIcons name="message-text-outline" size={20} color="#3b82f6" style={{ marginLeft: 6 }} />
                <TextInput 
                  style={styles.chatTextInputFieldControllerElement} 
                  placeholder="Write your message..." 
                  placeholderTextColor="#94a3b8"
                  value={typeMessage}
                  onChangeText={setTypeMessage}
                  onSubmitEditing={handleSendMessage}
                />
                <View style={styles.mediaAttachmentIconsActionDeckFlexRow}>
                  <MaterialCommunityIcons name="emoticon-happy-outline" size={20} color="#475569" />
                  <MaterialCommunityIcons name="image-outline" size={20} color="#475569" />
                  <MaterialCommunityIcons name="folder-open-outline" size={20} color="#475569" />
                  <TouchableOpacity style={styles.sendPayloadIconButtonSubmitBtn} onPress={handleSendMessage}>
                    <MaterialCommunityIcons name="send" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* DETAILED SPECIFICATIONS SCREEN MODAL OVERLAY */}
              {showJobDetailsModal && modalJobData && (
                <View style={styles.modalViewportBackdropBlur}>
                  <View style={styles.modalContentCardContainer}>
                    
                    <View style={styles.modalControlFlexHeader}>
                      <TouchableOpacity 
                        style={[styles.modalUndoSaveBadgeRow, !isSavedJob && { backgroundColor: '#f1f5f9' }]}
                        onPress={() => setIsSavedJob(!isSavedJob)}
                      >
                        <MaterialCommunityIcons 
                          name={isSavedJob ? "star" : "star-outline"} 
                          size={16} 
                          color={isSavedJob ? "#3b82f6" : "#64748b"} 
                        />
                        <Text style={[styles.modalUndoSaveTextLabel, !isSavedJob && { color: '#64748b' }]}>
                          {isSavedJob ? 'Undo saved' : 'Save job'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.closeModalCrossIconBtn} onPress={() => setShowJobDetailsModal(false)}>
                        <MaterialCommunityIcons name="close" size={22} color="#475569" />
                      </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 20 }}>
                      <Text style={styles.modalMainJobTitleHeader}>{modalJobData.title}</Text>
                      <Text style={styles.modalMainCompanySubLabel}>{modalJobData.company || modalJobData.company_name}</Text>
                      
                      <View style={styles.modalTagsFlexRowDeck}>
                        <Text style={styles.modalSalaryHighlightText}>{modalJobData.salary_text || `PHP ${modalJobData.salary?.toLocaleString()} / mo`}</Text>
                        <Text style={styles.modalStructuralLabelDotDivider}>•</Text>
                        <Text style={styles.modalSecondaryTagMetaLabel}>{modalJobData.working_framework || modalJobData.location || 'Remote'}</Text>
                        <Text style={styles.modalStructuralLabelDotDivider}>•</Text>
                        <Text style={styles.modalSecondaryTagMetaLabel}>{modalJobData.experience_range || '1-3 Yrs Exp'}</Text>
                        <Text style={styles.modalStructuralLabelDotDivider}>•</Text>
                        <Text style={styles.modalSecondaryTagMetaLabel}>{modalJobData.education_minimum || 'Edu not required'}</Text>
                        <Text style={styles.modalStructuralLabelDotDivider}>•</Text>
                        <Text style={styles.modalSecondaryTagMetaLabel}>{modalJobData.job_type || 'Full-time'}</Text>
                      </View>

                      <Text style={styles.modalSectionSubHeadingLabel}>Job Description</Text>
                      
                      <Text style={styles.modalBenefitsSubTitleSectionLabel}>Benefits</Text>
                      
                      <View style={styles.modalBenefitRowItemNode}>
                        <MaterialCommunityIcons name="creation" size={20} color="#1e293b" style={styles.benefitIconSpacingFix} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.benefitItemMainBoldText}>Employee Recognition and Rewards</Text>
                          <Text style={styles.benefitItemSubtitleDescText}>Performance Bonus</Text>
                        </View>
                      </View>

                      <View style={styles.modalBenefitRowItemNode}>
                        <MaterialCommunityIcons name="school-outline" size={20} color="#1e293b" style={styles.benefitIconSpacingFix} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.benefitItemMainBoldText}>Professional Development</Text>
                          <Text style={styles.benefitItemSubtitleDescText}>Career Development</Text>
                        </View>
                      </View>

                      <View style={styles.modalBenefitRowItemNode}>
                        <MaterialCommunityIcons name="weather-sunny" size={20} color="#1e293b" style={styles.benefitIconSpacingFix} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.benefitItemMainBoldText}>Time Off & Leave</Text>
                          <Text style={styles.benefitItemSubtitleDescText}>Unlimited or Flexible PTO</Text>
                        </View>
                      </View>

                      <Text style={styles.modalInternalBodyBlockHeadline}>Grow With Us</Text>
                      <Text style={styles.modalParagraphLongFormText}>
                        {modalJobData.description || modalJobData.description_body_grow || 'Corporate specifications matrix onboarding sequence ongoing.'}
                      </Text>

                      <Text style={styles.modalInternalBodyBlockHeadline}>Key Responsibilities</Text>
                      <Text style={styles.modalParagraphLongFormText}>
                        {modalJobData.key_responsibilities || '• General administrative and engineering duties as assigned inside system scopes accurately.'}
                      </Text>

                      <Text style={styles.modalInternalBodyBlockHeadline}>Qualifications</Text>
                      <Text style={styles.modalParagraphLongFormText}>
                        {modalJobData.qualifications || '• Academic background benchmark tracking records or relevant technical experiences coming soon.'}
                      </Text>

                    </ScrollView>

                  </View>
                </View>
              )}

            </View>
          </View>
        )}

        {view === 'profile' && (
          /* --- PROFILE VIEW --- */
          <View style={styles.splitLayout}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.profileMainColumn}>
              <View style={styles.bioCard}>
                <View style={styles.banner} />
                <View style={styles.avatarPositioner}><View style={styles.avatarLarge}><MaterialCommunityIcons name="account" size={80} color="white" /></View></View>
                <View style={styles.bioContent}>
                  <Text style={styles.profileNameMain}>Lance Bongayan</Text>
                  <Text style={styles.profileHeadline}>IT Student | Aspiring Full-Stack Developer</Text>
                  <Text style={styles.locationText}>Quezon City, Metro Manila</Text>
                  <View style={styles.detailDivider} />
                  
                  <Text style={styles.aboutLabel}>About</Text>
                  <Text style={styles.aboutText}>IT student passionate about systems architecture, database schemas, real-time analytics dashboards, and clean functional user experiences.</Text>
                  
                  <Text style={[styles.aboutLabel, {marginTop: 25}]}>Skills</Text>
                  <View style={styles.skillsGrid}>
                    {skills.length > 0 ? skills.map(s => (
                      <View key={s.id} style={styles.skillBadge}><Text style={styles.skillText}>{s.skill_name}</Text></View>
                    )) : <Text style={styles.emptyText}>No verified skills discovered matching parameters.</Text>}
                  </View>

                  <Text style={[styles.aboutLabel, {marginTop: 25}]}>Experience</Text>
                  {experience.length > 0 ? experience.map(exp => (
                    <View key={exp.id} style={styles.infoBlock}>
                      <MaterialCommunityIcons name="briefcase-outline" size={24} color="#1e293b" />
                      <View style={styles.infoTextGroup}><Text style={styles.infoTitle}>{exp.role}</Text><Text style={styles.infoSub}>{exp.company} • {exp.duration}</Text></View>
                    </View>
                  )) : <Text style={styles.emptyText}>No industry background roles configured yet.</Text>}

                  <Text style={[styles.aboutLabel, {marginTop: 25}]}>Education</Text>
                  {education.length > 0 ? education.map(edu => (
                    <View key={edu.id} style={styles.infoBlock}>
                      <MaterialCommunityIcons name="school-outline" size={24} color="#1e293b" />
                      <View style={styles.infoTextGroup}><Text style={styles.infoTitle}>{edu.degree}</Text><Text style={styles.infoSub}>{edu.school} • {edu.year}</Text></View>
                    </View>
                  )) : <Text style={styles.emptyText}>No registered academic benchmarks found records for.</Text>}

                  <View style={styles.detailDivider} />
                  <Text style={styles.aboutLabel}>Suggested for you</Text>
                  <View style={styles.privateVisibilitySubRow}>
                    <MaterialCommunityIcons name="eye-off-outline" size={14} color="#64748b" />
                    <Text style={styles.privateVisibilityText}>Private to you</Text>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.widgetCardDeckRow}>
                    <View style={styles.promptActionCard}>
                      <View style={styles.cardHeaderFlex}>
                        <View style={styles.illustrationSquareIcon}>
                          <MaterialCommunityIcons name="office-building-marker" size={26} color="#475569" />
                        </View>
                        <TouchableOpacity style={styles.dismissCardButton}>
                          <MaterialCommunityIcons name="close" size={16} color="#64748b" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.promptCardTitle}>Which industry do you work in?</Text>
                      <Text style={styles.promptCardBody}>Members who add an industry receive up to 2.5 times as many profile views.</Text>
                      <TouchableOpacity style={styles.pillActionButton}>
                        <Text style={styles.pillActionText}>Add industry</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.promptActionCard}>
                      <View style={styles.cardHeaderFlex}>
                        <View style={styles.illustrationSquareIcon}>
                          <MaterialCommunityIcons name="card-account-details-outline" size={26} color="#475569" />
                        </View>
                        <TouchableOpacity style={styles.dismissCardButton}>
                          <MaterialCommunityIcons name="close" size={16} color="#64748b" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.promptCardTitle} numberOfLines={2}>Write a summary to highlight your personality or work experience</Text>
                      <Text style={styles.promptCardBody}>Members who include a summary receive up to 3.9 times as many profile views.</Text>
                      <TouchableOpacity style={styles.pillActionButton}>
                        <Text style={styles.pillActionText}>Add a summary</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>

                  <View style={styles.detailDivider} />
                  <Text style={styles.aboutLabel}>Analytics</Text>
                  <View style={styles.privateVisibilitySubRow}>
                    <MaterialCommunityIcons name="eye-off-outline" size={14} color="#64748b" />
                    <Text style={styles.privateVisibilityText}>Private to you</Text>
                  </View>

                  <View style={styles.analyticsStatsGridRow}>
                    <View style={styles.analyticsStatNode}>
                      <View style={styles.nodeDataHeader}>
                        <MaterialCommunityIcons name="account-group" size={20} color="#1e293b" style={{marginRight: 6}} />
                        <Text style={styles.statLargeNumber}>0</Text>
                      </View>
                      <Text style={styles.statLabelHeading}>profile views</Text>
                      <Text style={styles.statSubTextDetail}>Update your profile to attract viewers.</Text>
                    </View>

                    <View style={styles.analyticsStatNode}>
                      <View style={styles.nodeDataHeader}>
                        <MaterialCommunityIcons name="chart-bar" size={20} color="#1e293b" style={{marginRight: 6}} />
                        <Text style={styles.statLargeNumber}>0</Text>
                      </View>
                      <Text style={styles.statLabelHeading}>post impressions</Text>
                      <Text style={styles.statSubTextDetail}>Start a post to increase engagement.</Text>
                      <Text style={styles.pastDateRangeFooter}>Past 7 days</Text>
                    </View>

                    <View style={styles.analyticsStatNode}>
                      <View style={styles.nodeDataHeader}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#1e293b" style={{marginRight: 6}} />
                        <Text style={styles.statLargeNumber}>0</Text>
                      </View>
                      <Text style={styles.statLabelHeading}>search appearances</Text>
                      <Text style={styles.statSubTextDetail}>Update your profile to appear more in search.</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.expandAnalyticsFooterButton}>
                    <Text style={styles.expandFooterText}>Show all</Text>
                    <MaterialCommunityIcons name="arrow-right" size={16} color="#475569" style={{marginLeft: 6}} />
                  </TouchableOpacity>

                </View>
              </View>
            </ScrollView>

            <View style={styles.sidebar}>
              <View style={styles.widgetCard}><Text style={styles.widgetTitle}>Profile Language</Text><Text style={styles.widgetValue}>English, Tagalog</Text></View>
              <View style={styles.widgetCard}><Text style={styles.widgetTitle}>Public Profile & URL</Text><Text style={styles.widgetLink}>careerflow.com/in/lance-b</Text></View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ==========================================
  // ACCESSIBLE HOMEPAGE LANDING LAYERS
  // ==========================================
  landingHeaderNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 40, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  landingHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  landingTextLink: { paddingVertical: 6, paddingHorizontal: 4 },
  navLinkTextText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  wireframeSignInOutlineBtn: { borderWidth: 1, borderColor: '#1e293b', borderRadius: 6, paddingHorizontal: 16, paddingVertical: 8, justifyContent: 'center', alignItems: 'center' },
  wireframeSignInBtnTxt: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  landingCenterHeroContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, maxWidth: 800, alignSelf: 'center', width: '100%' },
  landingHeroHugeLogo: { fontSize: 56, fontWeight: '900', color: '#1e293b', marginBottom: 12 },
  landingHeroHeadline: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 12, textAlign: 'center' },
  landingHeroSubtext: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 36, maxWidth: 520, lineHeight: 22 },
  landingCenterSearchFrame: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 30, borderWidth: 1, borderColor: '#cbd5e1', width: '100%', maxWidth: 540, height: 54, marginBottom: 20 },
  landingCenterInput: { flex: 1, paddingVertical: 14, paddingRight: 20, fontSize: 16, color: '#1e293b', marginLeft: 12 },
  landingHighContrastCtaBtn: { backgroundColor: '#1e293b', paddingHorizontal: 36, paddingVertical: 14, borderRadius: 24, minHeight: 46, justifyContent: 'center', alignItems: 'center' },
  landingCtaText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  phRegionLinkFrame: { marginTop: 32, padding: 8 },
  phRegionLinkText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  wireframeFooterScribbleRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 40, paddingBottom: 30, backgroundColor: '#fff' },
  scribbleTextFallback: { fontSize: 12, color: '#cbd5e1', letterSpacing: 2 },

  // ==========================================
  // STRUCTURAL LAYOUT FLEX BASE CONFIGS
  // ==========================================
  authContainer: { flex: 1, justifyContent: 'center', backgroundColor: '#fff', paddingHorizontal: 24 },
  authContentWrapper: { width: '100%', maxWidth: 380, alignSelf: 'center' },
  mainWrapper: { flex: 1, width: '100%', maxWidth: 1100, alignSelf: 'center', paddingHorizontal: 20 },
  heroCircle: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#eff6ff' },
  splitLayout: { flex: 1, flexDirection: 'row', gap: 24, marginTop: 10 },
  headerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 25, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  navLogo: { fontWeight: '900', fontSize: 22, color: '#1e293b' },
  iconGroup: { flexDirection: 'row', gap: 20, alignItems: 'center' },

  masterList: { flex: 1, maxWidth: 350 },
  searchSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 15 },
  searchBar: { flex: 1, paddingVertical: 12, marginLeft: 8 },
  filterMenuAnchor: { marginBottom: 15, position: 'relative', zIndex: 50 },
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8, gap: 4, maxWidth: 180 },
  activeChip: { backgroundColor: '#1e293b', borderColor: '#1e293b' },
  filterText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  activeFilterText: { color: '#fff' },

  dropdownOverlayCard: { position: 'absolute', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10, paddingVertical: 4, zIndex: 9999, maxHeight: 220 },
  dropdownOptionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  selectedOptionRow: { backgroundColor: '#f0f6ff' },
  dropdownOptionText: { fontSize: 13, color: '#475569', flex: 1 },
  selectedOptionText: { color: '#3b82f6', fontWeight: '600' },
  clearFilterText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },

  activeFilterNotificationBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#eff6ff', borderRadius: 10, borderWidth: 1, borderColor: '#bfdbfe', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 15 },
  activeFilterNotificationText: { fontSize: 12, color: '#1e40af', flex: 1 },
  closeBadgeFilterCrossBtn: { paddingHorizontal: 4, paddingVertical: 2 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  jobCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 10, alignItems: 'center', elevation: 2 },
  activeCard: { borderColor: '#3b82f6', borderWidth: 2, backgroundColor: '#eff6ff' },
  companyIcon: { width: 40, height: 40, backgroundColor: '#1e293b', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  jobTitle: { fontWeight: 'bold', fontSize: 14, color: '#1e293b' },
  jobSub: { color: '#64748b', fontSize: 12 },

  detailPane: { flex: 2, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20, overflow: 'hidden' },
  detailTitleLarge: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  detailCompanySub: { fontSize: 16, color: '#64748b', marginTop: 4 },
  salaryRange: { fontSize: 16, color: '#16a34a', fontWeight: '600', marginTop: 12 },
  inlineApplyButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#1e293b', paddingVertical: 8, paddingHorizontal: 25, borderRadius: 20, alignSelf: 'flex-start', marginTop: 20 },
  applyButtonText: { color: '#1e293b', fontWeight: 'bold' },
  detailDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 24 },
  detailSectionLabel: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  detailBodyText: { fontSize: 14, color: '#475569', lineHeight: 22, fontWeight: '500' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ==========================================
  // COMPANIES GRID CORE MODULES
  // ==========================================
  globalCompanyFilterContainer: { paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginBottom: 20, zIndex: 500, position: 'relative' },
  companySearchTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  companySearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: '#cbd5e1', height: 50 },
  companySearchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1e293b' },
  companyFilterRow: { flexDirection: 'row', gap: 10, marginTop: 15, position: 'relative' },
  companyGridCard: { flex: 1, minWidth: 200, backgroundColor: '#fff', borderRadius: 16, padding: 16, margin: 6, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 6, elevation: 1 },
  companyGridBadge: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginBottom: 12, overflow: 'hidden' },
  companyBadgeLetter: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  companyGridName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  companyGridSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  companyGridLoc: { fontSize: 12, color: '#475569', marginTop: 6 },
  benefitPill: { alignSelf: 'flex-start', backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 10 },
  benefitPillText: { fontSize: 11, color: '#15803d', fontWeight: '600' },

  companySidebarJobOpeningsTab: { flex: 1.2, maxWidth: 360, backgroundColor: '#fff', borderRadius: 16, borderLeftWidth: 1, borderLeftColor: '#e2e8f0', padding: 18, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  sidebarTabHeaderFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 14, marginBottom: 16 },
  sidebarTabHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  sidebarTabHeaderSubtitle: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },
  closeSidebarTabCrossIcon: { padding: 4 },
  sidebarJobCardItem: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  sidebarJobCardTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  sidebarJobCardLoc: { fontSize: 12, color: '#64748b', marginTop: 4 },
  sidebarJobCardSalary: { fontSize: 12, color: '#16a34a', fontWeight: '700', marginTop: 4 },
  sidebarJobCardApplyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start', marginTop: 12, gap: 4 },
  sidebarJobCardApplyBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  sidebarTabEmptyText: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 10, paddingHorizontal: 10, fontWeight: '500' },

  // ==========================================
  // REAL-TIME CONVERSATION CHAT TILES
  // ==========================================
  chatSearchHeaderWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 5, marginBottom: 5 },
  chatTitleBoldText: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  chatHeaderSearchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 8, flex: 1, marginLeft: 16, height: 32 },
  chatHeaderSearchInputController: { flex: 1, paddingVertical: 4, paddingHorizontal: 8, fontSize: 12, color: '#1e293b' },
  chatTabsRowBar: { flexDirection: 'row', gap: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 10, paddingHorizontal: 5 },
  chatTabLabelNode: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  activeChatTabLink: { color: '#3b82f6', borderBottomWidth: 2, borderBottomColor: '#3b82f6', paddingBottom: 8 },
  threadItemCardRow: { flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 4, alignItems: 'center' },
  activeThreadSelectedBackground: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  recruiterAvatarCircleMarker: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  threadRecruiterNameText: { fontSize: 14, fontWeight: '700', color: '#1e293b', flex: 1 },
  threadTimeMarkerText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  threadMessageBodySnippetText: { fontSize: 12, color: '#64748b', marginTop: 3 },
  contactLimitTrackerLabel: { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  activeChatIdentityDashboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#fff' },
  headerRecruiterMainTitleName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  headerRecruiterSubtitleRole: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  headerContextCompanyBreadcrumb: { fontSize: 13, color: '#475569', fontWeight: '600', marginTop: 2 },
  headerCommunicatingPositionTrackingLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  jobDetailsActionLinkButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 6 },
  jobDetailsActionLinkText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  pinToTopSecondaryToggleBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 6, backgroundColor: '#fff' },
  pinToTopSecondaryToggleText: { color: '#1e293b', fontSize: 12, fontWeight: '700' },
  chatScrollMessageContentFieldArea: { flex: 1, backgroundColor: '#f8fafc' },
  chatSystemGlobalTimestampLabel: { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginVertical: 12, fontWeight: '600' },
  jobInDiscussionContextTrackingLabel: { fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 20 },
  chatBubbleLayoutWrapper: { maxWidth: '75%', padding: 14, borderRadius: 12, marginBottom: 10, position: 'relative' },
  userChatBubbleAlignedRight: { backgroundColor: '#eff6ff', alignSelf: 'flex-end', borderTopRightRadius: 2 },
  recruiterChatBubbleAlignedLeft: { backgroundColor: '#fff', alignSelf: 'flex-start', borderTopLeftRadius: 2, borderWidth: 1, borderColor: '#e2e8f0' },
  chatBubbleTextPayload: { fontSize: 14, lineHeight: 20 },
  userTextPayloadColor: { color: '#1e293b' },
  recruiterTextPayloadColor: { color: '#312e81' },
  resumeAttachedStatusSystemRow: { alignSelf: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, marginVertical: 15 },
  resumeAttachedStatusTextLabel: { fontSize: 12, color: '#475569' },
  contextMacroFastActionsUtilityBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fff', flexWrap: 'wrap' },
  macroPillActionUtilityNode: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, gap: 6 },
  macroPillActionUtilityLabel: { fontSize: 12, color: '#1e293b', fontWeight: '600' },
  coreRealTimeChatInputConsoleSystemFieldDeck: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e2e8f0', padding: 14, backgroundColor: '#fff', gap: 12 },
  chatTextInputFieldControllerElement: { flex: 1, height: 42, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 16, fontSize: 14, color: '#1e293b' },
  mediaAttachmentIconsActionDeckFlexRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  sendPayloadIconButtonSubmitBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginLeft: 4 },

  // ==========================================
  // EXTENDED SPECIFICATIONS POPUP OVERLAYS
  // ==========================================
  modalViewportBackdropBlur: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(30, 41, 59, 0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 99999 },
  modalContentCardContainer: { width: '90%', maxWidth: 640, height: '85%', backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12, paddingHorizontal: 28, paddingTop: 20 },
  modalControlFlexHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalUndoSaveBadgeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  modalUndoSaveTextLabel: { fontSize: 13, fontWeight: '700', color: '#1e40af' },
  closeModalCrossIconBtn: { padding: 4 },
  modalMainJobTitleHeader: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  modalMainCompanySubLabel: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 14 },
  modalTagsFlexRowDeck: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 24 },
  modalSalaryHighlightText: { fontSize: 14, fontWeight: '800', color: '#3b82f6' },
  modalStructuralLabelDotDivider: { color: '#94a3b8', fontWeight: 'bold' },
  modalSecondaryTagMetaLabel: { fontSize: 13, fontWeight: '500', color: '#64748b' },
  modalSectionSubHeadingLabel: { fontSize: 16, fontWeight: '800', color: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10, marginBottom: 14 },
  modalBenefitsSubTitleSectionLabel: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 14 },
  modalBenefitRowItemNode: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  benefitIconSpacingFix: { marginTop: 1 },
  benefitItemMainBoldText: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  benefitItemSubtitleDescText: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '500' },
  modalInternalBodyBlockHeadline: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginTop: 20, marginBottom: 8 },
  modalParagraphLongFormText: { fontSize: 14, color: '#475569', lineHeight: 22, fontWeight: '500', marginBottom: 10 },

  // ==========================================
  // CANDIDATE PROFILE PORTFOLIO WORKSPACES
  // ==========================================
  profileMainColumn: { flex: 2 },
  sidebar: { flex: 1, maxWidth: 300, gap: 15 },
  bioCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  banner: { height: 150, backgroundColor: '#f1f5f9' },
  avatarPositioner: { marginTop: -50, marginLeft: 25 },
  avatarLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#3b82f6', borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  bioContent: { padding: 25 },
  profileNameMain: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  profileHeadline: { color: '#475569', marginTop: 4 },
  locationText: { color: '#64748b', fontSize: 13, marginTop: 4 },
  aboutLabel: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  aboutText: { color: '#475569', lineHeight: 22, marginTop: 8 },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  skillBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  skillText: { color: '#475569', fontSize: 14, fontWeight: '600' },
  infoBlock: { flexDirection: 'row', alignItems: 'center', marginTop: 15, gap: 15 },
  infoTextGroup: { flex: 1 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  infoSub: { fontSize: 14, color: '#64748b' },
  widgetCard: { backgroundColor: '#fff', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  widgetTitle: { fontWeight: 'bold', fontSize: 14, color: '#1e293b' },
  widgetValue: { color: '#64748b', fontSize: 12 },
  widgetLink: { color: '#3b82f6', fontSize: 12 },

  privateVisibilitySubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 15, gap: 4 },
  privateVisibilityText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  widgetCardDeckRow: { flexDirection: 'row', marginBottom: 5 },
  promptActionCard: { width: 310, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', marginRight: 12, position: 'relative' },
  cardHeaderFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  illustrationSquareIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  dismissCardButton: { padding: 4 },
  promptCardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 6, lineHeight: 18 },
  promptCardBody: { fontSize: 12, color: '#475569', lineHeight: 16, marginBottom: 16 },
  pillActionButton: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b' },
  pillActionText: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  analyticsStatsGridRow: { flexDirection: 'row', gap: 12, width: '100%', flexWrap: 'wrap' },
  analyticsStatNode: { flex: 1, minWidth: 200, paddingVertical: 8, paddingRight: 12, position: 'relative' },
  nodeDataHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  statLargeNumber: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  statLabelHeading: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  statSubTextDetail: { fontSize: 12, color: '#475569', lineHeight: 16, marginTop: 2 },
  pastDateRangeFooter: { fontSize: 11, color: '#64748b', marginTop: 6, fontWeight: '500' },
  expandAnalyticsFooterButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 15, paddingTop: 14, width: '100%' },
  expandFooterText: { fontSize: 14, fontWeight: '700', color: '#475569' },

  // ==========================================
  // TEXT, DIVIDERS & UTILITY HEADINGS
  // ==========================================
  logoText: { fontSize: 42, fontWeight: '900', color: '#1e293b', textAlign: 'center', marginBottom: 8 },
  instruction: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 32 },
  creativeInput: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 14, marginBottom: 14, fontSize: 16, color: '#1e293b' },
  primaryButton: { backgroundColor: '#1e293b', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  googleButton: { backgroundColor: '#3b82f6', flexDirection: 'row', padding: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 12 },
  googleButtonText: { color: '#fff', fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  line: { flex: 1, height: 1, backgroundColor: '#f1f5f9' },
  dividerText: { color: '#94a3b8', paddingHorizontal: 12, fontSize: 12 },
  emptyText: { color: '#94a3b8', fontStyle: 'italic', marginTop: 10, textAlign: 'center', padding: 20 }
});