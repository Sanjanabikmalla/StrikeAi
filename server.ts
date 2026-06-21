import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDB, saveDB, calculateScore, DBState } from './server/db';
import {
  generatePressureSignalAI,
  generateOutreachAI,
  generatePreCallBriefingAI,
  generateCopilotChatAI,
  generateCopilotScoreAI,
  generateStrikeVisionReportAI,
  generateStrikeVisionNegotiationChatAI,
  generateStrikeVisionNegotiationScoreAI,
  generateLeadPsychologyProfileAI,
  generatePsychologyTrainingChatAI,
  auditPsychologyTrainingSessionAI
} from './server/gemini';
import { User, Lead, SavedList, ListItem, ScoringConfig } from './src/types';

// Simple user-id header verification middleware
const getUserId = (req: express.Request): string => {
  return (req.headers['x-user-id'] as string) || 'usr_demo';
};

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Initializing stateful DB
  const dbState = getDB();

  // Helper to re-evaluate scoring across the system
  function reevaluateAllScores(state: DBState) {
    state.leads = state.leads.map(lead => {
      const breakdown = calculateScore(lead, state.scoringConfig);
      const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
      let strike_timing: 'NOW' | 'SOON' | 'WAIT' = 'WAIT';
      if (score >= 75) strike_timing = 'NOW';
      else if (score >= 50) strike_timing = 'SOON';

      return {
        ...lead,
        score,
        score_breakdown: breakdown,
        strike_timing
      };
    });
    saveDB(state);
  }

  // AUTH API
  app.post('/api/auth/signup', (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const state = getDB();
    const exists = state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const newUser: User = {
      id: `usr_${Math.random().toString(36).substr(2, 9)}`,
      email,
      password_hash: password, // Store in plaintext for this hackathon speed
      name,
      role: 'user',
      created_at: new Date().toISOString()
    };

    state.users.push(newUser);
    saveDB(state);
    res.json({ message: 'Signup successful!', user: newUser });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const state = getDB();
    const user = state.users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password_hash === password
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({ message: 'Login successful!', user });
  });

  // LEADS SEARCH & ENDPOINTS
  app.get('/api/leads/search', (req, res) => {
    const { category, city, sort, order, strikeTiming } = req.query;
    const state = getDB();

    let results = [...state.leads];

    if (category && category !== 'All') {
      results = results.filter(l => l.category.toLowerCase() === (category as string).toLowerCase());
    }
    if (city && city !== 'All') {
      results = results.filter(l => l.city.toLowerCase() === (city as string).toLowerCase());
    }
    if (strikeTiming && strikeTiming !== 'All') {
      results = results.filter(l => l.strike_timing === strikeTiming);
    }

    // Sort engine
    if (sort) {
      const field = sort as string;
      const isAsc = order === 'asc';
      results.sort((a, b) => {
        let valA = a[field as keyof Lead];
        let valB = b[field as keyof Lead];

        if (typeof valA === 'string') {
          return isAsc ? valA.localeCompare(valB as string) : (valB as string).localeCompare(valA);
        }
        if (typeof valA === 'number') {
          return isAsc ? valA - (valB as number) : (valB as number) - valA;
        }
        return 0;
      });
    } else {
      // Default: sort by high strike score descending
      results.sort((a, b) => b.score - a.score);
    }

    res.json(results);
  });

  app.get('/api/leads/:id', (req, res) => {
    const state = getDB();
    const lead = state.leads.find(l => l.id === req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    res.json(lead);
  });

  app.post('/api/leads', (req, res) => {
    const state = getDB();
    const newLeadData = req.body;

    const breakdown = calculateScore(newLeadData, state.scoringConfig);
    const score = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    let strike_timing: 'NOW' | 'SOON' | 'WAIT' = 'WAIT';
    if (score >= 75) strike_timing = 'NOW';
    else if (score >= 50) strike_timing = 'SOON';

    const newLead: Lead = {
      id: `lead_custom_${Date.now()}`,
      business_name: newLeadData.business_name || 'Generic Business',
      category: newLeadData.category || 'Retail',
      city: newLeadData.city || 'Hyderabad',
      locality: newLeadData.locality || 'General Locality',
      phone: newLeadData.phone || '',
      email: newLeadData.email || '',
      has_website: !!newLeadData.has_website,
      has_social_media: !!newLeadData.has_social_media,
      business_age_years: Number(newLeadData.business_age_years) || 1.0,
      google_review_count: Number(newLeadData.google_review_count) || 0,
      google_review_responses: Number(newLeadData.google_review_responses) || 0,
      competitor_count_nearby: Number(newLeadData.competitor_count_nearby) || 0,
      score,
      score_breakdown: breakdown,
      strike_timing,
      pressure_signal: newLeadData.pressure_signal || 'Evaluating pressure signals...',
      created_at: new Date().toISOString()
    };

    state.leads.unshift(newLead);
    saveDB(state);
    res.json(newLead);
  });

  app.put('/api/leads/:id', (req, res) => {
    const state = getDB();
    const idx = state.leads.findIndex(l => l.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    const currentLead = state.leads[idx];
    const updatedData = { ...currentLead, ...req.body };

    const breakdown = calculateScore(updatedData, state.scoringConfig);
    const score = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    let strike_timing: 'NOW' | 'SOON' | 'WAIT' = 'WAIT';
    if (score >= 75) strike_timing = 'NOW';
    else if (score >= 50) strike_timing = 'SOON';

    state.leads[idx] = {
      ...updatedData,
      score,
      score_breakdown: breakdown,
      strike_timing
    };

    saveDB(state);
    res.json(state.leads[idx]);
  });

  app.delete('/api/leads/:id', (req, res) => {
    const state = getDB();
    const filtered = state.leads.filter(l => l.id !== req.params.id);
    if (filtered.length === state.leads.length) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    state.leads = filtered;
    saveDB(state);
    res.json({ success: true, message: 'Lead deleted successfully' });
  });

  // SAVED LISTS
  app.get('/api/lists', (req, res) => {
    const userId = getUserId(req);
    const state = getDB();
    const userLists = state.lists.filter(l => l.user_id === userId);
    res.json(userLists);
  });

  app.post('/api/lists', (req, res) => {
    const userId = getUserId(req);
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'List name is required.' });
    }

    const state = getDB();
    const newList: SavedList = {
      id: `lst_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      name,
      created_at: new Date().toISOString()
    };

    state.lists.push(newList);
    saveDB(state);
    res.json(newList);
  });

  app.get('/api/lists/:id', (req, res) => {
    const state = getDB();
    const list = state.lists.find(l => l.id === req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found.' });

    // Find all items on this list, and attach full Lead information
    const items = state.listItems.filter(item => item.list_id === list.id);
    const joinedItems = items.map(item => {
      const lead = state.leads.find(l => l.id === item.lead_id);
      
      // Duplicate detection across lists
      const isDuplicate = state.listItems.some(
        li => li.lead_id === item.lead_id && li.list_id !== list.id
      );

      return {
        ...item,
        isDuplicate, // Used for the ⚠ duplicate warning badge in UI
        lead
      };
    });

    res.json({
      ...list,
      items: joinedItems
    });
  });

  app.post('/api/lists/:id/items', (req, res) => {
    const listId = req.params.id;
    const { leadId } = req.body;

    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID is required.' });
    }

    const state = getDB();
    // Validate list exists
    const list = state.lists.find(l => l.id === listId);
    if (!list) return res.status(404).json({ error: 'List not found.' });

    // Check if lead already on THIS list
    const hasItem = state.listItems.find(item => item.list_id === listId && item.lead_id === leadId);
    if (hasItem) {
      return res.status(400).json({ error: 'Lead is already in this list.' });
    }

    const newItem: ListItem = {
      id: `li_${Math.random().toString(36).substr(2, 9)}`,
      list_id: listId,
      lead_id: leadId,
      status: 'New',
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    state.listItems.push(newItem);
    saveDB(state);

    res.json(newItem);
  });

  app.put('/api/list-items/:id', (req, res) => {
    const { status, notes } = req.body;
    const state = getDB();
    const idx = state.listItems.findIndex(item => item.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'List item not found.' });
    }

    const item = state.listItems[idx];
    if (status) item.status = status;
    if (notes !== undefined) item.notes = notes;
    item.updated_at = new Date().toISOString();

    state.listItems[idx] = item;
    saveDB(state);
    res.json(item);
  });

  // Bulk CSV Export
  app.get('/api/lists/:id/export', (req, res) => {
    const state = getDB();
    const list = state.lists.find(l => l.id === req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found' });

    const items = state.listItems.filter(item => item.list_id === list.id);
    const rows = [
      ['Business Name', 'Category', 'City', 'Locality', 'Phone', 'Email', 'Strike Score', 'Status', 'Notes']
    ];

    for (const item of items) {
      const lead = state.leads.find(l => l.id === item.lead_id);
      if (lead) {
        rows.push([
          lead.business_name || '',
          lead.category || '',
          lead.city || '',
          lead.locality || '',
          lead.phone || '',
          lead.email || '',
          (lead.score || 0).toString(),
          item.status || 'New',
          (item.notes || '').replace(/"/g, '""')
        ]);
      }
    }

    const csvContent = rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=list_${list.name.replace(/\s+/g, '_')}.csv`);
    res.send(csvContent);
  });

  // GEMINI AI ENDPOINTS
  app.post('/api/ai/pressure', async (req, res) => {
    const { leadId } = req.body;
    const state = getDB();
    const lead = state.leads.find(l => l.id === leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });

    const pressureSignal = await generatePressureSignalAI(lead);
    
    // Save generated signal into lead profile!
    const idx = state.leads.findIndex(l => l.id === leadId);
    state.leads[idx].pressure_signal = pressureSignal;
    saveDB(state);

    res.json({ pressure_signal: pressureSignal });
  });

  app.post('/api/ai/outreach', async (req, res) => {
    const { leadId } = req.body;
    const state = getDB();
    const lead = state.leads.find(l => l.id === leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });

    const outreach = await generateOutreachAI(lead);
    res.json(outreach);
  });

  app.post('/api/ai/copilot/briefing', async (req, res) => {
    const { leadId } = req.body;
    const state = getDB();
    const lead = state.leads.find(l => l.id === leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });

    const briefing = await generatePreCallBriefingAI(lead);
    res.json({ briefing });
  });

  app.post('/api/ai/copilot/chat', async (req, res) => {
    const { leadId, history } = req.body;
    const state = getDB();
    const lead = state.leads.find(l => l.id === leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });

    const reply = await generateCopilotChatAI(lead, history || []);
    res.json({ reply });
  });

  app.post('/api/ai/copilot/score', async (req, res) => {
    const userId = getUserId(req);
    const { leadId, transcript } = req.body;
    const state = getDB();
    const lead = state.leads.find(l => l.id === leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });

    const result = await generateCopilotScoreAI(lead, transcript || []);
    
    // Store Copilot session history
    const newSession = {
      id: `session_${Date.now()}`,
      user_id: userId,
      lead_id: leadId,
      transcript: transcript || [],
      readiness_score: result.readiness_score || 48,
      reality_check: result.reality_check || '',
      should_call: result.should_call !== undefined ? result.should_call : false,
      verdict: result.verdict || 'Do Not Call Yet',
      sentence_rewrites: result.sentence_rewrites || [],
      feedback: {
        strong_points: result.strong_points || [],
        weak_points: result.weak_points || [],
        missed_points: result.missed_points || [],
        tips: result.tips || [],
        reality_check: result.reality_check || '',
        should_call: result.should_call !== undefined ? result.should_call : false,
        verdict: result.verdict || 'Do Not Call Yet',
        sentence_rewrites: result.sentence_rewrites || []
      },
      created_at: new Date().toISOString()
    };
    
    state.copilotSessions.push(newSession);
    saveDB(state);

    res.json(newSession);
  });

  // STRIKEVISION ENDPOINTS
  app.post('/api/ai/strikevision/analyze', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL parameter is required.' });
      }
      const report = await generateStrikeVisionReportAI(url);
      res.json(report);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || 'Failed to analyze url with StrikeVision.' });
    }
  });

  app.post('/api/ai/strikevision/chat', async (req, res) => {
    try {
      const { url, businessName, category, role, history } = req.body;
      const reply = await generateStrikeVisionNegotiationChatAI(url, businessName, category, role, history || []);
      res.json({ reply });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || 'Negotiation room sync error.' });
    }
  });

  app.post('/api/ai/strikevision/score', async (req, res) => {
    try {
      const { url, businessName, role, transcript } = req.body;
      const scorecard = await generateStrikeVisionNegotiationScoreAI(url, businessName, role, transcript || []);
      res.json(scorecard);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || 'Failed to compile negotiation audit.' });
    }
  });

  // LEAD PSYCHOLOGY & OUTREACH INTELLIGENCE COMMAND CENTER ENDPOINTS
  app.post('/api/ai/psychology/analyze', async (req, res) => {
    try {
      const { leadId } = req.body;
      const state = getDB();
      const lead = state.leads.find(l => l.id === leadId);
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found in databases.' });
      }
      const data = await generateLeadPsychologyProfileAI(lead);
      res.json(data);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || 'Failed to construct dynamic prospect psychometric profiles.' });
    }
  });

  app.post('/api/ai/psychology/chat', async (req, res) => {
    try {
      const { leadId, role, initialEmotion, history } = req.body;
      const state = getDB();
      const lead = state.leads.find(l => l.id === leadId);
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found.' });
      }
      const chatResponse = await generatePsychologyTrainingChatAI(lead, role, initialEmotion, history || []);
      res.json(chatResponse);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || 'Error driving premium roleplay simulation.' });
    }
  });

  app.post('/api/ai/psychology/score', async (req, res) => {
    try {
      const { leadId, role, history } = req.body;
      const state = getDB();
      const lead = state.leads.find(l => l.id === leadId);
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found.' });
      }
      const auditResult = await auditPsychologyTrainingSessionAI(lead, role, history || []);
      res.json(auditResult);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || 'Failed to compile training session scorecard.' });
    }
  });

  // ADMIN ENDPOINTS
  app.get('/api/admin/users', (req, res) => {
    const state = getDB();
    res.json(state.users);
  });

  app.put('/api/admin/users/:id', (req, res) => {
    const { role } = req.body;
    const state = getDB();
    const idx = state.users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found.' });

    if (role) state.users[idx].role = role;
    saveDB(state);
    res.json(state.users[idx]);
  });

  app.get('/api/admin/scoring', (req, res) => {
    const state = getDB();
    res.json(state.scoringConfig);
  });

  app.put('/api/admin/scoring', (req, res) => {
    const newWeights = req.body as ScoringConfig[];
    if (!Array.isArray(newWeights)) {
      return res.status(400).json({ error: 'Scoring config must be an array.' });
    }

    const state = getDB();
    state.scoringConfig = newWeights;
    reevaluateAllScores(state);

    res.json({ message: 'Scoring weights updated & system-wide leads re-calculated!', config: state.scoringConfig });
  });

  app.get('/api/admin/notifications', (req, res) => {
    const state = getDB();
    res.json(state.notificationLog);
  });

  app.post('/api/notifications/send', (req, res) => {
    const { userId, channel, message } = req.body;
    const state = getDB();

    const newLog = {
      id: `notif_${Date.now()}`,
      user_id: userId || 'usr_demo',
      channel: channel || 'email',
      message: message || 'Urgent StrikeAI System Update',
      status: Math.random() > 0.1 ? ('delivered' as const) : ('failed' as const),
      created_at: new Date().toISOString()
    };

    state.notificationLog.unshift(newLog);
    saveDB(state);
    res.json(newLog);
  });

  // NOTIFICATION UTILITIES
  app.post('/api/notify/email', (req, res) => {
    const { email, message } = req.body;
    const state = getDB();
    
    const newLog = {
      id: `notif_email_${Date.now()}`,
      user_id: 'usr_demo',
      channel: 'email' as const,
      message: `Triggered Direct Email to ${email}: "${message}"`,
      status: 'delivered' as const,
      created_at: new Date().toISOString()
    };

    state.notificationLog.unshift(newLog);
    saveDB(state);
    res.json({ success: true, log: newLog });
  });

  app.post('/api/notify/telegram', (req, res) => {
    const { message } = req.body;
    const state = getDB();

    const newLog = {
      id: `notif_tele_${Date.now()}`,
      user_id: 'usr_demo',
      channel: 'telegram' as const,
      message: `Triggered Telegram TelegramBot dispatch: "${message}"`,
      status: 'delivered' as const,
      created_at: new Date().toISOString()
    };

    state.notificationLog.unshift(newLog);
    saveDB(state);
    res.json({ success: true, log: newLog });
  });

  // KPI STATS API FOR REPORTING DASHBOARD
  app.get('/api/dashboard/stats', (req, res) => {
    const state = getDB();
    const userId = getUserId(req);

    const totalLeads = state.leads.length;
    const userListsCount = state.lists.filter(l => l.user_id === userId).length;
    
    // Find leads contacted (status in listItems)
    const listItems = state.listItems;
    const uniqueContacted = new Set(
      listItems
        .filter(item => item.status !== 'New')
        .map(item => item.lead_id)
    );
    const leadsContactedCount = uniqueContacted.size;

    const totalTargetItems = listItems.length;
    const convertedItems = listItems.filter(item => item.status === 'Converted').length;
    const conversionRate = totalTargetItems > 0 ? Math.round((convertedItems / totalTargetItems) * 100) : 0;

    // Chart Data 1: Category distribution
    const categoryCounts: { [key: string]: number } = {};
    state.leads.forEach(l => {
      categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
    });
    const categoryData = Object.keys(categoryCounts).map(cat => ({
      name: cat,
      value: categoryCounts[cat]
    }));

    // Chart Data 2: Strike score ranges
    let highCount = 0; // NOW (>= 75)
    let mediumCount = 0; // SOON (50-74)
    let lowCount = 0; // WAIT (< 50)
    state.leads.forEach(l => {
      if (l.score >= 75) highCount++;
      else if (l.score >= 50) mediumCount++;
      else lowCount++;
    });
    const distributionData = [
      { name: 'STRIKE NOW', value: highCount, color: '#FF3B3B' },
      { name: 'GOOD TIME', value: mediumCount, color: '#F5A623' },
      { name: 'WAIT', value: lowCount, color: '#6B7280' }
    ];

    // Chart Data 3: Activity over last 7 days
    const activityData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateString = d.toLocaleDateString('en-US', { weekday: 'short' });
      return {
        day: dateString,
        dials: Math.floor(10 + Math.random() * 30),
        appointments: Math.floor(2 + Math.random() * 8)
      };
    });

    // Today's Top Strikes across all saved lists
    const savedLeadIds = state.listItems.map(item => item.lead_id);
    const topStrikes = state.leads
      .filter(l => savedLeadIds.includes(l.id))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    res.json({
      metrics: {
        totalLeads,
        listsSaved: userListsCount,
        leadsContacted: leadsContactedCount,
        conversionRate
      },
      charts: {
        categoryData,
        distributionData,
        activityData
      },
      topStrikes
    });
  });

  // VITE OR STATIC FILES MIDDLEWARE DEFINITIONS
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StrikeAI FullStack] Server listening on http://localhost:${PORT}`);
  });
}

startServer();
