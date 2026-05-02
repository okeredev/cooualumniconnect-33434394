// Country → first-level admin region (state/province) map for the user dashboard.
// Coverage focuses on countries where COOU alumni are commonly based.

export const COUNTRY_STATES: Record<string, string[]> = {
  Nigeria: [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
    "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
    "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
    "Yobe", "Zamfara",
  ],
  "United States": [
    "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
    "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
    "Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi",
    "Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico",
    "New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
    "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
    "Virginia","Washington","West Virginia","Wisconsin","Wyoming","District of Columbia",
  ],
  "United Kingdom": [
    "England","Scotland","Wales","Northern Ireland","Greater London","West Midlands",
    "Greater Manchester","Merseyside","South Yorkshire","West Yorkshire","Tyne & Wear",
  ],
  Canada: [
    "Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador",
    "Nova Scotia","Ontario","Prince Edward Island","Quebec","Saskatchewan",
    "Northwest Territories","Nunavut","Yukon",
  ],
  Ghana: [
    "Ahafo","Ashanti","Bono","Bono East","Central","Eastern","Greater Accra","North East",
    "Northern","Oti","Savannah","Upper East","Upper West","Volta","Western","Western North",
  ],
  "South Africa": [
    "Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga",
    "Northern Cape","North West","Western Cape",
  ],
  Kenya: [
    "Nairobi","Mombasa","Kisumu","Nakuru","Eldoret","Kiambu","Machakos","Uasin Gishu",
    "Meru","Nyeri","Kakamega","Kilifi","Kisii","Bungoma","Garissa",
  ],
  Germany: [
    "Baden-Württemberg","Bavaria","Berlin","Brandenburg","Bremen","Hamburg","Hesse",
    "Lower Saxony","Mecklenburg-Vorpommern","North Rhine-Westphalia","Rhineland-Palatinate",
    "Saarland","Saxony","Saxony-Anhalt","Schleswig-Holstein","Thuringia",
  ],
  France: [
    "Auvergne-Rhône-Alpes","Bourgogne-Franche-Comté","Brittany","Centre-Val de Loire",
    "Corsica","Grand Est","Hauts-de-France","Île-de-France","Normandy","Nouvelle-Aquitaine",
    "Occitania","Pays de la Loire","Provence-Alpes-Côte d'Azur",
  ],
  Australia: [
    "Australian Capital Territory","New South Wales","Northern Territory","Queensland",
    "South Australia","Tasmania","Victoria","Western Australia",
  ],
  India: [
    "Andhra Pradesh","Bihar","Delhi","Gujarat","Haryana","Karnataka","Kerala","Maharashtra",
    "Punjab","Rajasthan","Tamil Nadu","Telangana","Uttar Pradesh","West Bengal",
  ],
  "United Arab Emirates": [
    "Abu Dhabi","Ajman","Dubai","Fujairah","Ras Al Khaimah","Sharjah","Umm Al Quwain",
  ],
  "Saudi Arabia": [
    "Riyadh","Makkah","Madinah","Eastern Province","Asir","Tabuk","Qassim","Hail",
    "Northern Borders","Jazan","Najran","Al Bahah","Al Jouf",
  ],
  Ireland: [
    "Carlow","Cavan","Clare","Cork","Donegal","Dublin","Galway","Kerry","Kildare","Kilkenny",
    "Laois","Leitrim","Limerick","Longford","Louth","Mayo","Meath","Monaghan","Offaly",
    "Roscommon","Sligo","Tipperary","Waterford","Westmeath","Wexford","Wicklow",
  ],
  Netherlands: [
    "Drenthe","Flevoland","Friesland","Gelderland","Groningen","Limburg","North Brabant",
    "North Holland","Overijssel","South Holland","Utrecht","Zeeland",
  ],
  Sweden: [
    "Stockholm","Västra Götaland","Skåne","Uppsala","Östergötland","Jönköping","Halland",
    "Örebro","Södermanland","Dalarna","Gävleborg","Värmland",
  ],
  China: [
    "Beijing","Shanghai","Guangdong","Hong Kong","Sichuan","Zhejiang","Jiangsu","Shandong",
    "Hubei","Fujian","Tianjin","Liaoning",
  ],
  Other: [],
};

export const COUNTRIES = Object.keys(COUNTRY_STATES).sort((a, b) =>
  a === "Nigeria" ? -1 : b === "Nigeria" ? 1 : a.localeCompare(b)
);
