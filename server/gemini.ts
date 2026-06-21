import { GoogleGenAI } from '@google/genai';
import { Lead } from '../src/types';

// Lazy initialize Gemini client to avoid crashes on startup if GEMINI_API_KEY is missing
let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Warning: GEMINI_API_KEY is missing in environment. Using simulated AI responses fallback.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || 'DUMMY_KEY',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// Check if API key is valid / exists
function isAIEnabled(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return !!key && key !== 'MY_GEMINI_API_KEY' && key !== '';
}

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Resilient, models-auto-fallback wrapper with exponential retry backoff.
 * Tries the preferred model first, then falls back to secondary models if it receives a 503/429 etc.
 */
async function callGeminiWithRetry(
  promptOrContents: any,
  config?: any,
  preferredModel: string = 'gemini-3.5-flash'
): Promise<any> {
  const modelsToTry = [preferredModel, 'gemini-2.5-flash', 'gemini-3.5-flash'];
  // Deduplicate
  const uniqueModels = Array.from(new Set(modelsToTry));

  let lastError: any = null;

  for (const modelName of uniqueModels) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const ai = getAI();
        const response = await ai.models.generateContent({
          model: modelName,
          contents: promptOrContents,
          config: config
        });
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini generation failed for model ${modelName} on attempt ${attempt}:`, err.message || err);
        if (attempt < 3) {
          const delay = attempt * 1000;
          await wait(delay);
        }
      }
    }
  }

  throw lastError || new Error('All Gemini retry attempts failed.');
}

/**
 * Generate Pressure Signal (One-sentence psychological strike signal)
 */
export async function generatePressureSignalAI(lead: Lead): Promise<string> {
  if (!isAIEnabled()) {
    return `${lead.business_name} in ${lead.locality} is facing tight competition with ${lead.competitor_count_nearby} rivals nearby. Without a modern website and review replies, they are ready to hear a digital growth proposal today.`;
  }

  try {
    const prompt = `
      You are a world-class B2B sales development expert. 
      Analyze this business lead and generate a highly tailored, exactly one-sentence psychological strike signal.
      The sentence must answer: Why is now structural pressure making this owner desperate or ready to hear from a digital sales consultant?
      
      Lead Details:
      - Business Name: ${lead.business_name}
      - Category: ${lead.category}
      - Location: ${lead.locality}, ${lead.city}
      - Age of Business: ${lead.business_age_years} years
      - Has Website: ${lead.has_website ? 'Yes' : 'No'}
      - Has Social Media: ${lead.has_social_media ? 'Yes' : 'No'}
      - Google Reviews: ${lead.google_review_count} reviews
      - Replied to Reviews: ${lead.google_review_responses} responses
      - Competitors nearby: ${lead.competitor_count_nearby}
      - Calculated Strike Score: ${lead.score}/100

      Style: Direct, intense, authoritative. Focus on emotional vulnerability (scared, overwhelmed, losing traffic).
      Output exactly one single sentence, no markdown extra formatting or quotes.
    `;

    const response = await callGeminiWithRetry(prompt, {
      tools: [{ googleSearch: {} }] // Enable Google Search Grounding for localized knowledge
    }, 'gemini-3.5-flash');

    return response.text?.trim() || 'Ready to strike! Lead is experiencing heavy local market pressure.';
  } catch (error) {
    console.error('Error in generatePressureSignalAI:', error);
    return `${lead.business_name} is under heavy regional pressure in ${lead.locality}. Lacking active follow-up on reviews is causing a silent revenue leak. Call today.`;
  }
}

/**
 * Generate personalized cold email + WhatsApp outreach
 */
export async function generateOutreachAI(lead: Lead): Promise<{ email: string; whatsapp: string }> {
  if (!isAIEnabled()) {
    return {
      email: `Subject: Helping ${lead.business_name} capture premium customers in ${lead.locality}\n\nHi Master,\n\nI noticed ${lead.business_name} has watched rivals crowd the local ${lead.locality} area while your Google review replies remain open. We help businesses automate local acquisition. Let me know if you would be open to a 3-minute chat.\n\nBest,\nVarun`,
      whatsapp: `Hi, is this the owner of ${lead.business_name}? I was looking for ${lead.category}s in ${lead.locality} and found something costing you foot traffic. Got 45 seconds?`
    };
  }

  try {
    const prompt = `
      You are a master cold outreach strategist who writes high-conversion copywriting.
      Generate a highly personalized cold email AND a WhatsApp message for the following lead based on their specific digital pressure signals.

      Lead Details:
      - Business Name: ${lead.business_name}
      - Category: ${lead.category}
      - Locality/City: ${lead.locality}, ${lead.city}
      - Web Presence: ${lead.has_website ? 'Has a website' : 'NO website'}
      - Social Footprint: ${lead.has_social_media ? 'Has social media profiles' : 'NO social media profiles'}
      - Google Reviews: ${lead.google_review_count} (Replied to only ${lead.google_review_responses} reviews)
      - Rival Count: ${lead.competitor_count_nearby} competing chains nearby
      - AI Strike Signal: ${lead.pressure_signal}

      Requirements:
      1. Email:
         - Subject line: Casual, intriguing, short (no corporate buzzwords).
         - Body: 3-4 sentence short address. Avoid sounding like spam. Empathize with the local competitive pressure without naming competing names directly. Focus on a simple, low-pressure invitation to speak.
      2. WhatsApp:
         - Extremely short, direct, casual. 1-2 sentences maximum. Sounds like a text from a helpful local customer.

      Return the result as a strict JSON object with fields "email" and "whatsapp". Do NOT output any markdown tags outside the JSON block.
    `;

    const response = await callGeminiWithRetry(prompt, {
      responseMimeType: 'application/json'
    }, 'gemini-3.5-flash');

    const parsed = JSON.parse(response.text || '{}');
    let emailStr = '';
    if (parsed.email) {
      if (typeof parsed.email === 'object') {
        const subject = parsed.email.subject || 'Quick question about local client flow';
        const body = parsed.email.body || '';
        emailStr = `Subject: ${subject}\n\n${body}`;
      } else {
        emailStr = String(parsed.email);
      }
    } else {
      emailStr = 'Subject: Quick question about local client flow\n\nHi, I saw your review backlog...';
    }

    let whatsappStr = '';
    if (parsed.whatsapp) {
      if (typeof parsed.whatsapp === 'object') {
        whatsappStr = parsed.whatsapp.body || parsed.whatsapp.message || JSON.stringify(parsed.whatsapp);
      } else {
        whatsappStr = String(parsed.whatsapp);
      }
    } else {
      whatsappStr = 'Hi! Quick question for the owner of ' + lead.business_name + '...';
    }

    return {
      email: emailStr,
      whatsapp: whatsappStr
    };
  } catch (error) {
    console.error('Error in generateOutreachAI:', error);
    return {
      email: `Subject: Quick feedback on ${lead.business_name}\n\nHi,\n\nI was looking at your ${lead.category} in ${lead.locality} and noticed some competitor density changes. Would you like to review their traffic metrics?\n\nBest,\nVarun`,
      whatsapp: `Hi, is this ${lead.business_name}? I noticed some interesting customer flow patterns in ${lead.locality} and wanted to share.`
    };
  }
}

/**
 * Generate Pre-Call Briefing (Phase 1)
 */
export async function generatePreCallBriefingAI(lead: Lead): Promise<string> {
  if (!isAIEnabled()) {
    return `🎯 You're about to call ${lead.business_name} in ${lead.locality}.

He's been open for ${lead.business_age_years} years, facing ${lead.competitor_count_nearby} rivals within walking distance. He has ${lead.google_review_count} Google reviews but hasn't responded to any of them.

He's not lazy. He's overwhelmed and scared.

DON'T open with pricing. DON'T mention competitors by name.

OPEN WITH THIS:
"Mr. Owner, I was looking at businesses in ${lead.locality} and I noticed something that might be costing you walk-in customers every single day."

Then stop. Say nothing. Let him ask what. That silence is where you win.`;
  }

  try {
    const prompt = `
      You are an energetic, strategic cold call boxing coach preparing a sales rep before entering a tough fight.
      Speak directly to the sales rep in the second-person ("You're about to call...", "Your prospect is...", "Do not do...").
      Give them fire, confidence, and highly tactical psychological angles. Do NOT write a boring dashboard report. 

      Lead Details:
      - Business Name: ${lead.business_name}
      - Category: ${lead.category}
      - Locale: ${lead.locality}, ${lead.city}
      - Age: ${lead.business_age_years} years
      - Competitors nearby: ${lead.competitor_count_nearby}
      - Website: ${lead.has_website ? 'Has website' : 'NO website'}
      - Social Media: ${lead.has_social_media ? 'Has social' : 'NO social media'}
      - Google Reviews: ${lead.google_review_count} reviews (${lead.google_review_responses} replied)
      - AI Signal: ${lead.pressure_signal}

      Formatting Requirements:
      Generate a short, intense text briefing.
      Include a specific "OPEN WITH THIS:" quote of what the sales rep should say word-for-word, followed by coaching instructions. Keep it highly motivational and under 250 words.
    `;

    const response = await callGeminiWithRetry(prompt, undefined, 'gemini-3.5-flash');

    return response.text || 'Briefing loaded successfully. Ready to dial!';
  } catch (error) {
    console.error('Error in generatePreCallBriefingAI:', error);
    return `🎯 You're about to call ${lead.business_name} in ${lead.locality}.\n\nHe is fighting for customer attention with ${lead.competitor_count_nearby} competitors nearby. Ready to win!`;
  }
}

/**
 * Live AI Roleplay Chat Response (Phase 2)
 */
export async function generateCopilotChatAI(
  lead: Lead,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<string> {
  if (!isAIEnabled()) {
    const lastUserMsg = [...history].reverse().find(m => m.role === 'user')?.content.toLowerCase() || '';
    if (lastUserMsg.includes('price') || lastUserMsg.includes('cost') || lastUserMsg.includes('how much')) {
      return "How much is this going to cost me? I don't have budget for expensive tools right now, so if you are trying to sell me something, I'll have to hang up.";
    }
    if (lastUserMsg.includes('busy') || lastUserMsg.includes('now')) {
      return "I'm literally running around managing the shop floor. Look, just email me whatever you have. I don't have time to chat on the phone today.";
    }
    return 'Look, buy what? Who is this? I get ten of these calls a day. Tell me exactly what you want or I am wrapping this up.';
  }

  try {
    // System instruction defining the prospect's personality
    const systemInstruction = `
      You are roleplaying as the owner of ${lead.business_name}, a ${lead.category} in ${lead.locality}, ${lead.city}.
      Your persona:
      - You are busy, moderately defensive, skeptical, and slightly stressed.
      - You get cold calls every single day and hate them.
      - You won't make it easy for the sales rep.
      - If they immediately pitch pricing, talk about features, or mention rivals by name, push back or hang up.
      - If they create authentic curiosity or identify real problems (like zero replies to review listings, rivals eating up organic search, lack of mobile visibility in Banjara Hills) in a helpful, friendly way, speak further and ask "What exactly did you notice?"
      
      Keep responses realistic, natural, conversational, and relatively short (1-3 sentences), exactly how a busy small business owner speaks on the phone. Do NOT break character or write meta-commentary.
    `;

    const formattedContents = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: msg.content }]
    }));

    const response = await callGeminiWithRetry(formattedContents, {
      systemInstruction: systemInstruction
    }, 'gemini-3.5-flash');

    return response.text?.trim() || "What? I didn't quite catch that. What is this about?";
  } catch (error) {
    console.error('Error in generateCopilotChatAI:', error);
    return 'Look, I am extremely busy right now. If you want, send me an email in detail.';
  }
}

/**
 * Generate Call Readiness Score + Feedback (Phase 3)
 */
export async function generateCopilotScoreAI(
  lead: Lead,
  transcript: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<any> {
  const defaultFeedback = {
    strong_points: ['Spoke confidently with general interest.'],
    weak_points: ['Lacked a sharp localized hook, discussed solutions/prices too early, and rambled without establishing clear pain points.'],
    missed_points: ['Failed to explicitly mention lead metrics: answering review backlog and recovering local page-1 search positioning.'],
    tips: ['Keep quiet after presenting the walk-in problem to invite prospect participation. Wait for their acknowledgment before pitching features.'],
    readiness_score: 48,
    reality_check: 'Your messaging is highly confusing, lacks direct clarity, and is too vague. A real prospect would likely lose interest within the first 30 seconds. Do not contact leads with this current structure as it will result in low conversion rates.',
    should_call: false,
    verdict: 'Do Not Call Yet',
    sentence_rewrites: [
      {
        original: "Hi sir, we have AI and many features and it helps business.",
        improved: `Hi, I was looking at your Google Maps listing for ${lead.business_name} and noticed that you have over ${lead.pressure_signal || 'unanswered reviews'} which is pushing you down the local search index. We can help you recover that page-1 traffic.`
      }
    ]
  };

  if (!isAIEnabled()) {
    return defaultFeedback;
  }

  try {
    const transcriptText = transcript.map(t => `${t.role === 'user' ? 'Rep' : 'Prospect'}: ${t.content}`).join('\n');
    
    const prompt = `
      You are a brutally honest, objective, and realistic sales director and SDR coach.
      Examine the following cold call transcript between a sales representative ("Rep") and a skeptical business owner ("Prospect").
      
      Business Context of Prospect:
      - Name: ${lead.business_name}
      - Category: ${lead.category}
      - Target Problems: ${lead.pressure_signal}

      Transcript:
      ${transcriptText}

      Please provide an objective, brutally honest, data-driven critique of the representative's performance.
      Do NOT inflate scores. Do NOT reward effort. Do NOT assume positive intent. Do NOT say "Great job" or "Excellent work" unless the pitch is truly world-class (above 85).
      
      Strict Scoring Scale:
      - Excellent pitch: 85–95 (rare and must be earned)
      - Very good pitch: 75–84
      - Average pitch: 60–74
      - Weak pitch: 40–59
      - Poor pitch: 20–39
      - Completely unprepared: 0–19

      Analyze the actual user ("Rep") statements word-for-word. Determine if:
      - The pitch is confusing
      - The value proposition is missing or vague
      - The rep rambles or talks mostly irrelevant information / nonsense
      - The rep sounds unprepared or cannot explain the product clearly

      Return a strict JSON object with exactly these fields:
      - "readiness_score": number (0-100, following the brutal scale above)
      - "strong_points": string[] (be brief, clear, and only include if they actually did well)
      - "weak_points": string[] (point out exactly where they rambled, stumbled, or discussed pricing too early)
      - "missed_points": string[] (crucial localized context or metrics they failed to trigger)
      - "tips": string[] (actionable, direct SDR coaching tips)
      - "reality_check": string (A detailed brutally honest reality check about whether they are actually ready for a live call: e.g. "You are not ready for a live call yet. Your messaging is confusing...", "The pitch is weak and highly unlikely to convert.", or "You appear ready for real conversations...")
      - "should_call": boolean (true if readiness_score is >= 80 and pitch is clear, false if they have confusing value-prop, ramble, sound unprepared, etc.)
      - "verdict": "Ready To Call" | "Needs More Practice" | "Do Not Call Yet" (Ready To Call: score >= 80; Needs More Practice: score 60-79; Do Not Call Yet: score < 60)
      - "sentence_rewrites": Array of objects: { "original": string, "improved": string } representing EVERY statement spoken by the Rep/user in the transcript. Map the exact or summarized Rep phrase (original) to a much tighter, shorter, high-impact cold-outreach alternative (improved). If a statement is already strong, keep it unchanged.

      Do NOT output any markdown blocks or commentary outside the JSON output.
    `;

    const response = await callGeminiWithRetry(prompt, {
      responseMimeType: 'application/json'
    }, 'gemini-3.5-flash');

    const result = JSON.parse(response.text || '{}');
    return { ...defaultFeedback, ...result };
  } catch (error) {
    console.error('Error in generateCopilotScoreAI:', error);
    return defaultFeedback;
  }
}

/**
 * Generate StrikeVision Business Intelligence Report (URL-driven)
 */
export async function generateStrikeVisionReportAI(url: string): Promise<any> {
  // Extract keywords for intelligent mock data fallback
  const normalizedUrl = url.toLowerCase();
  let businessName = "Apex Enterprise Solution";
  let category = "Professional Services";
  let segment = "b2b";

  if (normalizedUrl.includes("cafe") || normalizedUrl.includes("coffee") || normalizedUrl.includes("bakery")) {
    businessName = "Craft Roast Coffee Bar";
    category = "Artisanal Coffee & Bakery";
    segment = "hospitality";
  } else if (normalizedUrl.includes("dental") || normalizedUrl.includes("clinic") || normalizedUrl.includes("dentist") || normalizedUrl.includes("medical")) {
    businessName = "Aurelia Family Dental Care";
    category = "Healthcare & Dental Clinic";
    segment = "medical";
  } else if (normalizedUrl.includes("gym") || normalizedUrl.includes("fit") || normalizedUrl.includes("yoga") || normalizedUrl.includes("crossfit")) {
    businessName = "Vanguard Fitness Club";
    category = "Boutique Fitness & Gyymnasium";
    segment = "wellness";
  } else if (normalizedUrl.includes("spa") || normalizedUrl.includes("salon") || normalizedUrl.includes("parlor") || normalizedUrl.includes("beauty")) {
    businessName = "Nirvana Wellness & Day Spa";
    category = "Beauty & Spa Services";
    segment = "consumer";
  } else if (normalizedUrl.includes("law") || normalizedUrl.includes("attorney") || normalizedUrl.includes("legal")) {
    businessName = "Sterling & Associates Law";
    category = "Legal Consultant Firm";
    segment = "professional";
  } else if (normalizedUrl.includes("repair") || normalizedUrl.includes("garage") || normalizedUrl.includes("auto")) {
    businessName = "Precision Auto Repair Workshop";
    category = "Automotive Services";
    segment = "retail";
  } else if (normalizedUrl.includes("boutique") || normalizedUrl.includes("store") || normalizedUrl.includes("shop") || normalizedUrl.includes("apparel")) {
    businessName = "Maison de Velvet Boutique";
    category = "Luxury Retail Fashion";
    segment = "retail";
  } else if (normalizedUrl.includes("pizza") || normalizedUrl.includes("rest") || normalizedUrl.includes("food") || normalizedUrl.includes("dining")) {
    businessName = "Verde Stone-Oven Pizzeria";
    category = "Fine Dining Restaurant";
    segment = "hospitality";
  } else {
    // Attempt to extract name from url domain
    try {
      const match = url.replace(/https?:\/\/(www\.)?/, '').split('.')[0];
      if (match && match.length > 2) {
        businessName = match.charAt(0).toUpperCase() + match.slice(1) + " Co.";
      }
    } catch (e) {}
  }

  const defaultReport = {
    business_name: businessName,
    url: url,
    classification: "GROWTH MODE",
    business_dna: {
      growth_hunger: 72,
      digital_maturity: 44,
      competition_pressure: 85,
      brand_trust: 68,
      adaptability: 55,
      customer_engagement: 38,
      market_visibility: 41,
      ai_explanation: `This business is an established player with strong legacy roots in the community. While brand trust remains solid, its market visibility index is struggling. Competitors are rapidly encroaching with modern visual systems and optimized Google Local listings. Its extremely low digital maturity creates severe leverage for modern sales representatives to offer immediate digital transformation strategies.`
    },
    extinction_risk: {
      percentage: 74,
      reasons: [
        "Inability to secure organic digital traffic against multi-location regional chains",
        "Legacy system lock-ins delaying website performance and responsiveness",
        "Negative review backlog of unanswered queries on Map directory profiles",
        "Sparse, uncoordinated social posting cycles with 0% audience interactions"
      ],
      timeline: {
        three_months: "A continued decline in search visibility will lead to a 10-15% drop in monthly telephone queries as rivals grab higher ranks.",
        six_months: "Customer erosion accelerates; organic customer acquisition costs spike by 30% due to total reliance on expensive paper circulars.",
        twelve_months: "The business enters severe survival mode; high competitor density and digital irrelevance forces staff downsizing."
      }
    },
    opportunity: {
      revenue_opportunity: "₹18,500/month",
      win_probability: 82,
      digital_transformation_potential: 88,
      sales_difficulty: "MEDIUM",
      decision_speed: "FAST",
      estimated_close_time: "5-7 Days",
      budget_potential: "MEDIUM",
      reasoning: "The stakeholder recognizes competitor advances and suffers from constant incoming sales anxiety. Providing a clear roadmap with zero complexity unlocks instant budget reserves."
    },
    competitor_intelligence: {
      competitor_density: "HIGH",
      digital_maturity_comparison: "BELOW_AVERAGE",
      visibility_gap: "This business is ranks on page 2 of local map indexes, while three immediate neighboring franchises hold page 1 priority.",
      review_management_gap: "Has over 40 reviews but zero responses. Neighbors have an automated review responder active on 95% of feedback loops.",
      seo_gap: "Search performance scores are hampered by a non-mobile friendly landing structure lacking metadata schema markup.",
      social_media_gap: "Instagram channel is stagnant since June 2024, whereas competitors run daily reels detailing behind-the-scenes staff highlights.",
      fastest_advantage_to_win: "Introduce the maps review automator and a responsive 4-scroll lightning landing page. This completely neutralizes local competitor map rankings within 14 business days."
    },
    blueprint: {
      owner_personality_profile: "Action-oriented and hands-on but heavily pressed for raw time. Dislikes tech-jargon overlay, favors bottom-line client flow results.",
      likely_priorities: [
        "Improving monthly booking / footfall volumes",
        "Stopping local competitor customer poaching",
        "Delegating website maintenance to a reliable service partner"
      ],
      likely_frustrations: [
        "Wasting funds on historical yellow-page or print advertising",
        "Receiving countless automated spam robocalls",
        "Having no simple way to manage the business while away"
      ],
      likely_objections: [
        "How much effort is required from my side?",
        "We have gotten along fine for ten years without software.",
        "Your pricing seems high compared to basic freelancers."
      ],
      communication_style: "Terse, direct, values bulletproof brevity over theoretical software architecture.",
      decision_making_style: "Intuitive but requires immediate emotional conviction before releasing payment.",
      best_sales_angle: "Frame the lack of review responses and local page-2 ranking as a visible leaky pipe draining current loyal footfall on their exact street.",
      avoid_talking_about: [
        "Drizzle ORM vs Prisma databases",
        "API rate limits and multi-region load balancers",
        "Vaporware futuristic features that take months to customize"
      ],
      mention_these_topics: [
        "Direct number of new potential client appointments lost",
        "Competitor review response metrics",
        "A zero-friction, completed blueprint ready to deploy on Monday"
      ],
      recommended_opening_line: `"Hi ${businessName} owner, I was analyzing Local Digital DNA metrics in your neighborhood and noticed three competitors who are actively intercepting your daily map traffic. Have you got 60 seconds?"`,
      recommended_follow_up_line: `"I drafted a complete visual mockup of how your page-1 map listing should look, with all 40 review backlogs fully automated. I can send the access link over WhatsApp right now."`,
      best_time_to_contact: "11:30 AM (Right after morning surge and before afternoon peak)",
      best_day_to_contact: "Tuesday or Thursday (Avoid hectic Mondays entirely)"
    },
    approach_matrix: {
      channels: [
        { channel: "Phone Call", success_probability: 88, response_speed: "SEC_REALTIME", personalization_potential: "HIGH", description: "Best for immediate cut-through. Leverages live tonal charisma." },
        { channel: "WhatsApp", success_probability: 72, response_speed: "FAST", personalization_potential: "VERY_HIGH", description: "Outstanding for sharing immediate visual mockups and proof points." },
        { channel: "Email/Form", success_probability: 45, response_speed: "MEDIUM", personalization_potential: "MEDIUM", description: "Useful as a formal follow-up to park the proposal and rate cards." },
        { channel: "Instagram DM", success_probability: 60, response_speed: "FAST", personalization_potential: "HIGH", description: "Highly interactive if the owner monitors media accounts personally." },
        { channel: "LinkedIn Message", success_probability: 30, response_speed: "SLOW", personalization_potential: "LOW", description: "Typically ignored unless targeting large professional B2B players." }
      ],
      recommended_primary_channel: "Phone Call",
      recommended_backup_channel: "WhatsApp",
      reasoning: "A quick 90-second phone pitch to secure interest, immediately followed by a premium WhatsApp PDF screenshot of their Digital Extinction risk graph creates the highest possible momentum."
    },
    future_simulator: {
      scenario_a: {
        visibility: 32,
        customer_growth: "-12% over 6 months",
        revenue_growth: "Stagnant/Declining",
        risk: 85,
        bulletpoints: [
          "Complete local search rankings loss as map listings drop lower in algorithm tiers",
          "Customer base greys out without fresh organic influx of young digital searchers",
          "Ongoing competitor ad campaigns actively siphon off remaining street foot traffic"
        ]
      },
      scenario_b: {
        visibility: 94,
        customer_growth: "+38% over 60 days",
        revenue_growth: "Dynamic upward trend",
        risk: 15,
        bulletpoints: [
          "Dominating page 1 of search index with automated active review responses",
          "High conversions from new lightning-fast mobile booking landing portal",
          "Zero customer friction unlocks consistent modern brand referrals"
        ]
      }
    },
    digital_twin: {
      current: {
        brand_visibility: 35,
        trust: 70,
        digital_presence: 25,
        growth_potential: 45,
        customer_loyalty: 80
      },
      future: {
        brand_visibility: 92,
        trust: 96,
        digital_presence: 88,
        growth_potential: 90,
        customer_loyalty: 95
      }
    }
  };

  if (!isAIEnabled()) {
    return defaultReport;
  }

  try {
    const prompt = `
      You are a world-class Business Intelligence Architect for a high-frequency startup intelligence platform like Palantir or Bloomberg Terminal.
      Analyze the physical/digital business specified by the URL: "${url}" and generate a highly rigorous, specific, and deep Business Intelligence Report.
      
      Evaluate the domain, keywords, or profile referenced in the URL:
      - Formulate a specific business identity (e.g. if the URL has 'bakery', diagnose it as a premium bakery, 'dental' as a dental clinic, etc.)
      - Write the analysis like an elite enterprise sales consultant. Avoid generic advice, use precise numbers, specific local competitive jargon, and rigorous timelines.
      
      Generate a thorough risk profile, revenue calculation, stakeholder blueprints and approach channels.

      Return the result as a strict, verified JSON object with exactly the following keys (no markdown comments, no formatting errors, no ellipses):
      
      {
        "business_name": "Calculated or extracted business name",
        "url": "${url}",
        "classification": "SURVIVAL MODE" | "GROWTH MODE" | "EXPANSION MODE" | "MARKET LEADER",
        "business_dna": {
          "growth_hunger": number (0-100),
          "digital_maturity": number (0-100),
          "competition_pressure": number (0-100),
          "brand_trust": number (0-100),
          "adaptability": number (0-100),
          "customer_engagement": number (0-100),
          "market_visibility": number (0-100),
          "ai_explanation": "Thorough professional consultation comment explaining these metrics"
        },
        "extinction_risk": {
          "percentage": number (0-100),
          "reasons": string[] (3-5 highly tailored risk points),
          "timeline": {
            "three_months": "Detailed forecast",
            "six_months": "Detailed forecast",
            "twelve_months": "Detailed forecast"
          }
        },
        "opportunity": {
          "revenue_opportunity": "Calculated potential monthly value, e.g. ₹25,000/month",
          "win_probability": number (0-100),
          "digital_transformation_potential": number (0-100),
          "sales_difficulty": "LOW" | "MEDIUM" | "HIGH",
          "decision_speed": "FAST" | "MEDIUM" | "SLOW",
          "estimated_close_time": "String estimate",
          "budget_potential": "LOW" | "MEDIUM" | "HIGH",
          "reasoning": "Thorough revenue logic text"
        },
        "competitor_intelligence": {
          "competitor_density": "LOW" | "MEDIUM" | "HIGH",
          "digital_maturity_comparison": "BELOW_AVERAGE" | "AVERAGE" | "ABOVE_AVERAGE",
          "visibility_gap": "SEO/Local index analysis",
          "review_management_gap": "Review response analysis",
          "seo_gap": "Technical SEO gap",
          "social_media_gap": "Social media engagement gap",
          "fastest_advantage_to_win": "Targeted immediate service to upsell"
        },
        "blueprint": {
          "owner_personality_profile": "Profile description",
          "likely_priorities": string[],
          "likely_frustrations": string[],
          "likely_objections": string[],
          "communication_style": "Style string",
          "decision_making_style": "Decision style description",
          "best_sales_angle": "Angle pitch description",
          "avoid_talking_about": string[],
          "mention_these_topics": string[],
          "recommended_opening_line": "Opening line string (word-for-word)",
          "recommended_follow_up_line": "Follow up line string (word-for-word)",
          "best_time_to_contact": "Time string",
          "best_day_to_contact": "Day string"
        },
        "approach_matrix": {
          "channels": [
            { "channel": "Phone Call", "success_probability": number, "response_speed": "SEC_REALTIME", "personalization_potential": "HIGH", "description": "String" },
            { "channel": "WhatsApp", "success_probability": number, "response_speed": "FAST", "personalization_potential": "VERY_HIGH", "description": "String" },
            { "channel": "Email/Form", "success_probability": number, "response_speed": "MEDIUM", "personalization_potential": "MEDIUM", "description": "String" },
            { "channel": "Instagram DM", "success_probability": number, "response_speed": "FAST", "personalization_potential": "HIGH", "description": "String" },
            { "channel": "LinkedIn Message", "success_probability": number, "response_speed": "SLOW", "personalization_potential": "LOW", "description": "String" }
          ],
          "recommended_primary_channel": "String channel",
          "recommended_backup_channel": "String channel",
          "reasoning": "Channel reasoning"
        },
        "future_simulator": {
          "scenario_a": {
            "visibility": number,
            "customer_growth": "String",
            "revenue_growth": "String",
            "risk": number,
            "bulletpoints": string[]
          },
          "scenario_b": {
            "visibility": number,
            "customer_growth": "String",
            "revenue_growth": "String",
            "risk": number,
            "bulletpoints": string[]
          }
        },
        "digital_twin": {
          "current": {
            "brand_visibility": number,
            "trust": number,
            "digital_presence": number,
            "growth_potential": number,
            "customer_loyalty": number
          },
          "future": {
            "brand_visibility": number,
            "trust": number,
            "digital_presence": number,
            "growth_potential": number,
            "customer_loyalty": number
          }
        }
      }
    `;

    const response = await callGeminiWithRetry(prompt, {
      responseMimeType: 'application/json'
    }, 'gemini-3.5-flash');

    return JSON.parse(response.text || '{}') || defaultReport;
  } catch (error) {
    console.error('Error in generateStrikeVisionReportAI:', error);
    return defaultReport;
  }
}

/**
 * Negotiation Room Roleplays: Chat response of customized stakeholder personas
 */
export async function generateStrikeVisionNegotiationChatAI(
  url: string,
  businessName: string,
  category: string,
  role: string, // 'Owner' | 'Manager' | 'Founder' | 'Marketing Head' | 'Operations Head' | 'Store Manager'
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<string> {
  if (!isAIEnabled()) {
    const lastUserMsg = [...history].reverse().find(m => m.role === 'user')?.content.toLowerCase() || '';
    if (lastUserMsg.includes('price') || lastUserMsg.includes('cost') || lastUserMsg.includes('fee')) {
      return `Look, as the ${role} of ${businessName}, cost is a critical barrier for me. We don't have infinite budget lying around for digital consulting. How can you justify this invoice before we see real customers?`;
    }
    if (lastUserMsg.includes('busy') || lastUserMsg.includes('time')) {
      return `We are currently dealing with a scheduling bottleneck inside our ${category} operations. Can we defer this discussion to next quarter?`;
    }
    return `Alright, you have my attention for 30 seconds. Explain precisely what your company can do to offset our competitive review leaks. Why you over a general agency?`;
  }

  try {
    const systemInstruction = `
      You are roleplaying as the ${role} of a business named "${businessName}", classified under the category "${category}".
      The business URL being discussed is "${url}".
      
      Your Persona:
      - You are tough, suspicious, highly practical, and protective of your business.
      - As the ${role}, you are constantly pitched by digital agencies and believe 90% of them are scammers or over-promisers.
      - You will raise objections about setups, timeline delays, budget allocation, lack of immediate ROI proof, and internal staff bandwidth limitations.
      - Do NOT act friendly unless the negotiator speaks clearly, presents precise local proof, establishes urgency, and demonstrates a transparent ROI roadmap.
      - Keep your reply realistic, professional but firm, and brief (2-3 sentences), mimicking a real business conversation. Do not include any metacommentary.
    `;

    const formattedContents = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: msg.content }]
    }));

    const response = await callGeminiWithRetry(formattedContents, {
      systemInstruction: systemInstruction
    }, 'gemini-3.5-flash');

    return response.text?.trim() || "And how does that benefit our bottom line right now?";
  } catch (error) {
    console.error('Error in generateStrikeVisionNegotiationChatAI:', error);
    return `As the ${role}, my main focus is on maintaining our current client list. Unless there's a clear return on work, we'll keep doing things our way.`;
  }
}

/**
 * Negotiation Room: Auditing and scoring negotiations
 */
export async function generateStrikeVisionNegotiationScoreAI(
  url: string,
  businessName: string,
  role: string,
  transcript: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<any> {
  const defaultScorecard = {
    trust_building_score: 48,
    objection_handling_score: 52,
    value_communication_score: 44,
    closing_ability_score: 40,
    confidence_score: 60,
    overall_readiness_score: 48,
    reality_check: 'You are pitch-muddling or spoke too vaguely. An experienced buyer/stakeholder would likely hang up or dismiss your consultation within the first 60 seconds.',
    should_call: false,
    verdict: 'Do Not Call Yet',
    critiques: [
      "Avoid launching into feature breakdowns right off the bat; lead by demonstrating visual proof of competitor organic displacement first.",
      "Spoke too passively — did not challenge the stakeholder's status quo with concrete competitor data."
    ],
    sentence_rewrites: [
      {
        original: "Hi check our software we can help you get more reviews",
        improved: "We ran a tactical blueprint for your street and noticed over 40 negative or unanswered reviews on your map listing. That gap is actively funneling customers to your immediate local competitors."
      }
    ]
  };

  if (!isAIEnabled()) {
    return defaultScorecard;
  }

  try {
    const transcriptText = transcript.map(t => `${t.role === 'user' ? 'Negotiator [You]' : `Stakeholder [${role}]`}: ${t.content}`).join('\n');
    
    const prompt = `
      You are a world-class negotiations trainer and enterprise sales auditing specialist. 
      Analyze this roleplay dialogue transcript between an AI sales agent ("Negotiator [You]") and the highly skeptical "${role}" of the business "${businessName}" (URL: ${url}).

      Transcript:
      ${transcriptText}

      Determine call alignment and objective rating. Be brutally honest, realistic, and highly critical. Do NOT inflate scores or reward confidence if the content was weak.

      Strict Rating Axes:
      1. Trust Building Score (0-100)
      2. Objection Handling Score (0-100)
      3. Value Communication Score (0-100)
      4. Closing Ability Score (0-100)
      5. Confidence Score (0-100)

      Overall Readiness Score is the direct weighted assessment.
      - Excellent pitch: 85–95
      - Very good pitch: 75–84
      - Average pitch: 60–74
      - Weak pitch: 40–59
      - Poor pitch: 20–39
      - Completely unprepared: 0–19

      Analyze the user ("Negotiator [You]") phrases carefully. Look for rambling, confusing descriptions, missing value propositions, or lack of business preparedness.

      Return the analysis as a strict JSON object with fields:
      - "trust_building_score": number
      - "objection_handling_score": number
      - "value_communication_score": number
      - "closing_ability_score": number
      - "confidence_score": number
      - "overall_readiness_score": number
      - "reality_check": string (Brutally honest response about live alignment. Make sure to call out precisely why they are not ready, or if they are genuinely ready.)
      - "should_call": boolean (false if they are unprepared, vague, or ramble; true if overall_readiness_score is >= 80)
      - "verdict": "Ready To Call" | "Needs More Practice" | "Do Not Call Yet" (Ready To Call: score >= 80; Needs More Practice: score 60-79; Do Not Call Yet: score < 60)
      - "critiques": string[] (3 direct, sharp constructive criticisms)
      - "sentence_rewrites": Array of { "original": string, "improved": string } representing EVERY statement spoken by the Negotiator/user in the transcript. Map user phrases to crisp, highly professional business developer alternatives.

      Do NOT output any markdown tags or comments outside the JSON block.
    `;

    const response = await callGeminiWithRetry(prompt, {
      responseMimeType: 'application/json'
    }, 'gemini-3.5-flash');

    const result = JSON.parse(response.text || '{}');
    return { ...defaultScorecard, ...result };
  } catch (error) {
    console.error('Error in generateStrikeVisionNegotiationScoreAI:', error);
    return defaultScorecard;
  }
}

/**
 * Generate highly personalized Lead Psychology & Outreach Intelligence Profile
 */
export async function generateLeadPsychologyProfileAI(lead: Lead): Promise<any> {
  const defaultProfile = {
    company_analysis: {
      name: lead.business_name,
      industry: lead.category,
      website: lead.has_website ? `${lead.business_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : 'No Website URL',
      team_size: lead.business_age_years > 5 ? '12-25 people' : '4-10 people',
      social_presence: lead.has_social_media ? 'Active on Facebook & Instagram; outdated listings.' : 'No social footprint located.',
      services: [`Local ${lead.category} services`, 'Immediate walk-in servicing', 'Regional delivery & scheduling'],
      products: ['Professional local service booking', 'General commercial solutions'],
      online_reputation: `Google score is excellent with ${lead.google_review_count || 12} reviews, but zero active review responses are causing low user interactivity indexes in ${lead.locality}.`,
      growth_signals: `Established business operating for ${lead.business_age_years} years in high competitor density area.`,
      competitors: [`Local Rival A`, `Local Rival B`, `Regional Category Provider`],
      market_positioning: 'Standard local player struggling with modern client acquisition automation and competitor maps cannibalization.',
      decision_maker: 'Managing Partner / General Owner',
      outreach_difficulty: lead.competitor_count_nearby > 10 ? 'High' : 'Medium',
      outreach_difficulty_reason: 'Highly busy with active customer inflow, receives daily generic digital SEO service cold pitches, very skeptical.',
      conversion_potential: lead.score > 75 ? 88 : (lead.score > 50 ? 68 : 38)
    },
    opportunity_analysis: {
      weak_website_areas: lead.has_website 
        ? ['Slow mobile load index in high LTE friction areas', 'No immediate call-to-action button above content fold', 'Outdated review integration widget']
        : ['Completely missing digital footprint', 'Losing 100% of organic Google Web referral clicks to rivals', 'No domain email authority active'],
      marketing_opportunities: ['Automated Google map listing review-boost campaign', 'Local review replies system deployment'],
      lead_generation_opportunities: ['Convert maps traffic into conversational WhatsApp leads', 'Add floating mobile-call widget'],
      conversion_issues: ['Zero feedback looping on critical organic customer review backlogs', 'Lack of social validation triggers'],
      branding_opportunities: ['Position as the primary trusted category leader in local sector', 'Clean up visual typography and review authority tags'],
      seo_opportunities: ['Optimize Google Maps tag rankings with dynamic keyword insertion', 'Re-index listing to rank with target location tags'],
      acquisition_gaps: ['Letting competitor review-replies capture local 3-pack listing search interest']
    },
    prospect_psychology: {
      core_cares: lead.category.toLowerCase().includes('restaurant') 
        ? ['Table utilization rates', 'Menu markup margins', 'Consistent local reservation flow', 'Five-star reviews']
        : ['Increasing appointment volumes', 'Higher average invoice numbers', 'Blocking local street rivals', 'Saving admin time'],
      likely_goals: ['Expand regional localized reach', 'Maximize team labor efficiency', 'Gain absolute online maps listing superiority'],
      frustrations: ['High marketing spend yielding near-zero traceable phone call metrics', 'Stated review backlog dragging search ranks down'],
      challenges: ['Fierce local competitors nearby eating up target maps rankings', 'Limited technical bandwidth and zero personal time'],
      losing_money_reasons: ['Losing immediate client search listings because maps reviews remain unanswered', 'Ignoring highly motivated warm referrals'],
      emotional_triggers: [
        { title: 'Revenue Growth', tag: 'Gain Potential', strategy: 'Demonstrate lost reservation pipeline values', description: 'Show directly how answering backlog reviews pulls in extra visitors instantly.' },
        { title: 'Reducing Costs', tag: 'Loss Aversion', strategy: 'Prevent customer leakage to regional rivals', description: 'Quantify competitor click-sharing to show budget bleed-out.' },
        { title: 'Brand Image', tag: 'Authority', strategy: 'Re-establish neighborhood category authority', description: 'Highlight their hard earned years in biz to show reputation value.' }
      ],
      value_proposition_resonance: `Stop competitor map displacement. Fully automate review response and SEO maintenance so your team is focused on operations.`,
      communication_style: 'Blunt, direct, zero buzzwords, immediate ROI quantification.',
      what_trigger_reply: 'Authentic observations about specific local street competitor reviews causing their organic traffic loss.',
      what_trigger_ignore: 'Any sentence containing words like "We are an award-winning digital SEO agency in Bangalore with synergistic AI solutions."',
      radar_metrics: {
        trust_level: 35,
        interest_level: lead.score > 70 ? 75 : 50,
        buying_intent: lead.score > 75 ? 80 : 45,
        pain_intensity: lead.score > 75 ? 85 : 55,
        urgency: lead.score > 75 ? 82 : 40,
        openness_to_change: 60
      }
    },
    outreach_studio: {
      subject_lines: [
        { type: 'Curiosity-Based', text: `Found something interesting on the ${lead.business_name} Google Listing`, why: 'High curiosity, sounds like an authentic user pointing out something critical.', tag: 'Curiosity' },
        { type: 'Personalized', text: `Quick observation on your ${lead.category} traffic in ${lead.locality}`, why: 'Highly direct, relevant, and hyper-targeted which triggers high open rates.', tag: 'Personalization' },
        { type: 'Problem-Based', text: `Unanswered reviews hurting ${lead.business_name} search positioning?`, why: 'Addresses prime pain points and calls out the exact business by name.', tag: 'Loss Aversion' },
        { type: 'ROI-Based', text: `Recovering some of the customers ${lead.business_name} is losing to competitors`, why: 'High incentive and immediately signals commercial value creation opportunities.', tag: 'Authority' },
        { type: 'Direct', text: `Is the head of outreach at ${lead.business_name} open for a quick idea?`, why: 'Direct role designation that secures rapid routing to final决策者.', tag: 'Specificity' }
      ],
      email_openers: [
        { type: 'Context Trigger', text: `I was searching for top-rated ${lead.category} services in ${lead.locality} and noticed your Google Business Profile has around ${lead.google_review_count || 12} reviews...`, why: 'Sounds non-automated, extremely localized, establishing direct commercial connection.', tag: 'Personalization' },
        { type: 'Pain Trigger', text: `I noticed your maps listing has some unanswered customer inquiries, which actually signals Google to drop ${lead.business_name} below surrounding competitor listings...`, why: 'Highlights an operational issue immediately, establishing analytical authority.', tag: 'Loss Aversion' }
      ],
      cold_emails: [
        {
          subject: 'Quick question about the Google Maps traffic for your location',
          body: `Hi,\n\nI was looking at the Google listing for ${lead.business_name} in ${lead.locality}. You have a great overall rating, but I noticed over ${lead.google_review_count ? Math.round(lead.google_review_count * 0.4) : 'several'} key reviews and questions have spent weeks unanswered.\n\nHere is why this is critical: Google's latest local core search update directly penalizes profiles with inactive response times. It is actively funneling nearby customers seeking ${lead.category} options directly to your competitors on the local maps 3-pack.\n\nWe built an automated system that handles continuous organic review replies and maintains target local keyword seo rankings so you don't lose these calls. Are you open for a quick 3-minute concept showcase this Tuesday at 10 AM?\n\nBest,\n[Your Name]`,
          why: 'Clear value metrics, highlights real penalty risks, low cognitive friction for CTA.',
          tag: 'Loss Aversion'
        }
      ],
      whatsapp_messages: [
        {
          text: `Hi! I noticed your listing for ${lead.business_name} which represents some unanswered reviews online. If we clear that backlog today, we can retrieve up to 25% of competitor search clicks in ${lead.locality}. Are you the owner?`,
          why: 'Extremely quick to read on mobile screen, highly personalized, ending with direct simple question.',
          tag: 'Specificity'
        }
      ],
      linkedin_messages: [
        {
          type: 'Connection',
          text: `Hi! I saw your work managing ${lead.business_name}. I analyzed local ${lead.category} competition density on your street this morning and noticed a small organic maps advantage you could easily deploy. Let's connect!`,
          why: 'Value first, zero pressure network building template.',
          tag: 'Curiprocity'
        }
      ],
      follow_up_messages: [
        {
          text: `Hi, wanted to drop a quick update. Your competitor down the road just answered 15 review queries and gained a maps rank boost, displacing your listing by another position. It takes under 3 minutes to reverse this. Let me know if we can show you how.`,
          why: 'Urgency trigger using actual localized event cues.',
          tag: 'Loss Aversion'
        }
      ]
    }
  };

  if (!isAIEnabled()) {
    return defaultProfile;
  }

  try {
    const prompt = `
      You are an elite B2B Sales Psychologist, Conversion Specialist, and Copywriter.
      Analyze this lead and generate a highly personalized, deep psychological analysis and customized outreach command center profile.
      
      Lead Profile:
      - Name: ${lead.business_name}
      - Category: ${lead.category}
      - Location: ${lead.locality}, ${lead.city}
      - Has Website: ${lead.has_website ? 'Yes' : 'No'}
      - Google Reviews: ${lead.google_review_count || 0} reviews, replies: ${lead.google_review_responses || 0}
      - Competitors Nearby: ${lead.competitor_count_nearby}
      - Age of Business: ${lead.business_age_years} years
      - Current Score: ${lead.score}/100

      Using this specific data, synthesize custom answers tailored precisely to this business's situation. Do NOT give generic templates.
      Explain specific local dynamics, potential street competitors, exact website/review issues, and write highly persuasive outreach messages.
      
      Return a strict JSON object with exactly this format:
      {
        "company_analysis": {
          "name": "string",
          "industry": "string",
          "website": "string",
          "team_size": "string (estimated size, e.g., 5-10 people)",
          "social_presence": "string (estimated social foot-print based on data)",
          "services": ["string (3 actual commercial services they offer)"],
          "products": ["string (2 typical products)"],
          "online_reputation": "string (a precise synthesis of their reviews and responsiveness)",
          "growth_signals": "string (analytical growth cues based on category/age)",
          "competitors": ["string (3 realistic local competitor business names in Hyderabad/Mumbai/Bangalore based on their city)"],
          "market_positioning": "string (detailed positioning analysis)",
          "decision_maker": "string (likely job title of the decision maker)",
          "outreach_difficulty": "High" | "Medium" | "Low",
          "outreach_difficulty_reason": "string",
          "conversion_potential": number (0 to 100)
        },
        "opportunity_analysis": {
          "weak_website_areas": ["string (3 specific weaknesses based on has_website)"],
          "marketing_opportunities": ["string (2 specific items)"],
          "lead_generation_opportunities": ["string (2 items)"],
          "conversion_issues": ["string (2 target issues)"],
          "branding_opportunities": ["string (2 items)"],
          "seo_opportunities": ["string (2 maps keyword search optimization ideas)"],
          "acquisition_gaps": ["string (2 localized customer journey gaps)"]
        },
        "prospect_psychology": {
          "core_cares": ["string (3 specific daily worries for this business category, e.g. table turnaround times for restaurant, invoice value for mechanic, etc.)"],
          "likely_goals": ["string (3 specific business goals)"],
          "frustrations": ["string (3 standard challenges they face daily)"],
          "challenges": ["string (3 operational friction lines)"],
          "losing_money_reasons": ["string (3 quantified digital gaps causing them to bleed revenue)"],
          "emotional_triggers": [
            { "title": "string (e.g. Revenue Growth)", "tag": "string (e.g. Gain Potential)", "strategy": "string", "description": "string" },
            { "title": "string (e.g. Saving Time)", "tag": "string (e.g. Efficiency)", "strategy": "string", "description": "string" },
            { "title": "string (e.g. Competitive Advantage)", "tag": "string (e.g. Rivalry)", "strategy": "string", "description": "string" }
          ],
          "value_proposition_resonance": "string (specific sentence summarizing the pitch hook)",
          "communication_style": "string (how to speak to them)",
          "what_trigger_reply": "string (detailed explanation of what triggers response)",
          "what_trigger_ignore": "string (what makes them ignore completely)",
          "radar_metrics": {
            "trust_level": number (0-100),
            "interest_level": number (0-100),
            "buying_intent": number (0-100),
            "pain_intensity": number (0-100),
            "urgency": number (0-100),
            "openness_to_change": number (0-100)
          }
        },
        "outreach_studio": {
          "subject_lines": [
            { "type": "Curiosity-Based" | "Personalized" | "Problem-Based" | "ROI-Based" | "Direct", "text": "string", "why": "string", "tag": "string (e.g. Curiosity/Loss Aversion)" }
          ],
          "email_openers": [
            { "type": "string", "text": "string", "why": "string", "tag": "string" }
          ],
          "cold_emails": [
            { "subject": "string", "body": "string", "why": "string", "tag": "string" }
          ],
          "whatsapp_messages": [
            { "text": "string", "why": "string", "tag": "string" }
          ],
          "linkedin_messages": [
            { "type": "Connection" | "First Pitch" | "Follow-Up" | "Re-Engagement", "text": "string", "why": "string", "tag": "string" }
          ],
          "follow_up_messages": [
            { "text": "string", "why": "string", "tag": "string" }
          ]
        }
      }

      Do NOT output any markdown tags, commentary, or backticks outside the raw JSON object.
    `;

    const response = await callGeminiWithRetry(prompt, {
      responseMimeType: 'application/json'
    }, 'gemini-3.5-flash');

    const result = JSON.parse(response.text || '{}');
    return { ...defaultProfile, ...result };
  } catch (error) {
    console.error('Error generating Lead Psychology profile AI:', error);
    return defaultProfile;
  }
}

/**
 * Handle high-fidelity multi-turn training conversations.
 * AI acts as the selected prospect and updates emotional states dynamically.
 */
export async function generatePsychologyTrainingChatAI(
  lead: Lead,
  role: string,
  initialEmotion: string,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<any> {
  const defaultReply = {
    reply: "I am really busy. If this is another SEO call, we are all good. Can you explain why you are contacting me specifically?",
    updatedEmotion: "Skeptical"
  };

  if (!isAIEnabled()) {
    const lastMsg = history[history.length - 1]?.content?.toLowerCase() || '';
    let updatedEmotion = initialEmotion;
    let reply = "Look, we get ten calls a day like this. What makes your offer any different from standard agencies?";
    if (lastMsg.includes('free') || lastMsg.includes('audit')) {
      reply = "A free audit? Well, I suppose we could look at it, but only if it takes less than two minutes. Email it over.";
      updatedEmotion = "Curious";
    } else if (lastMsg.includes('price') || lastMsg.includes('cost')) {
      reply = "That sounds expensive. We actually cut our marketing budget last quarter because we saw zero return.";
      updatedEmotion = "Price Sensitive";
    }
    return { reply, updatedEmotion };
  }

  try {
    const formattedContents = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: msg.content }]
    }));

    const systemInstruction = `
      You are highly realistic and realistic cold outreach roleplay engine.
      You are roleplaying as the "${role}" of "${lead.business_name}", located in ${lead.locality}, ${lead.city}.
      This is a Cold Outreach dialogue simulation. 
      Your current emotional state is: "${initialEmotion}".
      
      Persona Guidelines:
      - Be extremely realistic, combative, busy, and defensive. Small business decision makers hate cold calls and outreach.
      - If the salesperson is generic, copy-pastes scripts, uses buzzwords, talks too much, or doesn't address localized facts immediately, you must act annoyed/dismissive.
      - If they name-drop local rivals, cite specific review response percentages, website load errors, or mention a clear customer retention leakage, you should change your emotion to "Curious" or "Interested" and probe and challenge them.
      - Response lengths should be short and snappy (1-3 conversational, direct sentences), exactly how a human behaves on a live channel. DO NOT give long essays.
      
      In your output, you MUST return a valid JSON object with:
      - "reply": string (your next response as the prospect, remaining strictly in character)
      - "updatedEmotion": string (Your new emotional state based on their communication quality. Must be one of: "Curious" | "Neutral" | "Angry" | "Busy" | "Skeptical" | "Price Sensitive"| "Interested" | "Not Interested")

      Do NOT break character or include any notes/commentary outside of the raw JSON block.
    `;

    const response = await callGeminiWithRetry(formattedContents, {
      systemInstruction: systemInstruction,
      responseMimeType: 'application/json'
    }, 'gemini-3.5-flash');

    const result = JSON.parse(response.text || '{}');
    return { ...defaultReply, ...result };
  } catch (error) {
    console.error('Error generated in psychology training chat AI:', error);
    return defaultReply;
  }
}

/**
 * Brutally honest scorecard audits for training sessions.
 */
export async function auditPsychologyTrainingSessionAI(
  lead: Lead,
  role: string,
  sessionHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<any> {
  const defaultAudit = {
    overall_score: 45,
    conversion_prob: 20,
    confidence_score: 60,
    clarity_score: 50,
    objection_handling_score: 40,
    closing_score: 35,
    strong_points: ["Spoke confidentially to introduce yourself"],
    weak_points: ["Rambled too long in the opening, sounded generic and salesy, didn't anchor concrete local metrics."],
    missed_ops: ["Failed to contrast competitor's search ranking counts in Hyderabad area."],
    better_responses: [
      { original: "Hi we are an AI agency with a review reply software that leverages optimization models.", improved: "Hi I noticed on Google Maps that you have over 20 unanswered critical customer reviews which is lowering your listing index ranking on your street." }
    ],
    psych_mistakes: ["Used too many self-centered tech-buzzwords instead of speaking about customer acquisition leakages directly."],
    objection_handling_quality: "Average to Poor. Accepted the 'too expensive' excuse too quick without anchoring ROI values first.",
    closing_effectiveness: "Weak. Failed to define a crisp next-action appointment, leading to a dead-end 'send detailed email' stall.",
    reality_check: "Your pitch is confusing, rambles, and lacks a localized value hook. An experienced buyer would have dismissed or hung up on you in under 45 seconds.",
    should_call: false,
    verdict: "Do Not Call Yet"
  };

  if (!isAIEnabled()) {
    return defaultAudit;
  }

  try {
    const transcriptText = sessionHistory.map(m => `${m.role === 'user' ? 'Rep' : 'Prospect'}: ${m.content}`).join('\n');
    const prompt = `
      You are a brutally honest, veteran sales director and behavioral coach.
      Examine this roleplay training simulation transcript between a sales Representative ("Rep") and the "${role}" of "${lead.business_name}".
      
      Transcript:
      ${transcriptText}

      Please perform a highly detailed, extremely realistic, and critical audit of the representative's performance. 
      Do NOT reward average performance. Average work is a failing score. A score above 80 must represent an outstanding, highly customized client-centric conversational pitch.
      
      Rate on these direct cold-outreach competency axes (0 to 100):
      - Confidence Tone
      - Message Clarity
      - Objection Handling
      - Closing Bookings Ability
      - Overall Score
      
      Identify precise behavioral, copywriting, or sales strategy errors. Focus on how well they avoided salesy buzzwords, handled dynamic hesitations, anchored high local contrast, and drove towards a clear next action.
      
      Your output must be a strict JSON object with this format:
      {
        "overall_score": number,
        "conversion_prob": number (estimated conversion/agree-to-meeting probability 0-100),
        "confidence_score": number,
        "clarity_score": number,
        "objection_handling_score": number,
        "closing_score": number,
        "strong_points": ["string (only what they did exceptionally well, be highly critical)"],
        "weak_points": ["string (detailed failure lines)"],
        "missed_ops": ["string (specific custom opportunities they ignored from the business profile)"],
        "better_responses": [
          { "original": "string (their weak/rambling statement)", "improved": "string (crisp, persuasive, highly customized professional cold-calling alternative)" }
        ],
        "psych_mistakes": ["string (psychological cues they got wrong, e.g., breaking rapport, passive posture)"],
        "objection_handling_quality": "string (a brutally honest critical overview of how they tackled friction)",
        "closing_effectiveness": "string (detailed audit of how they framed the meeting booking CTA)",
        "reality_check": "string (a 2-3 sentence brutally honest reality check on their market readiness)",
        "should_call": boolean (true if overall_score is >= 80, false otherwise),
        "verdict": "Ready To Call" | "Needs More Practice" | "Do Not Call Yet" (Ready To Call: score >= 80; Needs More Practice: score 60-79; Do Not Call Yet: score < 60)
      }

      Do NOT output any markdown blocks, comments, or backticks outside the raw JSON object.
    `;

    const response = await callGeminiWithRetry(prompt, {
      responseMimeType: 'application/json'
    }, 'gemini-3.5-flash');

    const result = JSON.parse(response.text || '{}');
    return { ...defaultAudit, ...result };
  } catch (error) {
    console.error('Error generated in auditing psychology training session AI:', error);
    return defaultAudit;
  }
}


