# 🎯 KASA Challenge Win Validation Checklist

This document guides you through testing the three critical differentiators that will win the Kapruka challenge.

---

## ✅ PART 1: Sinhala Localization (The "Surprising Factor")

### UI Strings in Sinhala
Visit `http://localhost:3000` and click the **"සි"** (Sinhala) button. Verify:

- [ ] Chat input placeholder: `ඔබ සොයන්නේ කුමක්ද?` (What are you looking for?)
- [ ] **Gift** button: Changes to `තෑගි` (תags in Sinhala)
- [ ] **Cart** button: Changes to `කරත්තය`
- [ ] **Track** button: Changes to `ලුහුබදින්න`
- [ ] **Browse** button: Changes to `බ්‍රවුස් කරන්න`
- [ ] Cart drawer title: `ඔබගේ කරත්තය` (Your Cart)
- [ ] Empty cart message: `ඔබගේ කරත්තය හිස් ය` (Your cart is empty)
- [ ] Checkout button: `ගිණුම් ස්ථිතිය පරීක්ෂා කරන්න`

### AI Responses in Sinhala
Send this message in Sinhala mode:

**Message:** `මට ගෙයුම් සඳහා මල් අවශ්‍ය ය` (I need flowers for a gift)

**Expected:** AI responds in Sinhala, uses සිංහල ස්ක්‍රිপ්ට, mentions Sri Lankan cultural context

**NOT Expected:** English response, English product names used directly (should stay in Sinhala)

**Scoring:** Sinhala support = +30 points in most challenges. This is your differentiator.

---

## 🧠 PART 2: Emotional Flows (End-to-End)

### Test 1: SAD Emotion (💔 Breakup/Apology)

**Message:** "I broke up with my girlfriend… I need to send some flowers."

**Expected Response:**
- ✅ Leads with empathy, not product list
- ✅ Contains: "Aiyo" or similar warmth markers
- ✅ Suggests hand-delivery + note card option
- ✅ Stays under 60 words
- ✅ Shows 3-5 flower products

**NOT Expected:**
- ❌ "I'd be happy to help you with that"
- ❌ "Here are the results for your search"
- ❌ Generic list format
- ❌ More than 2 emoji

**Example Good Response:**
```
Aiyo! 💔 Okay — here's the plan. Hand-deliver the flowers yourself — 
that lands better than a courier. Let me find the perfect bouquet for you.
Shall I add a note card too?
```

### Test 2: URGENT Emotion (🎂 Forgotten Birthday)

**Message:** "My amma's birthday is tomorrow and I completely forgot!"

**Expected Response:**
- ✅ Leads with reassurance ("Don't panic!")
- ✅ Mentions same-day delivery deadline (12pm cutoff)
- ✅ Suggests cake + flowers combo (Sri Lankan standard)
- ✅ Direct recommendation, not just options
- ✅ Clear next action (add to cart or let me search)

**NOT Expected:**
- ❌ "Let me check what we have available"
- ❌ "Please select a delivery date"
- ❌ Generic product list

**Example Good Response:**
```
Don't panic! 🎂 Same-day delivery is still on if we order before 12pm.
Let me find a cake and flowers combo — amma will never know you forgot.
What's your delivery city?
```

### Test 3: EXCITED Emotion (🎉 Celebration)

**Message:** "Just got promoted! I want to celebrate with something special"

**Expected Response:**
- ✅ Matches energy level, uses enthusiasm
- ✅ Suggests premium/celebration items
- ✅ Mentions gift hampers (premium signal)
- ✅ Feels celebratory, not formal

**Example Good Response:**
```
Respect! 🎉 You deserve something special. Hampers are the move here —
they signal premium, show sophistication. I'm thinking chocolate + wine combo?
```

### Test 4: NEUTRAL/PRACTICAL Emotion (📱 Everyday Shopping)

**Message:** "I need a new phone charger"

**Expected Response:**
- ✅ Practical, direct tone
- ✅ Does NOT assume it's a gift
- ✅ Asks clarifying question (USB-C or Lightning?)
- ✅ No gift-framing language

**NOT Expected:**
- ❌ "Would you like to send this as a gift?"
- ❌ Gift emoji or festive language

**Example Good Response:**
```
Practical shopping? Respect. Let me check what's in stock — USB-C or Lightning?
```

---

## 👥 PART 3: "Feels Human, Not Robotic"

### What To Look For

Listen to the tone. Does it sound like:
- ✅ A close friend who happens to know every product on Kapruka?
- ✅ Someone who understands your situation emotionally?
- ✅ Someone with genuine opinions ("My honest pick is...")?

OR does it sound like:
- ❌ A customer service bot?
- ❌ A product listing engine?
- ❌ Someone reading from a script?

### Specific Phrases To Avoid

The system is trained to NEVER use these:
- [ ] "I'd be happy to help you with that"
- [ ] "Here are the results for your search"
- [ ] "Please choose from the following options"
- [ ] "Great question!"
- [ ] "Based on your request"
- [ ] "Hope this helps"
- [ ] "Feel free to let me know"

### Specific Phrases That Signal Human Tone

Look for these (system is trained to use them):
- [ ] "My honest pick..."
- [ ] "Trust me..."
- [ ] "Aiyo" / "Machang" / "Aiya" (cultural warmth)
- [ ] "Here's why..." (giving opinions, not just data)
- [ ] Contractions: "don't", "won't", "it's", "that's"
- [ ] Conversational starters: "So", "Actually", "Well"

---

## 🧪 Quick Test Scenarios (5 minutes)

Run these back-to-back to validate all flows:

### Scenario 1: Multi-Item Cart (tests everything)
```
Message 1: "I want to send a gift hamper for my friend's wedding"
Expected: Emotional awareness + gift search

Message 2: (When products shown) "I'll take the premium hamper. What else goes well with it?"
Expected: Upsell suggestion if appropriate, add to cart

Message 3: "Actually, add two more things — flowers and a cake"
Expected: Cart builds up, shows totals

Message 4: "What's delivery to Colombo for tomorrow?"
Expected: kapruka_check_delivery called, shows feasibility

Message 5: "Let's checkout"
Expected: Checkout form appears, delivery verified
```

### Scenario 2: Language Switch (Tanglish/Sinhala)
```
Language: English
Message 1: "Show me gift ideas under 5000"
Expected: Product search

Then click "සි" (Sinhala)
Message 2: "More expensive items dae?"
Expected: AI switches to Sinhala seamlessly
```

### Scenario 3: Order Tracking
```
Message: "Track my order"
Expected: Order tracking interface OR "No active orders"
Shows proper response format (not robotic)
```

---

## 📊 Scoring Matrix

### For Challenge Judges

| Criterion | Weight | Evidence |
|-----------|--------|----------|
| **Sinhala Localization** | 30% | Full UI translation + AI responses in Sinhala |
| **Emotional Intelligence** | 25% | Handles sad/urgent/excited moods with appropriate tone |
| **Human Tone** | 25% | No robotic patterns, conversational, has opinions |
| **Feature Completeness** | 20% | Search, cart, checkout, delivery, tracking all work |
| **Bonus: Tanglish** | +5% | Responses in Tamil/Tamil-English mix |
| **Bonus: Group Gifts** | +5% | Can split costs with friends |

---

## 🚀 Pre-Demo Prep (30 minutes before submission)

- [ ] Clear browser cache: `localStorage.clear()` in console
- [ ] Test on mobile (375px width) — responsive?
- [ ] Verify API keys in `.env.local`:
  ```
  GROQ_API_KEY=xxx (or GOOGLE_GENERATIVE_AI_API_KEY or OPENAI_API_KEY)
  ```
- [ ] Run: `npm run build` (check for errors)
- [ ] Test the 5 scenarios above
- [ ] Record a 60-second screen video of:
  1. Sinhala UI (2s)
  2. Emotional response (greeting like "I forgot my amma's birthday") (3s)
  3. Adding items to cart (2s)
  4. Checkout flow (3s)

---

## 📋 Delivery Checklist

Before submitting your public demo link, ensure:

- [ ] Deployed to a public URL (Vercel, Netlify, etc.)
- [ ] Sinhala language works
- [ ] One emotional flow end-to-end (sad/urgent/excited)
- [ ] Cart + checkout works (can create a test order)
- [ ] No console errors (check DevTools)
- [ ] Mobile responsive (test on 375px width)
- [ ] Page loads in under 3 seconds
- [ ] Feels warm and human, not robotic

---

## 🎯 The Winning Recipe

```
Sinhala Localization (surprising)
+ Emotional Intelligence (delightful)
+ Human Tone (trustworthy)
+ Full Features (credible)
= 🏆 KASA wins
```

The judges are looking for an agent that **feels like magic** — reads the situation, 
has opinions, speaks the user's language (literally and culturally), 
and delivers results without feeling like a chatbot.

You have all the foundations in place. Now validate, refine, and ship with confidence.

**Go make something amazing.** 🚀
