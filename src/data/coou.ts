// Official COOU faculties and departments
// Source: coou.edu.ng — Chukwuemeka Odumegwu Ojukwu University

export const COOU_FACULTIES = [
  "Agriculture",
  "Arts",
  "Basic Clinical Sciences",
  "Basic Medical Sciences",
  "Clinical Medicine",
  "Education",
  "Engineering",
  "Environmental Sciences",
  "Health Science & Technology",
  "Law",
  "Management Sciences",
  "Natural Sciences",
  "Pharmaceutical Sciences",
  "Physical Sciences",
  "Social Sciences",
];

// All departments grouped by faculty
export const COOU_DEPARTMENTS_BY_FACULTY: Record<string, string[]> = {
  "Agriculture": [
    "Agricultural Economics & Extension",
    "Animal Science",
    "Crop Science & Horticulture",
    "Fishery & Aquaculture",
    "Food Science & Technology",
    "Soil Science",
  ],
  "Arts": [
    "English Language & Literature",
    "History & International Studies",
    "Linguistics / Igbo Language",
    "Music",
    "Philosophy",
    "Religion & Human Relations",
    "Theatre Arts",
  ],
  "Basic Clinical Sciences": [
    "Chemical Pathology",
    "Hematology & Immunology",
    "Histopathology & Morbid Anatomy",
  ],
  "Basic Medical Sciences": [
    "Anatomy",
    "Biochemistry",
    "Physiology",
  ],
  "Clinical Medicine": [
    "Community Medicine",
    "Internal Medicine",
    "Medical Microbiology & Parasitology",
    "Obstetrics & Gynecology",
    "Ophthalmology",
    "Pediatrics",
    "Pharmacology & Therapeutics",
    "Psychiatry",
    "Radiology",
    "Surgery",
  ],
  "Education": [
    "Arts & Social Sciences Education",
    "Educational Foundations",
    "Library & Information Science",
    "Science Education",
  ],
  "Engineering": [
    "Chemical Engineering",
    "Civil Engineering",
    "Electrical / Electronics Engineering",
    "Mechanical Engineering",
    "Computer Engineering",
  ],
  "Environmental Sciences": [
    "Architecture",
    "Environmental Management",
    "Estate Management",
    "Fine & Applied Arts",
    "Geography & Meteorology",
    "Surveying & Geoinformatics",
    "Urban & Regional Planning",
  ],
  "Health Science & Technology": [
    "Medical Laboratory Science",
    "Nursing Science",
    "Optometry",
    "Public Health Technology",
  ],
  "Law": [
    "Common Law",
    "International Law & Jurisprudence",
    "Private & Property Law",
    "Public Law",
  ],
  "Management Sciences": [
    "Accountancy",
    "Banking & Finance",
    "Business Administration",
    "Cooperative Economics & Management",
    "Entrepreneurship Studies",
    "Insurance & Risk Management",
    "Marketing",
    "Public Administration",
  ],
  "Natural Sciences": [
    "Applied Microbiology & Brewing",
    "Botany",
    "Microbiology",
    "Zoology",
  ],
  "Pharmaceutical Sciences": [
    "Clinical Pharmacy & Pharmacy Practice",
    "Pharmaceutical Chemistry",
    "Pharmaceutics & Pharmaceutical Technology",
    "Pharmacognosy & Traditional Medicine",
    "Pharmacology & Toxicology",
  ],
  "Physical Sciences": [
    "Computer Science",
    "Geology",
    "Industrial Chemistry",
    "Industrial Mathematics",
    "Industrial Physics",
    "Statistics",
  ],
  "Social Sciences": [
    "Economics",
    "Mass Communication",
    "Political Science",
    "Psychology",
    "Social Work",
    "Sociology & Anthropology",
  ],
};

// Flat list of all departments (for dropdowns)
export const COOU_DEPARTMENTS: string[] = Object.values(COOU_DEPARTMENTS_BY_FACULTY).flat().sort();

export const LOCATIONS = [
  "Lagos, Nigeria", "Abuja, Nigeria", "Awka, Anambra", "Onitsha, Anambra", "Nnewi, Anambra",
  "Igbariam, Anambra", "Uli, Anambra", "Port Harcourt, Nigeria", "Enugu, Nigeria",
  "Ibadan, Nigeria", "Kano, Nigeria", "Benin City, Nigeria", "Owerri, Nigeria", "Asaba, Nigeria",
];

export const GRAD_YEARS = Array.from({ length: 2025 - 2004 + 1 }, (_, i) => 2025 - i);

export const NIGERIAN_UNIVERSITIES = [
  "Chukwuemeka Odumegwu Ojukwu University (COOU)",
  "Nnamdi Azikiwe University (UNIZIK)",
  "University of Nigeria, Nsukka (UNN)",
  "University of Lagos (UNILAG)",
  "University of Ibadan (UI)",
  "Obafemi Awolowo University (OAU)",
  "Ahmadu Bello University (ABU)",
  "University of Ilorin (UNILORIN)",
  "University of Benin (UNIBEN)",
  "University of Port Harcourt (UNIPORT)",
  "Federal University of Technology, Owerri (FUTO)",
  "Federal University of Technology, Akure (FUTA)",
  "Federal University of Technology, Minna (FUTMINNA)",
  "Covenant University",
  "Babcock University",
  "Afe Babalola University",
  "Lagos State University (LASU)",
  "Enugu State University of Science and Technology (ESUT)",
  "Imo State University (IMSU)",
  "Abia State University (ABSU)",
  "Ebonyi State University (EBSU)",
  "Rivers State University (RSU)",
  "Delta State University (DELSU)",
  "Ambrose Alli University (AAU)",
  "University of Uyo (UNIUYO)",
  "University of Calabar (UNICAL)",
  "University of Jos (UNIJOS)",
  "University of Abuja (UNIABUJA)",
  "Bayero University Kano (BUK)"
].sort();

export type Alumni = {
  id: string; name: string; initials: string; year: number; faculty: string;
  department: string; location: string; role: string; company: string;
  industry: string; skills: string[]; bio: string; tone: string;
};

const tones = [
  "from-emerald-700 to-emerald-900", "from-amber-600 to-amber-800",
  "from-emerald-600 to-teal-800", "from-yellow-600 to-amber-900",
  "from-teal-700 to-emerald-900", "from-amber-700 to-yellow-900",
];

export const ALUMNI: Alumni[] = [
  { id: "a1", name: "Chinaza Obi", initials: "CO", year: 2018, faculty: "Engineering", department: "Computer Science", location: "Lagos, Nigeria", role: "Senior Software Engineer", company: "Flutterwave", industry: "Fintech", skills: ["React", "Node.js", "AWS"], bio: "Building payment rails across Africa.", tone: tones[0] },
  { id: "a2", name: "Ifeoma Eze", initials: "IE", year: 2015, faculty: "Management Sciences", department: "Business Administration", location: "Abuja, Nigeria", role: "Product Manager", company: "Paystack", industry: "Fintech", skills: ["Strategy", "Analytics", "Leadership"], bio: "PM passionate about emerging market commerce.", tone: tones[1] },
  { id: "a3", name: "Emeka Nwosu", initials: "EN", year: 2012, faculty: "Clinical Medicine", department: "Internal Medicine", location: "Awka, Anambra", role: "Consultant Physician", company: "COOU Teaching Hospital", industry: "Healthcare", skills: ["Cardiology", "Research"], bio: "Cardiologist and clinical educator.", tone: tones[2] },
  { id: "a4", name: "Adaeze Okafor", initials: "AO", year: 2020, faculty: "Arts", department: "Mass Communication", location: "Abuja, Nigeria", role: "Brand Strategist", company: "MTN Nigeria", industry: "Telecom", skills: ["Brand", "Content", "PR"], bio: "Storyteller for African brands.", tone: tones[3] },
  { id: "a5", name: "Tobenna Umeh", initials: "TU", year: 2017, faculty: "Engineering", department: "Electrical / Electronics Engineering", location: "Port Harcourt, Nigeria", role: "Power Systems Engineer", company: "Shell Nigeria", industry: "Energy", skills: ["Power", "MATLAB", "Project Mgmt"], bio: "Energy infrastructure for emerging grids.", tone: tones[4] },
  { id: "a6", name: "Ngozi Ibe", initials: "NI", year: 2014, faculty: "Law", department: "Common Law", location: "Onitsha, Anambra", role: "Corporate Counsel", company: "Aluko & Oyebode", industry: "Legal", skills: ["M&A", "Compliance"], bio: "Corporate law and policy.", tone: tones[5] },
  { id: "a7", name: "Kelechi Anya", initials: "KA", year: 2019, faculty: "Pharmaceutical Sciences", department: "Clinical Pharmacy & Pharmacy Practice", location: "Enugu, Nigeria", role: "Clinical Pharmacist", company: "HealthPlus Nigeria", industry: "Healthcare", skills: ["Pharmacology", "Patient Care"], bio: "Patient-first community pharmacy.", tone: tones[0] },
  { id: "a8", name: "Obinna Mbah", initials: "OM", year: 2016, faculty: "Social Sciences", department: "Economics", location: "Lagos, Nigeria", role: "Quant Analyst", company: "Access Bank", industry: "Finance", skills: ["Python", "Quant", "ML"], bio: "Markets & machine learning.", tone: tones[1] },
  { id: "a9", name: "Uchechi Okeke", initials: "UO", year: 2021, faculty: "Natural Sciences", department: "Microbiology", location: "Nnewi, Anambra", role: "Research Scientist", company: "Nnamdi Azikiwe Teaching Hospital", industry: "Biotech", skills: ["Genomics", "Lab"], bio: "Vaccine research for tropical diseases.", tone: tones[2] },
  { id: "a10", name: "Ebuka Eze", initials: "EE", year: 2013, faculty: "Environmental Sciences", department: "Architecture", location: "Abuja, Nigeria", role: "Senior Architect", company: "Julius Berger", industry: "Architecture", skills: ["Revit", "Sustainable Design"], bio: "Sustainable urbanism across West Africa.", tone: tones[3] },
  { id: "a11", name: "Chiamaka Nnamdi", initials: "CN", year: 2022, faculty: "Social Sciences", department: "Political Science", location: "Awka, Anambra", role: "Policy Analyst", company: "Anambra State Government", industry: "Public Sector", skills: ["Policy", "Research"], bio: "State policy & governance.", tone: tones[4] },
  { id: "a12", name: "Somto Eze", initials: "SE", year: 2010, faculty: "Engineering", department: "Civil Engineering", location: "Port Harcourt, Nigeria", role: "Project Director", company: "Julius Berger", industry: "Construction", skills: ["Infrastructure", "PMP"], bio: "Infrastructure that lasts generations.", tone: tones[5] },
];

export type Job = {
  id: string; title: string; company: string; location: string;
  type: "Full-time" | "Part-time" | "Internship" | "Contract";
  category: string; remote: boolean; salary: string; posted: string;
  description: string; requirements: string[]; postedBy: string;
  referralAvailable: boolean; featured?: boolean;
};

export const JOB_CATEGORIES = ["Engineering", "Product", "Design", "Data", "Marketing", "Healthcare", "Finance", "Legal", "Operations"];

export const JOBS: Job[] = [
  { id: "j1", title: "Frontend Engineer (React)", company: "Flutterwave", location: "Lagos, Nigeria", type: "Full-time", category: "Engineering", remote: true, salary: "₦8M – ₦12M", posted: "2 days ago", description: "Build delightful payment experiences for millions of African users.", requirements: ["3+ yrs React", "TypeScript", "REST/GraphQL"], postedBy: "Chinaza Obi · '18", referralAvailable: true, featured: true },
  { id: "j2", title: "Product Manager — Payments", company: "Paystack", location: "Lagos, Nigeria · Remote", type: "Full-time", category: "Product", remote: true, salary: "₦15M – ₦22M", posted: "5 days ago", description: "Lead product strategy for cross-border payments.", requirements: ["5+ yrs PM", "Fintech exp", "SQL"], postedBy: "Ifeoma Eze · '15", referralAvailable: true },
  { id: "j3", title: "Software Engineering Intern", company: "MTN Nigeria", location: "Abuja, Nigeria", type: "Internship", category: "Engineering", remote: false, salary: "₦250k/mo", posted: "1 day ago", description: "12-week internship building internal developer tools.", requirements: ["Final-year student", "Python or JS", "Eager to learn"], postedBy: "Adaeze Okafor · '20", referralAvailable: true, featured: true },
  { id: "j4", title: "Clinical Pharmacist", company: "COOU Teaching Hospital", location: "Awka, Anambra", type: "Full-time", category: "Healthcare", remote: false, salary: "Competitive", posted: "1 week ago", description: "Join our pharmacy team supporting patient care.", requirements: ["B.Pharm", "PCN registered"], postedBy: "Emeka Nwosu · '12", referralAvailable: false },
  { id: "j5", title: "Quantitative Analyst", company: "Access Bank", location: "Lagos, Nigeria", type: "Full-time", category: "Finance", remote: false, salary: "₦18M – ₦25M", posted: "3 days ago", description: "Develop pricing models for corporate treasury.", requirements: ["MSc Quant/Math", "Python, C++", "Stochastic calc"], postedBy: "Obinna Mbah · '16", referralAvailable: true },
];
