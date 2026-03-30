export interface CityData {
  name: string;
  state: string;
  lat: number;
  lng: number;
  riskScore: number;
  riskLevel: "high" | "moderate" | "low";
  mentions: number;
  diseases: { name: string; cases: number; trend: "up" | "down" | "stable" }[];
  symptoms: string[];
  news: { title: string; source: string; time: string }[];
  prediction7d: number[];
  population: string;
}

export const cities: CityData[] = [
  {
    name: "Delhi",
    state: "Delhi",
    lat: 28.6139,
    lng: 77.209,
    riskScore: 87,
    riskLevel: "high",
    mentions: 1247,
    diseases: [
      { name: "Dengue", cases: 342, trend: "up" },
      { name: "Flu", cases: 189, trend: "stable" },
      { name: "COVID-like", cases: 56, trend: "down" },
    ],
    symptoms: ["Fever", "Headache", "Joint Pain", "Fatigue", "Rash"],
    news: [
      { title: "Dengue cases surge in East Delhi colonies", source: "Times of India", time: "2h ago" },
      { title: "AIIMS reports 30% rise in fever patients", source: "NDTV", time: "5h ago" },
      { title: "Delhi govt deploys fogging machines in 12 wards", source: "Hindustan Times", time: "8h ago" },
    ],
    prediction7d: [342, 378, 410, 445, 460, 490, 520],
    population: "32M",
  },
  {
    name: "Mumbai",
    state: "Maharashtra",
    lat: 19.076,
    lng: 72.8777,
    riskScore: 72,
    riskLevel: "high",
    mentions: 892,
    diseases: [
      { name: "Dengue", cases: 198, trend: "up" },
      { name: "Malaria", cases: 145, trend: "up" },
      { name: "TB", cases: 89, trend: "stable" },
    ],
    symptoms: ["Fever", "Chills", "Sweating", "Body Ache"],
    news: [
      { title: "Malaria cases spike after heavy monsoon rains", source: "Indian Express", time: "3h ago" },
      { title: "BMC intensifies vector control in slum areas", source: "Mid-Day", time: "6h ago" },
    ],
    prediction7d: [198, 215, 240, 258, 270, 285, 295],
    population: "21M",
  },
  {
    name: "Kolkata",
    state: "West Bengal",
    lat: 22.5726,
    lng: 88.3639,
    riskScore: 58,
    riskLevel: "moderate",
    mentions: 654,
    diseases: [
      { name: "Dengue", cases: 156, trend: "up" },
      { name: "Flu", cases: 98, trend: "down" },
    ],
    symptoms: ["Fever", "Headache", "Nausea", "Fatigue"],
    news: [
      { title: "Dengue cases rise in South Kolkata wards", source: "Telegraph", time: "4h ago" },
    ],
    prediction7d: [156, 170, 182, 190, 195, 200, 208],
    population: "15M",
  },
  {
    name: "Chennai",
    state: "Tamil Nadu",
    lat: 13.0827,
    lng: 80.2707,
    riskScore: 45,
    riskLevel: "moderate",
    mentions: 523,
    diseases: [
      { name: "Dengue", cases: 120, trend: "stable" },
      { name: "COVID-like", cases: 34, trend: "down" },
    ],
    symptoms: ["Fever", "Cough", "Body Pain"],
    news: [
      { title: "Chennai corporation ramps up dengue prevention", source: "The Hindu", time: "6h ago" },
    ],
    prediction7d: [120, 118, 122, 125, 123, 120, 118],
    population: "11M",
  },
  {
    name: "Bangalore",
    state: "Karnataka",
    lat: 12.9716,
    lng: 77.5946,
    riskScore: 32,
    riskLevel: "low",
    mentions: 312,
    diseases: [
      { name: "Flu", cases: 67, trend: "down" },
      { name: "COVID-like", cases: 23, trend: "down" },
    ],
    symptoms: ["Cough", "Cold", "Mild Fever"],
    news: [
      { title: "Bangalore sees decline in respiratory infections", source: "Deccan Herald", time: "12h ago" },
    ],
    prediction7d: [67, 62, 58, 55, 52, 50, 48],
    population: "13M",
  },
  {
    name: "Hyderabad",
    state: "Telangana",
    lat: 17.385,
    lng: 78.4867,
    riskScore: 48,
    riskLevel: "moderate",
    mentions: 445,
    diseases: [
      { name: "Dengue", cases: 89, trend: "up" },
      { name: "Flu", cases: 45, trend: "stable" },
    ],
    symptoms: ["Fever", "Headache", "Fatigue"],
    news: [
      { title: "GHMC launches anti-mosquito drive", source: "Telangana Today", time: "7h ago" },
    ],
    prediction7d: [89, 95, 102, 108, 112, 118, 125],
    population: "10M",
  },
  {
    name: "Pune",
    state: "Maharashtra",
    lat: 18.5204,
    lng: 73.8567,
    riskScore: 42,
    riskLevel: "moderate",
    mentions: 389,
    diseases: [
      { name: "Flu", cases: 78, trend: "stable" },
      { name: "Dengue", cases: 45, trend: "down" },
    ],
    symptoms: ["Fever", "Cough", "Runny Nose"],
    news: [],
    prediction7d: [78, 75, 72, 70, 68, 65, 63],
    population: "7M",
  },
  {
    name: "Ahmedabad",
    state: "Gujarat",
    lat: 23.0225,
    lng: 72.5714,
    riskScore: 38,
    riskLevel: "low",
    mentions: 267,
    diseases: [
      { name: "Flu", cases: 56, trend: "down" },
      { name: "TB", cases: 34, trend: "stable" },
    ],
    symptoms: ["Cough", "Fever", "Weight Loss"],
    news: [],
    prediction7d: [56, 52, 49, 46, 44, 42, 40],
    population: "8M",
  },
  {
    name: "Jaipur",
    state: "Rajasthan",
    lat: 26.9124,
    lng: 75.7873,
    riskScore: 62,
    riskLevel: "moderate",
    mentions: 478,
    diseases: [
      { name: "Dengue", cases: 134, trend: "up" },
      { name: "Malaria", cases: 67, trend: "stable" },
    ],
    symptoms: ["Fever", "Chills", "Headache", "Rash"],
    news: [
      { title: "Rajasthan health dept issues dengue advisory", source: "Rajasthan Patrika", time: "9h ago" },
    ],
    prediction7d: [134, 145, 158, 165, 172, 180, 188],
    population: "4M",
  },
  {
    name: "Lucknow",
    state: "Uttar Pradesh",
    lat: 26.8467,
    lng: 80.9462,
    riskScore: 63,
    riskLevel: "moderate",
    mentions: 478,
    diseases: [
      { name: "Dengue", cases: 112, trend: "up" },
      { name: "TB", cases: 78, trend: "stable" },
    ],
    symptoms: ["Fever", "Joint Pain", "Cough"],
    news: [
      { title: "UP reports rising dengue cases in eastern districts", source: "Amar Ujala", time: "5h ago" },
    ],
    prediction7d: [112, 120, 130, 138, 145, 150, 158],
    population: "3.5M",
  },
  {
    name: "Patna",
    state: "Bihar",
    lat: 25.6093,
    lng: 85.1376,
    riskScore: 45,
    riskLevel: "moderate",
    mentions: 334,
    diseases: [
      { name: "Flu", cases: 89, trend: "stable" },
      { name: "Dengue", cases: 45, trend: "up" },
    ],
    symptoms: ["Fever", "Headache", "Fatigue"],
    news: [],
    prediction7d: [89, 92, 95, 98, 100, 103, 105],
    population: "2.5M",
  },
  {
    name: "Guwahati",
    state: "Assam",
    lat: 26.1445,
    lng: 91.7362,
    riskScore: 52,
    riskLevel: "moderate",
    mentions: 298,
    diseases: [
      { name: "Malaria", cases: 98, trend: "up" },
      { name: "Dengue", cases: 56, trend: "stable" },
    ],
    symptoms: ["Fever", "Chills", "Sweating"],
    news: [],
    prediction7d: [98, 105, 112, 118, 122, 128, 135],
    population: "1.1M",
  },
];

export const allDiseases = ["Dengue", "Flu", "TB", "COVID-like", "Malaria"];

export const trendData = [
  { month: "Aug", dengue: 120, flu: 89, tb: 45, covid: 34, malaria: 56 },
  { month: "Sep", dengue: 180, flu: 95, tb: 42, covid: 28, malaria: 62 },
  { month: "Oct", dengue: 250, flu: 120, tb: 48, covid: 22, malaria: 78 },
  { month: "Nov", dengue: 320, flu: 145, tb: 50, covid: 18, malaria: 85 },
  { month: "Dec", dengue: 280, flu: 198, tb: 52, covid: 25, malaria: 72 },
  { month: "Jan", dengue: 220, flu: 230, tb: 55, covid: 30, malaria: 60 },
  { month: "Feb", dengue: 180, flu: 210, tb: 48, covid: 35, malaria: 52 },
  { month: "Mar", dengue: 342, flu: 189, tb: 56, covid: 42, malaria: 68 },
];

export const alerts = [
  { id: 1, severity: "high" as const, title: "Dengue Cluster Detected", location: "Rohini, Delhi", region: "North Delhi", confidence: 82, time: "47 min ago", description: "20+ social media mentions of dengue symptoms in concentrated area. NLP analysis confirms disease pattern.", dismissed: false, signalSource: { news: 38, social: 62 }, recommendations: ["Deploy rapid screening teams in North Delhi", "Increase vector control spraying within 48 hours", "Issue public health advisory for the cluster zone"] },
  { id: 2, severity: "high" as const, title: "Flu Spike Alert", location: "Anand Vihar, Delhi", region: "East Delhi", confidence: 76, time: "34 min ago", description: "Post-monsoon flu cases exceeding 3-year average by 45%. Geo-clustering indicates hotspot formation.", dismissed: false, signalSource: { news: 45, social: 55 }, recommendations: ["Distribute flu vaccination kits", "Set up temporary health camps"] },
  { id: 3, severity: "high" as const, title: "TB Dropout Risk", location: "Dharavi, Mumbai", region: "Mumbai Central", confidence: 71, time: "19 min ago", description: "AI model predicts 23 patients at high dropout risk based on visit patterns and medication gaps.", dismissed: false, signalSource: { news: 30, social: 70 }, recommendations: ["Assign community health workers for follow-up", "Initiate phone-based medication reminders"] },
  { id: 4, severity: "moderate" as const, title: "Dengue Cluster Detected", location: "Howrah, Kolkata", region: "South Kolkata", confidence: 68, time: "1 hr ago", description: "Unusual spike in dengue mentions near Howrah bridge area. 15 social media posts in 12 hours.", dismissed: false, signalSource: { news: 42, social: 58 }, recommendations: ["Conduct door-to-door surveillance", "Deploy fogging teams"] },
  { id: 5, severity: "moderate" as const, title: "Flu Spike Alert", location: "Lucknow Central", region: "Uttar Pradesh", confidence: 64, time: "2 hr ago", description: "Flu mentions up 200% in local news. Hospital OPD data correlates with online signals.", dismissed: false, signalSource: { news: 55, social: 45 }, recommendations: ["Alert district health officials", "Prepare OPD surge capacity"] },
  { id: 6, severity: "moderate" as const, title: "TB Cluster Detected", location: "Pune East", region: "Pune District", confidence: 61, time: "3 hr ago", description: "Unusual TB mention cluster. 23 social media posts in 24 hours mentioning persistent cough and weight loss.", dismissed: false, signalSource: { news: 35, social: 65 }, recommendations: ["Activate TB screening camps", "Coordinate with RNTCP"] },
  { id: 7, severity: "moderate" as const, title: "Malaria Spike Alert", location: "Jaipur Old City", region: "Rajasthan", confidence: 58, time: "5 hr ago", description: "Post-monsoon malaria cases rising. Stagnant water reports from 8 localities.", dismissed: false, signalSource: { news: 50, social: 50 }, recommendations: ["Distribute mosquito nets", "Initiate anti-larval spraying"] },
  { id: 8, severity: "moderate" as const, title: "Dengue Cluster Detected", location: "Chennai Marina", region: "South Chennai", confidence: 55, time: "6 hr ago", description: "Consistent dengue mentions near coastal areas. Below outbreak threshold but monitoring recommended.", dismissed: false, signalSource: { news: 60, social: 40 }, recommendations: ["Increase surveillance frequency", "Check water stagnation in construction sites"] },
];

export const aiInsights = [
  { id: 1, type: "trend" as const, title: "Dengue-Weather Correlation", description: "Rising humidity (78%) and stagnant water reports in Delhi correlate with 40% increase in dengue mentions. Historical pattern suggests peak in 2-3 weeks.", confidence: 85 },
  { id: 2, type: "anomaly" as const, title: "Unusual Malaria Pattern", description: "Mumbai's malaria cases are 45% above seasonal average. DBSCAN clustering reveals 3 new micro-hotspots in western suburbs not seen in previous years.", confidence: 78 },
  { id: 3, type: "prediction" as const, title: "Flu Season Forecast", description: "LSTM model predicts flu cases will peak in 10-14 days across North India. Early intervention recommended for Delhi, Lucknow, and Jaipur districts.", confidence: 82 },
  { id: 4, type: "seasonal" as const, title: "Post-Monsoon Disease Shift", description: "NLP analysis of 5,000+ news articles shows disease burden shifting from waterborne to respiratory infections as monsoon recedes. Typical seasonal transition.", confidence: 90 },
];

export const newsItems = [
  { id: 1, title: "Delhi reports 342 dengue cases this week, highest in 3 years", source: "Times of India", time: "1h ago", disease: "Dengue", severity: "high" as const },
  { id: 2, title: "Mumbai BMC deploys 500 additional health workers for malaria control", source: "Indian Express", time: "2h ago", disease: "Malaria", severity: "moderate" as const },
  { id: 3, title: "ICMR launches new rapid testing kits for dengue detection", source: "The Hindu", time: "3h ago", disease: "Dengue", severity: "low" as const },
  { id: 4, title: "Kolkata hospitals see 30% rise in flu cases amid weather change", source: "Telegraph", time: "4h ago", disease: "Flu", severity: "moderate" as const },
  { id: 5, title: "WHO warns of potential dengue spread in South-East Asia region", source: "NDTV", time: "5h ago", disease: "Dengue", severity: "high" as const },
  { id: 6, title: "Rajasthan health ministry issues advisory on vector-borne diseases", source: "Rajasthan Patrika", time: "6h ago", disease: "Dengue", severity: "moderate" as const },
  { id: 7, title: "AI system helps predict TB treatment dropout in rural UP", source: "Scroll", time: "8h ago", disease: "TB", severity: "low" as const },
];

export const topRiskRegions = [
  { rank: 1, location: "Rohini, Delhi", disease: "Dengue", mentions: 249 },
  { rank: 2, location: "Anand Vihar", disease: "Flu", mentions: 195 },
  { rank: 3, location: "Dharavi, Mumbai", disease: "TB", mentions: 178 },
  { rank: 4, location: "Howrah, Kolkata", disease: "Dengue", mentions: 156 },
  { rank: 5, location: "Whitefield, Bangalore", disease: "Flu", mentions: 134 },
  { rank: 6, location: "Triplicane, Chennai", disease: "Dengue", mentions: 112 },
];

export const correlationFactors = [
  { factor: "Social Media Volume", correlation: "+0.72", strength: "Strong", description: "Higher social mentions strongly correlate with confirmed cases." },
  { factor: "Temperature", correlation: "+0.45", strength: "Moderate", description: "Warmer temperatures linked to dengue vector activity." },
  { factor: "Rainfall", correlation: "+0.38", strength: "Moderate", description: "Post-monsoon rainfall increases mosquito breeding sites." },
];

export const riskPredictions = [
  { timeFrame: "+24h", riskLevel: "High Risk", predictedCases: 186, range: "158-214" },
  { timeFrame: "+48h", riskLevel: "High Risk", predictedCases: 210, range: "180-240" },
  { timeFrame: "+72h", riskLevel: "Moderate", predictedCases: 195, range: "165-225" },
];
