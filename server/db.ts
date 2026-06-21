import fs from 'fs';
import path from 'path';
import { User, Lead, SavedList, ListItem, ScoringConfig, SavedSearch, NotificationLog, CopilotSession } from '../src/types';

const DB_FILE = path.join(process.cwd(), 'data.json');

// Default scoring weights
const DEFAULT_SCORING_CONFIG: ScoringConfig[] = [
  { criterion: 'no_website', weight: 25, description: 'No website (+25) or missing digital portal' },
  { criterion: 'no_social', weight: 15, description: 'No social media profiles (+15)' },
  { criterion: 'business_age', weight: 20, description: 'Business age < 2 years (+20) (Growth-hungry)' },
  { criterion: 'phone_available', weight: 10, description: 'Phone number is contactable (+10)' },
  { criterion: 'zero_responses', weight: 15, description: 'Untouched Google reviews / Zero replies (+15)' },
  { criterion: 'competitor_density', weight: 15, description: 'High competitor density nearby (>= 3 rivals) (+15)' }
];

export interface DBState {
  users: User[];
  leads: Lead[];
  lists: SavedList[];
  listItems: ListItem[];
  scoringConfig: ScoringConfig[];
  savedSearches: SavedSearch[];
  notificationLog: NotificationLog[];
  copilotSessions: CopilotSession[];
}

// Generate realistic mock leads for 3 cities (Hyderabad, Bangalore, Mumbai)
function generate150Leads(configs: ScoringConfig[]): Lead[] {
  const leads: Lead[] = [];
  
  const cities: ('Hyderabad' | 'Bangalore' | 'Mumbai')[] = ['Hyderabad', 'Bangalore', 'Mumbai'];
  
  const localities = {
    Hyderabad: ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Madhapur', 'Begumpet', 'Kukatpally'],
    Bangalore: ['Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout', 'Jayanagar', 'Malleshwaram'],
    Mumbai: ['Bandra West', 'Andheri East', 'Colaba', 'Juhu', 'Powai', 'Worli']
  };

  const categories = {
    Hyderabad: ['Restaurant', 'Retail', 'Pharmacy', 'Salon', 'Gym', 'Real Estate'],
    Bangalore: ['IT Services', 'Education', 'Retail', 'Cafe', 'Healthcare'],
    Mumbai: ['Finance', 'Logistics', 'Restaurant', 'Retail', 'Fashion']
  };

  const firstNames = [
    'Ravi', 'Sanjay', 'Aditya', 'Vikram', 'Ananya', 'Priya', 'Rajesh', 'Amit', 'Neha', 'Gautam',
    'Sandhya', 'Kiran', 'Deepak', 'Arjun', 'Meera', 'Vijay', 'Rahul', 'Nikhil', 'Sneha', 'Vivek'
  ];

  const businessSurnames = {
    Restaurant: ['Dhaba', 'Bistro', 'Kitchen', 'Flavors', 'Grill', 'Spices', 'Cafe', 'Dine'],
    Retail: ['Mart', 'Stores', 'Bazaar', 'Supermarket', 'Emporium', 'Plaza', 'Collections'],
    Pharmacy: ['Medicals', 'Pharmacy', 'Pharma', 'Chemists', 'Apothecary', 'HealthCare'],
    Salon: ['Studio', 'Salon', 'Unisex Hair', 'Spa & Beauty', 'Makeover', 'Grooming'],
    Gym: ['Fitness', 'Gym', 'Iron Cave', 'Crossfit', 'Wellness', 'Workout Hub'],
    'Real Estate': ['Properties', 'Homes', 'Estates', 'Realty', 'Developers', 'Builders'],
    'IT Services': ['Solutions', 'Tech', 'Digital', 'Consulting', 'Infosol', 'Software'],
    Education: ['Academy', 'Institute', 'Classes', 'Coaching', 'Tutorials', 'Learning'],
    Cafe: ['Roasters', 'Brew', 'Mug', 'Express', 'Bean', 'Chai Point', 'Corner'],
    Healthcare: ['Clinic', 'Hospital', 'Diagnostics', 'Wellness Center', 'Care'],
    Finance: ['Associates', 'Fintech', 'Wealth', 'Capital', 'Advisors', 'Investments'],
    Logistics: ['Express', 'Logistics', 'Packers & Movers', 'Cargo', 'Transports'],
    Fashion: ['Boutique', 'Apparels', 'Couture', 'Trends', 'Styles', 'Threads']
  };

  // Target counts: Hyderabad=60, Bangalore=50, Mumbai=40
  const cityCounts = { Hyderabad: 60, Bangalore: 50, Mumbai: 40 };

  let idCounter = 1;

  for (const city of cities) {
    const targetCount = cityCounts[city];
    const cityLocalities = localities[city];
    const cityCats = categories[city];

    for (let i = 0; i < targetCount; i++) {
      const idx = i;
      const category = cityCats[idx % cityCats.length];
      const locality = cityLocalities[idx % cityLocalities.length];
      const ownerName = firstNames[idx % firstNames.length];
      const businessSuffix = businessSurnames[category as keyof typeof businessSurnames]?.[idx % (businessSurnames[category as keyof typeof businessSurnames]?.length || 3)] || 'Enterprise';
      
      const business_name = `${ownerName} ${businessSuffix}`;
      const phone = `9${Math.floor(80000000 + Math.random() * 19999999)}`;
      const email = `${ownerName.toLowerCase()}${businessSuffix.toLowerCase()}${idx}@gmail.com`;
      
      const has_website = Math.random() > 0.45; // 45% do not have website (+25)
      const has_social_media = Math.random() > 0.4; // 40% do not have social media (+15)
      const business_age_years = parseFloat((0.2 + Math.random() * 4).toFixed(1)); // Some < 2 years (+20)
      const google_review_count = Math.floor(Math.random() * 50);
      const google_review_responses = google_review_count === 0 ? 0 : (Math.random() > 0.70 ? Math.floor(Math.random() * google_review_count) : 0); // Many have zero review responses (+15)
      const competitor_count_nearby = Math.floor(Math.random() * 6); // Some have high competitor density (+15)

      // Calculate score breakdown
      const breakdown = calculateScore({
        has_website,
        has_social_media,
        business_age_years,
        google_review_count,
        google_review_responses,
        competitor_count_nearby,
        phone
      }, configs);

      const score = Object.values(breakdown).reduce((sum, num) => sum + num, 0);

      // Pre-generate custom realistic psychological signals
      let pressure_signal = '';
      let strike_timing: 'NOW' | 'SOON' | 'WAIT' = 'WAIT';

      if (score >= 75) {
        strike_timing = 'NOW';
        if (!has_website && competitor_count_nearby >= 3) {
          pressure_signal = `${business_name} has watched ${competitor_count_nearby} corporate rivals scale up within 500m in ${Math.floor(business_age_years * 12) || 8} months. With zero review responses on Google, the owner is losing walk-ins and fighting for survival. Call immediately — they are desperate for digital support.`;
        } else if (business_age_years < 2 && !has_social_media) {
          pressure_signal = `${business_name} is a high-potential startup under 2 years old in ${locality}. They have no social footprint and zero replies to reviews. The founder ${ownerName} is overwhelmed with logistics and completely unequipped to capture local web traffic. Call now to pitch a custom online funnel.`;
        } else {
          pressure_signal = `${business_name} is under extreme local market pressure in ${locality}. Despite receiving ${google_review_count} reviews, owner responses are non-existent. Without any active marketing, they are facing rapid digital customer loss. Contact them today.`;
        }
      } else if (score >= 50) {
        strike_timing = 'SOON';
        if (!has_website) {
          pressure_signal = `${business_name} does not have a professional website in ${city}, leading to poor organic authority. Competitors nearby are taking search traffic. Pitching a modern storefront soon is a high-yield opportunity.`;
        } else {
          pressure_signal = `${business_name} has a decent rating but zero customer engagement. Their online presence is starting to freeze up behind major market competitors. An upcoming check-in will find them willing to listen.`;
        }
      } else {
        strike_timing = 'WAIT';
        pressure_signal = `${business_name} has a solid local reputation, updated website, and modest competition in ${locality}. Digital channels are healthy. Focus active sales prospecting on higher pressure leads for now.`;
      }

      leads.push({
        id: `lead_${city.toLowerCase()}_${idCounter++}`,
        business_name,
        category,
        city,
        locality,
        phone,
        email,
        has_website,
        has_social_media,
        business_age_years,
        google_review_count,
        google_review_responses,
        competitor_count_nearby,
        score,
        score_breakdown: breakdown,
        pressure_signal,
        strike_timing,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  }

  return leads;
}

// Score Calculator helper
export function calculateScore(lead: Partial<Lead>, configs: ScoringConfig[]) {
  const getWeight = (crit: string) => configs.find(c => c.criterion === crit)?.weight || 0;

  const breakdown = {
    no_website: !lead.has_website ? getWeight('no_website') : 0,
    no_social: !lead.has_social_media ? getWeight('no_social') : 0,
    business_age: (lead.business_age_years !== undefined && lead.business_age_years < 2) ? getWeight('business_age') : 0,
    phone_available: lead.phone ? getWeight('phone_available') : 0,
    zero_responses: (lead.google_review_count !== undefined && lead.google_review_count > 0 && lead.google_review_responses === 0) ? getWeight('zero_responses') : 0,
    competitor_density: (lead.competitor_count_nearby !== undefined && lead.competitor_count_nearby >= 3) ? getWeight('competitor_density') : 0
  };

  return breakdown;
}

// Load DB from file or initialize with seed data
export function getDB(): DBState {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const state = JSON.parse(data) as DBState;
      // Make sure all required fields survive
      if (!state.users) state.users = [];
      if (!state.leads) state.leads = [];
      if (!state.lists) state.lists = [];
      if (!state.listItems) state.listItems = [];
      if (!state.scoringConfig) state.scoringConfig = DEFAULT_SCORING_CONFIG;
      if (!state.savedSearches) state.savedSearches = [];
      if (!state.notificationLog) state.notificationLog = [];
      if (!state.copilotSessions) state.copilotSessions = [];
      return state;
    } catch (e) {
      console.error('Error parsing data.json, regenerating pristine state', e);
    }
  }

  // Generate pristine seed state
  const pristineUsers: User[] = [
    {
      id: 'usr_admin',
      email: 'admin@strikeai.in',
      password_hash: 'Strike@Admin123', // Clean simple credentials for hackathon speed
      name: 'Strike Admin',
      role: 'admin',
      created_at: new Date().toISOString()
    },
    {
      id: 'usr_demo',
      email: 'demo@strikeai.in',
      password_hash: 'Demo@123', // Demo credentials for testing
      name: 'Varun Reshu',
      role: 'user',
      created_at: new Date().toISOString()
    }
  ];

  const generatedLeads = generate150Leads(DEFAULT_SCORING_CONFIG);

  // Seed two starting lists for the demo user
  const initialLists: SavedList[] = [
    {
      id: 'lst_1',
      user_id: 'usr_demo',
      name: 'High-Pressure Medical Clinic',
      created_at: new Date().toISOString()
    },
    {
      id: 'lst_2',
      user_id: 'usr_demo',
      name: 'Urgent Cafes & Lounges',
      created_at: new Date().toISOString()
    }
  ];

  // Store a couple list items from our pre-seeded listings
  const initialItems: ListItem[] = [];
  const hyderabadLeads = generatedLeads.filter(l => l.city === 'Hyderabad');
  const bangaloreLeads = generatedLeads.filter(l => l.city === 'Bangalore');

  if (hyderabadLeads.length > 0) {
    initialItems.push({
      id: 'li_1',
      list_id: 'lst_1',
      lead_id: hyderabadLeads[0].id,
      status: 'New',
      notes: 'No answer on first dial. Under immense competitive pressure from nearby chain pharmas.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  if (bangaloreLeads.length > 0) {
    initialItems.push({
      id: 'li_2',
      list_id: 'lst_2',
      lead_id: bangaloreLeads[0].id,
      status: 'Contacted',
      notes: 'Spoke with the front desk manager. Offered a complimentary online website audit.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  const state: DBState = {
    users: pristineUsers,
    leads: generatedLeads,
    lists: initialLists,
    listItems: initialItems,
    scoringConfig: DEFAULT_SCORING_CONFIG,
    savedSearches: [],
    notificationLog: [],
    copilotSessions: []
  };

  saveDB(state);
  return state;
}

export function saveDB(state: DBState) {
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf8');
}
