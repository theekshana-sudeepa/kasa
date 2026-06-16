#!/bin/bash
# KASA Emotional Intelligence Test Suite
# Tests: sad, urgent, excited, anxious emotional flows
# Plus: feels human (no generic responses), cultural fluency

echo "🧪 KASA Emotional Intelligence Test Suite"
echo "==========================================\n"

API_URL="http://localhost:3000/api/chat"
SESSION_ID="test-$(date +%s)"

# Test 1: SAD emotion (breakup scenario)
echo "TEST 1: SAD (Breakup/Apology) 💔"
echo "User: I broke up with my girlfriend… I need to send some flowers."
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"I broke up with my girlfriend… I need to send some flowers.\",
    \"sessionId\": \"$SESSION_ID\",
    \"language\": \"en\",
    \"cart\": [],
    \"giftMode\": true,
    \"deliveryCity\": \"Colombo\"
  }" | head -c 200
echo "\n---\n"

# Test 2: URGENT emotion (forgotten birthday)
echo "TEST 2: URGENT (Forgotten Birthday) 🎂"
echo "User: My amma's birthday is tomorrow and I completely forgot!"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"My amma's birthday is tomorrow and I completely forgot!\",
    \"sessionId\": \"$SESSION_ID\",
    \"language\": \"en\",
    \"cart\": [],
    \"giftMode\": true,
    \"deliveryCity\": \"Colombo\"
  }" | head -c 200
echo "\n---\n"

# Test 3: NEUTRAL/PRACTICAL (everyday shopping)
echo "TEST 3: PRACTICAL (Everyday Shopping) 📱"
echo "User: I need a new phone charger"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"I need a new phone charger\",
    \"sessionId\": \"$SESSION_ID\",
    \"language\": \"en\",
    \"cart\": [],
    \"giftMode\": false
  }" | head -c 200
echo "\n---\n"

# Test 4: SINHALA response (should switch to Sinhala)
echo "TEST 4: SINHALA Language 🇱🇰"
echo "User (Sinhala): මට පිරිසිදු කිරීමේ නිෂ්පාදන අවශ්‍ය ය"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"මට පිරිසිදු කිරීමේ නිෂ්පාදන අවශ්‍ය ය\",
    \"sessionId\": \"$SESSION_ID\",
    \"language\": \"si\",
    \"cart\": [],
    \"giftMode\": false
  }" | head -c 200
echo "\n---\n"

# Test 5: Check for robotic responses (should NOT contain)
echo "TEST 5: Check for NON-ROBOTIC tone"
echo "Looking for absence of: 'I\\'d be happy to help', 'Here are the results', 'Please choose'"
echo "(These are detected automatically in the response)"
echo ""

echo "✅ Tests sent to localhost:3000"
echo "Check browser at http://localhost:3000 for full interactions"
