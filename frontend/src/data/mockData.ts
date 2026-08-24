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
    // Dengue response activity is expected to curb the cluster after a mid-week peak.
    prediction7d: [342, 359, 386, 415, 432, 404, 366],
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
      { title: "Mumbai BMC deploys 500 health workers for malaria control", source: "Indian Express", time: "2h ago" },
    ],
    // Malaria signals peak mid-week, then decline after targeted control measures.
    prediction7d: [198, 209, 229, 251, 266, 239, 207],
    population: "21M",
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
      { name: "Flu", cases: 156, trend: "up" },
      { name: "Dengue", cases: 112, trend: "up" },
      { name: "TB", cases: 45, trend: "stable" },
    ],
    symptoms: ["Fever", "Joint Pain", "Cough"],
    news: [
      { title: "UP reports rising dengue cases in eastern districts", source: "Amar Ujala", time: "5h ago" },
    ],
    prediction7d: [112, 119, 126, 132, 137, 142, 146],
    population: "3.5M",
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
      { name: "Malaria", cases: 134, trend: "up" },
      { name: "Dengue", cases: 67, trend: "stable" },
    ],
    symptoms: ["Fever", "Chills", "Headache", "Rash"],
    news: [
      { title: "Rajasthan govt allocates ₹200 crore for monsoon disease prevention", source: "Rajasthan Patrika", time: "6h ago" },
    ],
    prediction7d: [134, 141, 148, 154, 159, 164, 168],
    population: "4M",
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
      { title: "Kolkata hospitals see 30% rise in flu cases amid weather change", source: "Telegraph", time: "4h ago" },
    ],
    prediction7d: [156, 170, 182, 190, 195, 200, 208],
    population: "15M",
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
  {
    name: "Hyderabad",
    state: "Telangana",
    lat: 17.385,
    lng: 78.4867,
    riskScore: 48,
    riskLevel: "moderate",
    mentions: 445,
    diseases: [
      { name: "Dengue", cases: 78, trend: "stable" },
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
    name: "Ranchi",
    state: "Jharkhand",
    lat: 23.3441,
    lng: 85.3096,
    riskScore: 47,
    riskLevel: "moderate",
    mentions: 312,
    diseases: [
      { name: "Malaria", cases: 71, trend: "up" },
      { name: "Dengue", cases: 34, trend: "stable" },
    ],
    symptoms: ["Fever", "Chills", "Headache"],
    news: [],
    prediction7d: [71, 78, 85, 90, 95, 100, 106],
    population: "1.5M",
  },
  {
    name: "Bangalore",
    state: "Karnataka",
    lat: 12.9716,
    lng: 77.5946,
    riskScore: 45,
    riskLevel: "moderate",
    mentions: 312,
    diseases: [
      { name: "Flu", cases: 134, trend: "stable" },
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
    name: "Chennai",
    state: "Tamil Nadu",
    lat: 13.0827,
    lng: 80.2707,
    riskScore: 45,
    riskLevel: "moderate",
    mentions: 523,
    diseases: [
      { name: "Dengue", cases: 112, trend: "stable" },
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
    name: "Patna",
    state: "Bihar",
    lat: 25.6093,
    lng: 85.1376,
    riskScore: 45,
    riskLevel: "moderate",
    mentions: 334,
    diseases: [
      { name: "Dengue", cases: 67, trend: "up" },
      { name: "Flu", cases: 45, trend: "stable" },
    ],
    symptoms: ["Fever", "Headache", "Fatigue"],
    news: [],
    prediction7d: [89, 92, 95, 98, 100, 103, 105],
    population: "2.5M",
  },
  {
    name: "Visakhapatnam",
    state: "Andhra Pradesh",
    lat: 17.6868,
    lng: 83.2185,
    riskScore: 44,
    riskLevel: "moderate",
    mentions: 267,
    diseases: [
      { name: "Dengue", cases: 63, trend: "up" },
      { name: "Flu", cases: 34, trend: "stable" },
    ],
    symptoms: ["Fever", "Headache", "Joint Pain"],
    news: [],
    prediction7d: [63, 68, 72, 76, 80, 84, 88],
    population: "2.1M",
  },
  {
    name: "Pune",
    state: "Maharashtra",
    lat: 18.5204,
    lng: 73.8567,
    riskScore: 44,
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
    name: "Nagpur",
    state: "Maharashtra",
    lat: 21.1458,
    lng: 79.0882,
    riskScore: 41,
    riskLevel: "low",
    mentions: 234,
    diseases: [
      { name: "Dengue", cases: 41, trend: "stable" },
      { name: "Flu", cases: 28, trend: "down" },
    ],
    symptoms: ["Fever", "Body Ache"],
    news: [],
    prediction7d: [41, 39, 37, 36, 35, 34, 33],
    population: "2.9M",
  },
  {
    name: "Ahmedabad",
    state: "Gujarat",
    lat: 23.0225,
    lng: 72.5714,
    riskScore: 40,
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
    name: "Surat",
    state: "Gujarat",
    lat: 21.1702,
    lng: 72.8311,
    riskScore: 36,
    riskLevel: "low",
    mentions: 198,
    diseases: [
      { name: "Dengue", cases: 36, trend: "down" },
      { name: "Flu", cases: 22, trend: "stable" },
    ],
    symptoms: ["Fever", "Headache"],
    news: [],
    prediction7d: [36, 34, 32, 31, 30, 29, 28],
    population: "7.8M",
  },
  {
    name: "Bhopal",
    state: "Madhya Pradesh",
    lat: 23.2599,
    lng: 77.4126,
    riskScore: 35,
    riskLevel: "low",
    mentions: 178,
    diseases: [
      { name: "Malaria", cases: 35, trend: "stable" },
      { name: "Flu", cases: 20, trend: "down" },
    ],
    symptoms: ["Fever", "Chills"],
    news: [],
    prediction7d: [35, 33, 32, 31, 30, 29, 28],
    population: "2.4M",
  },
  {
    name: "Kochi",
    state: "Kerala",
    lat: 9.9312,
    lng: 76.2673,
    riskScore: 34,
    riskLevel: "low",
    mentions: 156,
    diseases: [
      { name: "Dengue", cases: 34, trend: "stable" },
      { name: "Flu", cases: 18, trend: "down" },
    ],
    symptoms: ["Fever", "Body Pain"],
    news: [],
    prediction7d: [34, 32, 31, 30, 29, 28, 27],
    population: "2.1M",
  },
  {
    name: "Indore",
    state: "Madhya Pradesh",
    lat: 22.7196,
    lng: 75.8577,
    riskScore: 33,
    riskLevel: "low",
    mentions: 145,
    diseases: [
      { name: "Flu", cases: 33, trend: "down" },
      { name: "Dengue", cases: 15, trend: "stable" },
    ],
    symptoms: ["Cough", "Fever"],
    news: [],
    prediction7d: [33, 31, 30, 29, 28, 27, 26],
    population: "3.6M",
  },
  {
    name: "Chandigarh",
    state: "Chandigarh",
    lat: 30.7333,
    lng: 76.7794,
    riskScore: 32,
    riskLevel: "low",
    mentions: 134,
    diseases: [
      { name: "Flu", cases: 32, trend: "down" },
      { name: "Dengue", cases: 12, trend: "stable" },
    ],
    symptoms: ["Cough", "Cold"],
    news: [],
    prediction7d: [32, 30, 29, 28, 27, 26, 25],
    population: "1.2M",
  },
];

export const allDiseases = ["Dengue", "Flu", "TB", "COVID-like", "Malaria"];

export const trendData = [
  { month: "6 days ago", dengue: 262, flu: 174, tb: 50, covid: 36, malaria: 64 },
  { month: "5 days ago", dengue: 275, flu: 178, tb: 51, covid: 34, malaria: 68 },
  { month: "4 days ago", dengue: 292, flu: 185, tb: 51, covid: 35, malaria: 72 },
  { month: "3 days ago", dengue: 310, flu: 194, tb: 52, covid: 38, malaria: 75 },
  { month: "2 days ago", dengue: 306, flu: 201, tb: 53, covid: 40, malaria: 71 },
  { month: "Yesterday", dengue: 288, flu: 197, tb: 53, covid: 39, malaria: 67 },
  { month: "Today", dengue: 272, flu: 188, tb: 54, covid: 41, malaria: 63 },
];

export const alerts = [
  { id: 1, severity: "high" as const, title: "Dengue Cluster Detected", location: "Rohini, Delhi", region: "North Delhi", confidence: 82, time: "47 min ago", description: "20+ social media mentions of dengue symptoms in concentrated area. NLP analysis confirms disease pattern.", dismissed: false, signalSource: { news: 38, social: 62 }, recommendations: ["Deploy rapid screening teams in North Delhi", "Increase vector control spraying within 48 hours", "Issue public health advisory for the cluster zone"] },
  { id: 2, severity: "high" as const, title: "Flu Spike Alert", location: "Anand Vihar, Delhi", region: "East Delhi", confidence: 76, time: "34 min ago", description: "Post-monsoon flu cases exceeding 3-year average by 45%. Geo-clustering indicates hotspot formation.", dismissed: false, signalSource: { news: 45, social: 55 }, recommendations: ["Distribute flu vaccination kits", "Set up temporary health camps"] },
  { id: 3, severity: "high" as const, title: "TB Dropout Risk", location: "Dharavi, Mumbai", region: "Mumbai Central", confidence: 71, time: "19 min ago", description: "AI model predicts 23 patients at high dropout risk based on visit patterns and medication gaps.", dismissed: false, signalSource: { news: 30, social: 70 }, recommendations: ["Assign community health workers for follow-up", "Initiate phone-based medication reminders"] },
  { id: 4, severity: "moderate" as const, title: "Dengue Cluster Detected", location: "Howrah, Kolkata", region: "South Kolkata", confidence: 68, time: "1 hr ago", description: "Unusual spike in dengue mentions near Howrah bridge area. 15 social media posts in 12 hours.", dismissed: false, signalSource: { news: 42, social: 58 }, recommendations: ["Conduct door-to-door surveillance", "Deploy fogging teams"] },
  { id: 5, severity: "moderate" as const, title: "Flu Spike Alert", location: "Lucknow Central", region: "Uttar Pradesh", confidence: 64, time: "2 hr ago", description: "Flu mentions up 200% in local news. Hospital OPD data correlates with online signals.", dismissed: false, signalSource: { news: 55, social: 45 }, recommendations: ["Alert district health officials", "Prepare OPD surge capacity"] },
  { id: 6, severity: "moderate" as const, title: "TB Cluster Detected", location: "Pune East", region: "Pune District", confidence: 61, time: "3 hr ago", description: "Unusual TB mention cluster. 23 social media posts in 24 hours mentioning persistent cough and weight loss.", dismissed: false, signalSource: { news: 35, social: 65 }, recommendations: ["Activate TB screening camps", "Coordinate with RNTCP"] },
  { id: 7, severity: "moderate" as const, title: "Malaria Spike Alert", location: "Jaipur Old City", region: "Rajasthan", confidence: 58, time: "5 hr ago", description: "Post-monsoon malaria cases rising. Stagnant water reports from 8 localities.", dismissed: false, signalSource: { news: 50, social: 50 }, recommendations: ["Distribute mosquito nets", "Initiate anti-larval spraying"] },
  { id: 8, severity: "low" as const, title: "Dengue Cluster Detected", location: "Chennai Marina", region: "South Chennai", confidence: 55, time: "6 hr ago", description: "Consistent dengue mentions near coastal areas. Below outbreak threshold but monitoring recommended.", dismissed: false, signalSource: { news: 60, social: 40 }, recommendations: ["Increase surveillance frequency", "Check water stagnation in construction sites"] },
];

export const aiInsights = [
  { id: 1, type: "seasonal" as const, title: "Post-Monsoon Disease Shift", description: "NLP analysis of 5,000+ news articles shows disease burden shifting from waterborne to respiratory infections as monsoon recedes. Typical seasonal transition.", confidence: 90 },
  { id: 2, type: "trend" as const, title: "Dengue-Weather Correlation", description: "Rising humidity (78%) and stagnant water reports in Delhi correlate with 40% increase in dengue mentions. Historical pattern suggests peak in 2-3 weeks.", confidence: 85 },
  { id: 3, type: "prediction" as const, title: "Flu Season Forecast", description: "LSTM model predicts flu cases will peak in 10-14 days across North India. Early intervention recommended for Delhi, Lucknow, and Jaipur districts.", confidence: 82 },
  { id: 4, type: "anomaly" as const, title: "Unusual Malaria Pattern", description: "Mumbai's malaria cases are 45% above seasonal average. DBSCAN clustering reveals 3 new micro-hotspots in western suburbs not seen in previous years.", confidence: 78 },
];

export const newsItems = [
  { id: 1, title: "Delhi reports 342 dengue cases this week, highest in 3 years", source: "Times of India", time: "1h ago", disease: "Dengue", severity: "high" as const },
  { id: 2, title: "ICMR launches new rapid testing kits for dengue detection", source: "The Hindu", time: "3h ago", disease: "Dengue", severity: "low" as const },
  { id: 3, title: "Kolkata hospitals see 30% rise in flu cases amid weather change", source: "Telegraph", time: "4h ago", disease: "Flu", severity: "moderate" as const },
  { id: 4, title: "WHO warns of increased TB risk in urban slum areas across India", source: "NDTV", time: "5h ago", disease: "TB", severity: "high" as const },
  { id: 5, title: "Rajasthan govt allocates ₹200 crore for monsoon disease prevention", source: "Rajasthan Patrika", time: "6h ago", disease: "Dengue", severity: "moderate" as const },
  { id: 6, title: "Mumbai BMC deploys 500 health workers for malaria control", source: "Indian Express", time: "2h ago", disease: "Malaria", severity: "moderate" as const },
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
  { factor: "Social Media Volume", correlation: "+0.72", strength: "Strong" as const, description: "Higher social mentions strongly correlate with confirmed cases." },
  { factor: "Temperature", correlation: "+0.45", strength: "Moderate" as const, description: "Warmer temperatures linked to dengue vector activity." },
  { factor: "Rainfall", correlation: "+0.38", strength: "Moderate" as const, description: "Post-monsoon rainfall increases mosquito breeding sites." },
  { factor: "Population Density", correlation: "+0.61", strength: "Strong" as const, description: "Denser areas show faster disease propagation rates." },
];

export const riskPredictions = [
  { timeFrame: "+24h", riskLevel: "High Risk", predictedCases: 186, range: "158-214" },
  { timeFrame: "+48h", riskLevel: "High Risk", predictedCases: 210, range: "180-240" },
  { timeFrame: "+72h", riskLevel: "Moderate", predictedCases: 195, range: "165-225" },
];

// Field reports mock data
export const fieldReports = [
  { id: "FR001", reporter: "Rajesh Kumar", city: "Delhi", disease: "Dengue", cases: 14, severity: "high" as const, time: "2h ago", notes: "14 field reports in 6hrs", symptoms: ["Fever", "Joint Pain", "Rash"] },
  { id: "FR002", reporter: "Kavita Meena", city: "Jaipur", disease: "Dengue", cases: 11, severity: "high" as const, time: "4h ago", notes: "Breeding sites near Hawa Mahal area", symptoms: ["Fever", "Headache", "Fatigue"] },
  { id: "FR003", reporter: "Amit Singh", city: "Mumbai", disease: "Malaria", cases: 8, severity: "moderate" as const, time: "5h ago", notes: "Breeding sites near Dharavi", symptoms: ["Fever", "Chills", "Sweating"] },
  { id: "FR004", reporter: "Sunita Das", city: "Lucknow", disease: "Flu", cases: 22, severity: "moderate" as const, time: "6h ago", notes: "OPD overflow at district hospital", symptoms: ["Cough", "Fever", "Body Ache"] },
  { id: "FR005", reporter: "Priya Nair", city: "Kolkata", disease: "TB", cases: 5, severity: "low" as const, time: "8h ago", notes: "Follow-up on treatment dropouts", symptoms: ["Cough", "Weight Loss", "Fatigue"] },
];

// Anomaly data
export const anomalyData = [
  { location: "Mumbai", severity: "L3 - CRITICAL", disease: "Malaria", baseline: 82, current: 145, deviation: "+77%", escalation: "District Officer → State Health Dept → Central IDSP" },
  { location: "Ranchi", severity: "L2 - WARNING", disease: "Malaria", baseline: 51, current: 71, deviation: "+38%", escalation: "District Officer → State Health Dept" },
  { location: "Delhi", severity: "L2 - WARNING", disease: "Dengue", baseline: 265, current: 342, deviation: "+29%", escalation: "District Officer → State Health Dept" },
  { location: "Guwahati", severity: "L1 - WATCH", disease: "Malaria", baseline: 79, current: 98, deviation: "+24%", escalation: "District Officer" },
];

// Audit log data
export const auditLog = [
  { id: "AUD001", type: "ALERT" as const, event: "Dengue cluster alert triggered for Rohini, Delhi", user: "System", time: "47 min ago" },
  { id: "AUD002", type: "REPORT" as const, event: "Field report submitted by Rajesh Kumar — Delhi, 14 cases", user: "Rajesh Kumar", time: "2h ago" },
  { id: "AUD003", type: "SYSTEM" as const, event: "Anomaly detection model retrained with latest data", user: "System", time: "3h ago" },
  { id: "AUD004", type: "DATA" as const, event: "Trend data updated for 20 cities", user: "System", time: "4h ago" },
  { id: "AUD005", type: "ALERT" as const, event: "TB dropout risk alert for Dharavi, Mumbai", user: "System", time: "5h ago" },
  { id: "AUD006", type: "REPORT" as const, event: "Field report submitted by Kavita Meena — Jaipur", user: "Kavita Meena", time: "6h ago" },
  { id: "AUD007", type: "SYSTEM" as const, event: "Daily risk score recalculation completed", user: "System", time: "8h ago" },
  { id: "AUD008", type: "DATA" as const, event: "News feed ingestion — 342 articles processed", user: "System", time: "10h ago" },
];
