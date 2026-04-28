// Shared mock data sourced from COOU (Chukwuemeka Odumegwu Ojukwu University, Anambra State)
export const COOU_FACULTIES = [
  "Agriculture",
  "Arts",
  "Basic Medical Sciences",
  "Clinical Medicine",
  "Education",
  "Engineering",
  "Environmental Sciences",
  "Law",
  "Management Sciences",
  "Natural Sciences",
  "Pharmaceutical Sciences",
  "Social Sciences",
];

export const COOU_DEPARTMENTS = [
  "Computer Science",
  "Mass Communication",
  "Business Administration",
  "Accountancy",
  "Economics",
  "Political Science",
  "Law",
  "Medicine & Surgery",
  "Pharmacy",
  "Civil Engineering",
  "Electrical Engineering",
  "Architecture",
  "Microbiology",
  "Biochemistry",
  "English Language",
];

export const LOCATIONS = [
  "Lagos, NG", "Abuja, NG", "Awka, NG", "Onitsha, NG", "Port Harcourt, NG",
  "London, UK", "Manchester, UK", "Toronto, CA", "New York, US", "Houston, US",
  "Berlin, DE", "Dubai, AE", "Johannesburg, ZA", "Accra, GH",
];

export const GRAD_YEARS = Array.from({ length: 20 }, (_, i) => 2024 - i);

export type Alumni = {
  id: string;
  name: string;
  initials: string;
  year: number;
  faculty: string;
  department: string;
  location: string;
  role: string;
  company: string;
  industry: string;
  skills: string[];
  bio: string;
  tone: string;
};

const tones = [
  "from-emerald-700 to-emerald-900",
  "from-amber-600 to-amber-800",
  "from-emerald-600 to-teal-800",
  "from-yellow-600 to-amber-900",
  "from-teal-700 to-emerald-900",
  "from-amber-700 to-yellow-900",
];

export const ALUMNI: Alumni[] = [
  { id: "a1", name: "Chinaza Obi", initials: "CO", year: 2018, faculty: "Engineering", department: "Computer Science", location: "Lagos, NG", role: "Senior Software Engineer", company: "Flutterwave", industry: "Fintech", skills: ["React", "Node.js", "AWS"], bio: "Building payment rails across Africa.", tone: tones[0] },
  { id: "a2", name: "Ifeoma Eze", initials: "IE", year: 2015, faculty: "Management Sciences", department: "Business Administration", location: "London, UK", role: "Product Manager", company: "Stripe", industry: "Fintech", skills: ["Strategy", "Analytics", "Leadership"], bio: "PM passionate about emerging market commerce.", tone: tones[1] },
  { id: "a3", name: "Emeka Nwosu", initials: "EN", year: 2012, faculty: "Clinical Medicine", department: "Medicine & Surgery", location: "Awka, NG", role: "Consultant Physician", company: "COOU Teaching Hospital", industry: "Healthcare", skills: ["Cardiology", "Research"], bio: "Cardiologist and clinical educator.", tone: tones[2] },
  { id: "a4", name: "Adaeze Okafor", initials: "AO", year: 2020, faculty: "Arts", department: "Mass Communication", location: "Abuja, NG", role: "Brand Strategist", company: "MTN Nigeria", industry: "Telecom", skills: ["Brand", "Content", "PR"], bio: "Storyteller for African brands.", tone: tones[3] },
  { id: "a5", name: "Tobenna Umeh", initials: "TU", year: 2017, faculty: "Engineering", department: "Electrical Engineering", location: "Houston, US", role: "Power Systems Engineer", company: "Schlumberger", industry: "Energy", skills: ["Power", "MATLAB", "Project Mgmt"], bio: "Energy infrastructure for emerging grids.", tone: tones[4] },
  { id: "a6", name: "Ngozi Ibe", initials: "NI", year: 2014, faculty: "Law", department: "Law", location: "Onitsha, NG", role: "Corporate Counsel", company: "Aluko & Oyebode", industry: "Legal", skills: ["M&A", "Compliance"], bio: "Corporate law and policy.", tone: tones[5] },
  { id: "a7", name: "Kelechi Anya", initials: "KA", year: 2019, faculty: "Pharmaceutical Sciences", department: "Pharmacy", location: "Toronto, CA", role: "Clinical Pharmacist", company: "Shoppers Drug Mart", industry: "Healthcare", skills: ["Pharmacology", "Patient Care"], bio: "Patient-first community pharmacy.", tone: tones[0] },
  { id: "a8", name: "Obinna Mbah", initials: "OM", year: 2016, faculty: "Social Sciences", department: "Economics", location: "New York, US", role: "Quant Analyst", company: "Morgan Stanley", industry: "Finance", skills: ["Python", "Quant", "ML"], bio: "Markets & machine learning.", tone: tones[1] },
  { id: "a9", name: "Uchechi Okeke", initials: "UO", year: 2021, faculty: "Natural Sciences", department: "Microbiology", location: "Berlin, DE", role: "Research Scientist", company: "BioNTech", industry: "Biotech", skills: ["Genomics", "Lab"], bio: "mRNA vaccine research.", tone: tones[2] },
  { id: "a10", name: "Ebuka Eze", initials: "EE", year: 2013, faculty: "Environmental Sciences", department: "Architecture", location: "Dubai, AE", role: "Senior Architect", company: "Foster + Partners", industry: "Architecture", skills: ["Revit", "Sustainable Design"], bio: "Sustainable urbanism in the Gulf.", tone: tones[3] },
  { id: "a11", name: "Chiamaka Nnamdi", initials: "CN", year: 2022, faculty: "Social Sciences", department: "Political Science", location: "Accra, GH", role: "Policy Analyst", company: "African Union", industry: "Public Sector", skills: ["Policy", "Research"], bio: "Continental policy & governance.", tone: tones[4] },
  { id: "a12", name: "Somto Eze", initials: "SE", year: 2010, faculty: "Engineering", department: "Civil Engineering", location: "Port Harcourt, NG", role: "Project Director", company: "Julius Berger", industry: "Construction", skills: ["Infrastructure", "PMP"], bio: "Infrastructure that lasts generations.", tone: tones[5] },
];

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Full-time" | "Part-time" | "Internship" | "Contract";
  category: string;
  remote: boolean;
  salary: string;
  posted: string;
  description: string;
  requirements: string[];
  postedBy: string;
  referralAvailable: boolean;
  featured?: boolean;
};

export const JOB_CATEGORIES = ["Engineering", "Product", "Design", "Data", "Marketing", "Healthcare", "Finance", "Legal", "Operations"];

export const JOBS: Job[] = [
  { id: "j1", title: "Frontend Engineer (React)", company: "Flutterwave", location: "Lagos, NG", type: "Full-time", category: "Engineering", remote: true, salary: "₦8M – ₦12M", posted: "2 days ago", description: "Build delightful payment experiences for millions of African users. Work across our merchant dashboard and checkout flows.", requirements: ["3+ yrs React", "TypeScript", "REST/GraphQL"], postedBy: "Chinaza Obi · '18", referralAvailable: true, featured: true },
  { id: "j2", title: "Product Manager — Payments", company: "Stripe", location: "London, UK · Remote", type: "Full-time", category: "Product", remote: true, salary: "£90k – £130k", posted: "5 days ago", description: "Lead product strategy for cross-border payments serving emerging markets.", requirements: ["5+ yrs PM", "Fintech exp", "SQL"], postedBy: "Ifeoma Eze · '15", referralAvailable: true },
  { id: "j3", title: "Software Engineering Intern", company: "MTN Nigeria", location: "Abuja, NG", type: "Internship", category: "Engineering", remote: false, salary: "₦250k/mo", posted: "1 day ago", description: "12-week internship building internal developer tools. Open to current COOU students.", requirements: ["Final-year student", "Python or JS", "Eager to learn"], postedBy: "Adaeze Okafor · '20", referralAvailable: true, featured: true },
  { id: "j4", title: "Clinical Pharmacist", company: "COOU Teaching Hospital", location: "Awka, NG", type: "Full-time", category: "Healthcare", remote: false, salary: "Competitive", posted: "1 week ago", description: "Join our pharmacy team supporting patient care across inpatient and outpatient services.", requirements: ["B.Pharm", "PCN registered"], postedBy: "Emeka Nwosu · '12", referralAvailable: false },
  { id: "j5", title: "Quantitative Analyst", company: "Morgan Stanley", location: "New York, US", type: "Full-time", category: "Finance", remote: false, salary: "$140k – $180k", posted: "3 days ago", description: "Develop pricing models and trading strategies for the equities desk.", requirements: ["MSc Quant/Math", "Python, C++", "Stochastic calc"], postedBy: "Obinna Mbah · '16", referralAvailable: true },
  { id: "j6", title: "Brand Designer", company: "Paystack", location: "Remote", type: "Contract", category: "Design", remote: true, salary: "$50–$80/hr", posted: "4 days ago", description: "6-month engagement refreshing brand assets and marketing systems.", requirements: ["Figma", "Brand systems portfolio"], postedBy: "Adaeze Okafor · '20", referralAvailable: false },
  { id: "j7", title: "Civil Engineer (Bridges)", company: "Julius Berger", location: "Port Harcourt, NG", type: "Full-time", category: "Engineering", remote: false, salary: "₦15M – ₦20M", posted: "6 days ago", description: "Lead structural design for major bridge infrastructure projects.", requirements: ["7+ yrs", "COREN registered"], postedBy: "Somto Eze · '10", referralAvailable: true },
  { id: "j8", title: "Data Scientist", company: "Andela", location: "Lagos, NG · Remote", type: "Full-time", category: "Data", remote: true, salary: "₦12M – ₦18M", posted: "Just now", description: "Build ML models for talent matching across our global engineering marketplace.", requirements: ["3+ yrs ML", "Python", "NLP"], postedBy: "AluminAI Bot", referralAvailable: false, featured: true },
  { id: "j9", title: "Junior Lawyer (Corporate)", company: "Aluko & Oyebode", location: "Lagos, NG", type: "Full-time", category: "Legal", remote: false, salary: "₦6M – ₦9M", posted: "2 weeks ago", description: "Support M&A and capital markets transactions for tier-1 clients.", requirements: ["LL.B, BL", "0–2 yrs PQE"], postedBy: "Ngozi Ibe · '14", referralAvailable: true },
];
