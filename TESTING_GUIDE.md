# GoalJourneyContext Testing Guide

## 🚀 Phase 1: Basic App Startup

### Step 1: Start the App
```bash
npm start
```

**Expected Result:** App should start without crashing

**✅ Pass Criteria:**
- App loads to the main screen
- No immediate crash or red error screens
- Can navigate between tabs

**❌ Failure Signs:**
- App crashes on startup
- Red error screen with "Text strings must be rendered within a <Text> component"
- Navigation doesn't work

---

## 👤 Phase 2: Authentication Flow

### Step 2: User Login/Signup
1. If not logged in, sign up with a new account OR log in with existing account
2. Complete any required onboarding steps

**Expected Result:** User should be authenticated and reach the main app

**✅ Pass Criteria:**
- Successfully create account or login
- Can access main app screens
- User session persists on app restart

---

## 🎯 Phase 3: GoalJourneyContext Testing

### Step 3: Navigate to Journey Screen
1. Open the app (make sure you're logged in)
2. Navigate to the "Journey" tab/screen

**Expected Result:** Journey screen loads without errors

**✅ Pass Criteria:**
- Journey screen displays properly
- Shows "Loading your journey..." initially
- Eventually shows content (even if no goals yet)

**❌ Failure Signs:**
- Screen crashes or shows error
- Infinite loading state
- White/blank screen

### Step 4: Check Available Goals
On the Journey screen, you should see:

**Expected Content:**
- Categories section (Physical Health, Mental Health, Finance, Social)
- Some goal options to select from
- "Discover", "Categories", "Search" tabs at the top

**✅ Pass Criteria:**
- At least some categories are visible
- Goal cards are displayed
- Can switch between different tabs

**❌ Failure Signs:**
- No categories or goals shown
- Error messages about missing data
- Tabs don't work

### Step 5: Goal Selection Test
1. Try to select a goal by tapping on a goal card
2. A modal should appear with goal details
3. Try selecting a time commitment (Light/Moderate/Intensive)
4. Tap "Start This Goal"

**Expected Result:** Goal selection should complete successfully

**✅ Pass Criteria:**
- Goal selection modal appears
- Can choose time commitment
- Gets success message "Goal Selected! 🎯"
- Redirects to Learn screen

**❌ Failure Signs:**
- Modal doesn't appear
- Error when trying to select goal
- App crashes during goal selection

---

## 📚 Phase 4: Daily Habits Testing

### Step 6: Check Learn Screen
After selecting a goal:
1. Navigate to "Learn" screen
2. Check if daily habits appear

**Expected Result:** Learn screen shows daily habits from selected goal

**✅ Pass Criteria:**
- Shows current goal information
- Displays "Today's Habits" section
- Habit cards are visible with proper information
- Shows XP progress at the top

**❌ Failure Signs:**
- No habits shown despite having a goal
- "No habits available today" message
- Habit cards show undefined/missing data

### Step 7: Habit Completion Flow
1. Tap on a habit card to start completion
2. Go through the 4-step completion process:
   - Preparation (Get Ready)
   - Activity (with timer)
   - Completion (stats)
   - Feedback (rating)

**Expected Result:** Complete habit flow works end-to-end

**✅ Pass Criteria:**
- All 4 steps work properly
- Timer functions correctly
- Can rate the habit experience
- Gets success animation with XP reward
- Returns to Learn screen

**❌ Failure Signs:**
- Any step crashes or doesn't work
- Timer doesn't function
- Can't complete the habit
- No XP reward shown

---

## 📊 Phase 5: Progress & Analytics

### Step 8: Check Progress Screen
1. Navigate to "Progress" screen
2. Verify analytics and stats

**Expected Result:** Progress screen shows XP, achievements, and goal progress

**✅ Pass Criteria:**
- Shows XP level and progress bar
- Displays current goal progress
- Shows any completed habits/stats
- Achievement section visible

### Step 9: Check Journey Analytics
1. Go back to Journey screen
2. Look for journey stats and recommendations

**Expected Result:** Journey screen shows personalized content

**✅ Pass Criteria:**
- Shows current goal status
- Displays journey statistics
- May show goal recommendations

---

## 🔄 Phase 6: Data Persistence

### Step 10: App Restart Test
1. Close the app completely
2. Restart the app
3. Check if data persists

**Expected Result:** All progress should be saved

**✅ Pass Criteria:**
- Selected goal persists
- Completed habits remain completed
- XP progress is maintained
- Can continue where left off

---

## 🐛 Common Issues & Solutions

### Issue: "No goals available"
**Solution:** Database might not have seed data. Try:
1. Check internet connection
2. Try logging out and back in
3. Contact developer to check database

### Issue: App crashes on navigation
**Solution:** 
1. Check console logs for errors
2. Try restarting the app
3. Clear app cache/data

### Issue: Habit completion doesn't work
**Solution:**
1. Make sure you're logged in
2. Check if goal is properly selected
3. Try selecting a different habit

### Issue: Progress not saving
**Solution:**
1. Check internet connection
2. Try completing actions again
3. Verify user authentication

---

## 📝 Test Results Template

Use this to track your testing:

```
✅ Phase 1 - App Startup: PASS/FAIL
✅ Phase 2 - Authentication: PASS/FAIL  
✅ Phase 3 - Journey Screen: PASS/FAIL
✅ Phase 4 - Habit Completion: PASS/FAIL
✅ Phase 5 - Progress Analytics: PASS/FAIL
✅ Phase 6 - Data Persistence: PASS/FAIL

Notes:
- [Any specific issues or observations]
- [Performance notes]
- [UI/UX feedback]
```

---

## 🎯 Success Criteria Summary

The GoalJourneyContext implementation is working correctly if:

1. ✅ App starts without crashing
2. ✅ Can authenticate and login
3. ✅ Journey screen loads and shows goals
4. ✅ Can select a goal successfully  
5. ✅ Learn screen shows daily habits
6. ✅ Can complete habits end-to-end
7. ✅ Progress tracking works
8. ✅ Data persists across app restarts

If all these work, the implementation is successful! 🎉