// Comprehensive list of countries with their states/provinces
export type CountryData = { name: string; states: string[] };

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
];

export const COUNTRIES: CountryData[] = [
  { name: "Nigeria", states: NIGERIAN_STATES },
  { name: "Ghana", states: ["Ashanti","Bono","Bono East","Ahafo","Central","Eastern","Greater Accra","North East","Northern","Oti","Savannah","Upper East","Upper West","Volta","Western","Western North"] },
  { name: "United States", states: ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","District of Columbia"] },
  { name: "United Kingdom", states: ["England","Scotland","Wales","Northern Ireland"] },
  { name: "Canada", states: ["Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador","Nova Scotia","Ontario","Prince Edward Island","Quebec","Saskatchewan","Northwest Territories","Nunavut","Yukon"] },
  { name: "South Africa", states: ["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","North West","Northern Cape","Western Cape"] },
  { name: "Kenya", states: ["Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa","Homa Bay","Isiolo","Kajiado","Kakamega","Kericho","Kiambu","Kilifi","Kirinyaga","Kisii","Kisumu","Kitui","Kwale","Laikipia","Lamu","Machakos","Makueni","Mandera","Marsabit","Meru","Migori","Mombasa","Murang'a","Nairobi","Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri","Samburu","Siaya","Taita-Taveta","Tana River","Tharaka-Nithi","Trans-Nzoia","Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot"] },
  { name: "India", states: ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh"] },
  { name: "Australia", states: ["New South Wales","Victoria","Queensland","South Australia","Western Australia","Tasmania","Northern Territory","Australian Capital Territory"] },
  { name: "Germany", states: ["Baden-Württemberg","Bavaria","Berlin","Brandenburg","Bremen","Hamburg","Hesse","Lower Saxony","Mecklenburg-Vorpommern","North Rhine-Westphalia","Rhineland-Palatinate","Saarland","Saxony","Saxony-Anhalt","Schleswig-Holstein","Thuringia"] },
  { name: "France", states: ["Île-de-France","Provence-Alpes-Côte d'Azur","Auvergne-Rhône-Alpes","Occitanie","Nouvelle-Aquitaine","Hauts-de-France","Grand Est","Brittany","Normandy","Pays de la Loire","Centre-Val de Loire","Bourgogne-Franche-Comté","Corsica"] },
  { name: "China", states: ["Beijing","Shanghai","Guangdong","Zhejiang","Jiangsu","Shandong","Henan","Sichuan","Hubei","Hunan","Fujian","Anhui","Hebei","Liaoning","Shaanxi","Chongqing","Tianjin","Yunnan","Guangxi","Guizhou","Jiangxi","Heilongjiang","Jilin","Gansu","Inner Mongolia","Xinjiang","Hainan","Ningxia","Tibet","Qinghai"] },
  { name: "United Arab Emirates", states: ["Abu Dhabi","Dubai","Sharjah","Ajman","Umm Al Quwain","Ras Al Khaimah","Fujairah"] },
  { name: "Saudi Arabia", states: ["Riyadh","Makkah","Madinah","Eastern Province","Asir","Tabuk","Hail","Northern Borders","Jazan","Najran","Al Baha","Al Jawf","Qassim"] },
  { name: "Cameroon", states: ["Adamawa","Centre","East","Far North","Littoral","North","Northwest","South","Southwest","West"] },
  { name: "Tanzania", states: ["Arusha","Dar es Salaam","Dodoma","Geita","Iringa","Kagera","Katavi","Kigoma","Kilimanjaro","Lindi","Manyara","Mara","Mbeya","Morogoro","Mtwara","Mwanza","Njombe","Pemba North","Pemba South","Pwani","Rukwa","Ruvuma","Shinyanga","Simiyu","Singida","Songwe","Tabora","Tanga","Zanzibar North","Zanzibar South","Zanzibar West"] },
  { name: "Egypt", states: ["Cairo","Alexandria","Giza","Qalyubia","Dakahlia","Sharqia","Gharbia","Monufia","Beheira","Kafr El Sheikh","Damietta","Port Said","Ismailia","Suez","North Sinai","South Sinai","Red Sea","Aswan","Luxor","Qena","Sohag","Asyut","Minya","Beni Suef","Fayoum","New Valley","Matrouh"] },
  { name: "Ethiopia", states: ["Addis Ababa","Afar","Amhara","Benishangul-Gumuz","Dire Dawa","Gambela","Harari","Oromia","Sidama","Somali","South West Ethiopia","Southern Nations","Tigray"] },
  // Countries without detailed states (common destinations for Nigerian diaspora)
  ...[
    "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina",
    "Armenia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus",
    "Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil",
    "Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Central African Republic",
    "Chad","Chile","Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba","Cyprus",
    "Czech Republic","DR Congo","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador",
    "El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Fiji","Finland",
    "Gabon","Gambia","Georgia","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau",
    "Guyana","Haiti","Honduras","Hungary","Iceland","Indonesia","Iran","Iraq","Ireland",
    "Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kazakhstan","Kuwait",
    "Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein",
    "Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta",
    "Mauritania","Mauritius","Mexico","Moldova","Monaco","Mongolia","Montenegro","Morocco",
    "Mozambique","Myanmar","Namibia","Nepal","Netherlands","New Zealand","Nicaragua","Niger",
    "North Korea","North Macedonia","Norway","Oman","Pakistan","Panama","Papua New Guinea",
    "Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda",
    "Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa",
    "San Marino","Sao Tome and Principe","Senegal","Serbia","Seychelles","Sierra Leone",
    "Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Korea","South Sudan",
    "Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan",
    "Tajikistan","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia",
    "Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","Uruguay","Uzbekistan","Vanuatu",
    "Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
  ].map(name => ({ name, states: [] as string[] })),
];

export const COUNTRY_NAMES = COUNTRIES.map(c => c.name);

export const getStatesForCountry = (country: string): string[] => {
  return COUNTRIES.find(c => c.name === country)?.states ?? [];
};
