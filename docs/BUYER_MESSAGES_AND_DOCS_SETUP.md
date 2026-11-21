# MoodFlip — Buyer Messages & Google Docs Master Reference
**Last Synced:** 28 September 2026  
**Google Account (Owner):** `rankwriter2020@gmail.com` (Akeel Khan)  
**gcloud Auth:** Authenticated via `gcloud auth login --enable-gdrive-access`  
**Project:** `gen-lang-client-0686345674`

---

## ✅ Google Files Access Status

| File | Type | Name | Access | Link |
|---|---|---|---|---|
| **Rotating Actions Sheet** | Google Sheet | `MoodFlip_Actions_ChatGPT_2026_REVIEW` | ✅ 200 OK | [Open](https://docs.google.com/spreadsheets/d/1xtef3cg4yzK1p3rc4in3_vQUd1R0Rw6rgjxrTHS7VqY/edit?gid=1746169883) |
| **Business Spec v6** | Google Doc | `MoodFlip_Spec_v6_ChatGPT_review` | ✅ 200 OK | [Open](https://docs.google.com/document/d/1XgcWfUPWRu5KycbhlUzZN2NYNPP2U3FmD06SKFTHm5E/edit) |
| **Business Spec v6 (Copy)** | Google Doc | `MoodFlip_Spec_v6_ChatGPT_review (1) (1)` | ✅ 200 OK | [Open](https://docs.google.com/document/d/1nddsW1t6qy3GgvnHYAA9RuLAIvrY_Cwa-RmIlulZbRU/edit) |
| **Defect List** | Google Doc | `MoodFlip_Defect_List_vs_Business_Spec_14AUG26 (1)` | ✅ 200 OK | [Open](https://docs.google.com/document/d/1kEJu72mGq1kzhsIajCui0uHzlSBgXosbaU1g7pY7PHs/edit) |
| **Buyer Mood Pairings (Old Sheet)** | Google Sheet | `Buyer Mood pairings copy` | ✅ 200 OK | [Open](https://docs.google.com/spreadsheets/d/1BKkG6VF8VbhOe7P1aR75yBCm_iTaZDEXpn7JvMRdTeM/edit) |

### IDs for gcloud/API access
```
Sheet  (Rotating Actions): 1xtef3cg4yzK1p3rc4in3_vQUd1R0Rw6rgjxrTHS7VqY
Doc    (Spec v6 Main):     1XgcWfUPWRu5KycbhlUzZN2NYNPP2U3FmD06SKFTHm5E
Doc    (Spec v6 Copy):     1nddsW1t6qy3GgvnHYAA9RuLAIvrY_Cwa-RmIlulZbRU
Doc    (Defect List):      1kEJu72mGq1kzhsIajCui0uHzlSBgXosbaU1g7pY7PHs
Sheet  (Old Pairings):     1BKkG6VF8VbhOe7P1aR75yBCm_iTaZDEXpn7JvMRdTeM
```

### Quick Token Command
```bash
source ~/.zshrc
TOKEN=$(gcloud auth print-access-token)
```

---

## 📩 Joy's Buyer Messages (Verbatim) — 28 Sep 2026

### Message 1 — Rotating Actions / Prompt Update
> Hi Sohel, happy Monday. :) I'm back!
> - I reviewed the prompts (ChatGPT became smarter and gave me some new suggestions) and made some changes. These make more sense and they're more understandable.
> - You can see which ones have changed, **those are yellow in the F column in the XL file**.
> - Please change the prompts in MoodFlip accordingly.
> -----------
> I am going through the website today and will send you the changes required.
> Thanks a lot. Joy

**Status:** ✅ DONE — All 56 yellow prompts updated in `data/moods.ts` from Column F of Google Sheet.

---

### Message 2 — Business Spec v6 / Profile Edit & Delete
> Here comes the updated Business Specification.
> There's one thing that presented now; **users need to be able to edit and delete their profile**.
> Is this something you could add please?

**Status:** ⚠️ PENDING — See Section 10 of Spec v6 below. Profile edit (email, password) + delete account required.

---

### Message 3 — BS File Size Issue
> I'm not sure if Fiverr uploaded the BS. It may be too big with all the screenshots I added.
> What's your e-mail address again? I'll e-mail it through.

**Status:** ℹ️ INFO — Spec v6 successfully accessed and read from Google Drive. Full content saved.

---

### Message 4 — Still Pending from Joy
> What I still need to send you:
> 1. **Favicon** — to remove that nose ring from the top.
> 2. **PDF template**.

**Status:** ⏳ AWAITING — Joy will send Favicon and PDF template separately.

---

### Message 5 — Positive Feedback
> The site starts to look really good! :) We/you simplify it further and it will be truly awesome.

---

## 📋 Business Specification v6 — Key Requirements & Changes (28 Sep 2026)

> **Source:** `MoodFlip_Spec_v6_ChatGPT_review` | Google Doc ID: `1XgcWfUPWRu5KycbhlUzZN2NYNPP2U3FmD06SKFTHm5E`  
> **Date:** 28 September 2026 / v6 – live website reviewed

---

### 🔴 LIVE WEBSITE MISMATCHES — Must Fix Immediately

| # | Page | Issue | Action Required |
|---|---|---|---|
| **M1** | `/resources` | Unapproved Resources page is live (`/resources`) — not in nav but still accessible. Contains unapproved free 7-Day PDF, 30-Day Challenge, Certificate. | **REMOVE PAGE ENTIRELY** |
| **M2** | `/disclaimer` | Unapproved Disclaimer page is live. Spec does NOT require a Disclaimer page. | **REMOVE PAGE** |
| **M3** | `/terms` | Unapproved Terms page is live. Spec does NOT require a Terms page. | **REMOVE PAGE** |
| **M4** | `/profile` | Profile page is publicly accessible without login, shows demo "Emma Johnson" account with fake 2025 data. | **REQUIRE AUTH + REMOVE ALL DEMO DATA** |

---

### 🟡 CORRECTIONS — About Page

| # | Correction |
|---|---|
| **C1** | Active nav item must be **bold + underlined**. Currently Home stays highlighted on all pages — fix for ALL pages. |
| **C2** | Arrange 4 menu items (Home, About, Privacy Policy, Contact) to the right, same distance from Login. |
| **C3** | Replace text "MoodFlip" with the **MoodFlip logo** everywhere. |
| **C4** | Use the same **purple colour** for headline as in "Mood" word in the MoodFlip logo. |
| **C5** | Remove **TM** from MoodFlip logo everywhere — not trademarked yet. |
| **C6** | Correct `toward` → `towards` under "About MoodFlip". |
| **C7** | Update About page body text to this exact wording: *"Start by choosing your current mood, then dig deeper and identify the more specific feelings you are experiencing. By pressing Flip My Mood [picture of button] MoodFlip suggests a positive feeling and a short 60-second action to achieve it."* |
| **C8** | Remove bottom section of About page entirely (makes page too long). |
| **C9** | About text: *"You can use MoodFlip without creating a profile. If you choose to create a profile, you can save the suggestions..."* — **make bold section purple + bold**. |

---

### 🟡 CORRECTIONS — Privacy Policy Page

- Use **bigger letters** for section headlines (1-8).
- All 8 privacy sections content is approved — just format/size improvement needed.
- Use **small italic** for "Last updated: 21 August, 2026".

---

### 🟡 CORRECTIONS — Contact Page

- Use small italic for *"We're here to help."*
- Remove 3 lines below it.
- **Remove the left panel** — keep only right panel with fields:
  - Your Name
  - Your E-mail
  - Subject
  - Your Message
- Use **small caps** (not large caps).
- Message max 1000 characters — show live countdown under box: `Maximum 1000 characters.`
- Messages must arrive to MoodFlip email box.
- **Remove FAQ section entirely.**

---

### 🟡 CORRECTIONS — Profile Page (MAJOR)

**Terminology change across entire site:**
| Old term | New term |
|---|---|
| "Check-in" | "Mood Flip" |
| "Saved check-ins" | "Saved Mood Flips" |
| "Total Check-ins" | "Total Mood Flips" |
| "Recent Check-ins" | "Recent Mood Flips" |
| "Save check-ins across 7 days" | "Save your Mood Flips across 7 days" |
| Button: "Flip Your Mood" | Button: **"Flip My Mood"** |
| "SAVE MY PROFILE" | Keep — appears right under 60-sec action |

**Remove from Profile:**
- Reset Photo / profile photo
- Personal Mindset Bio
- Mood Library section
- Separate 60-Second Actions section
- Notifications section
- Privacy & Data as separate dashboard section
- Help & Support from profile (Contact page is enough)
- Mood Insights percentages/graphs
- "Recommended For You" cards
- "Daily Motivation"
- "Quick Actions" section
- Streaks ("5-day streak")
- "Total Actions" as big statistic
- Duplicate Upgrade/Get 7-Day Plan buttons
- All fake/demo data (Emma Johnson, 2025 results)

**Simplified Profile Structure:**
```
My Profile
├── Flip My Mood
├── My Mood Flips
├── My 7-Day Report
├── Downloads
├── Account Settings  ← email, password, delete profile
└── Logout
```

**NEW REQUIRED FEATURE (from Joy's message):**
- ✅ Logged-in users must be able to **CHANGE their email address** in Profile Settings
- ✅ Logged-in users must be able to **CHANGE their PASSWORD** (+ Reset Password email + Reset link on Login page)
- ✅ Logged-in users must be able to **permanently DELETE their profile and all saved mood history** from Profile Settings, without contacting MoodFlip
- ✅ A **confirmation warning** must appear before deletion

---

### 🟡 Popup Messages — Exact Wording (Spec §16)

| # | Trigger | Message |
|---|---|---|
| **1** | After first saved Mood Flip | "Your first MoodFlip is saved. You can save up to 3 Mood Flips per day. After 7 days, you'll be able to download your personalised 7-Day MoodFlip Report." |
| **2** | From 2nd saved calendar day (once/day) | "You're building your 7-Day MoodFlip Report. Save up to 3 Mood Flips per day. Your personalised report will be available after 7 days for US$7." |
| **3** | After saving a Mood Flip (progress) | "Saved. Today's Mood Flips: [1/3] / 7-Day Report progress: Day [X] of 7" |
| **4** | Daily save limit reached | "You've saved today's 3 Mood Flips. You can still use the free MoodFlip tool. You can save more Mood Flips tomorrow." |
| **5** | 7-day report ready | "Your 7-Day MoodFlip Report is ready. Download your personalised report with your saved moods, positive moods, 60-second actions, and mood pattern summary. Download for US$7" |
| **6** | Payment successful | "Payment successful. Your MoodFlip Report is ready to download. A copy has also been emailed to you." |
| **7** | Payment OK but PDF issue | "Payment received. Your report is being prepared. If it does not arrive, you can download it from your profile or contact support." |
| **8** | Profile invite on 2nd visit | "Save your MoodFlips? Create a free profile to save your moods, actions, and progress toward your 7-Day MoodFlip Report." |
| **9** | Consent checkbox | "By creating a profile, you agree that MoodFlip may store your email address, selected moods and dates, actions shown, and purchase history so we can create and offer personalised downloads." |

> ⚠️ **No popup when someone first opens the site.** Popup #8 only triggers on 2nd visit.

---

### 🟡 AdSense Ad Placement (Spec §13)

| Device | Ad Placement |
|---|---|
| Desktop | Right side (300×250 or responsive rectangle beside/below action card) + Bottom horizontal (728×90 below tool, before footer) |
| Tablet | One ad after mood result section + One near bottom (before footer) |
| Mobile | One ad after result/action + One bottom before footer. **NO ads between mood steps and Flip My Mood button** |

---

### 🟡 Disclaimer / Terms Pages

| Page | Spec Requirement |
|---|---|
| `/disclaimer` | **REMOVE** — not required per spec |
| `/terms` | **REMOVE** — not required per spec |

Non-medical/non-therapy wording belongs on the **About page only**.

---

### 🟡 Design — Fonts

| Area | Font |
|---|---|
| Logo | Custom wordmark — use approved logo artwork only, do NOT retype |
| Nav / body text | Nunito Sans or Avenir Next Rounded (semi-bold for nav/headings, regular for body) |
| Mood result word (e.g. "Peaceful") | Cormorant Garamond or DM Serif Display |
| "Flip My Mood" button | Nunito Sans Bold |
| Chips / labels | Nunito Sans Regular/SemiBold |

---

### 🟡 Mobile Landscape Mode

When MoodFlip opens on mobile: show a **rotate icon** until user turns phone to landscape mode.

---

## ⏳ Still Awaiting from Joy

| Item | Status |
|---|---|
| **Favicon** (remove nose ring) | ⏳ Joy will send |
| **PDF Template** | ⏳ Joy will send |
| **More website changes** | ⏳ Joy is reviewing today and will send |

---

## 🛠️ How to Re-Sync Google Data (Quick Reference)

```bash
# 1. Get fresh token
source ~/.zshrc
TOKEN=$(gcloud auth print-access-token)

# 2. Read Rotating Actions Sheet (Column F = updated prompts)
node scripts/apply_chatgpt_2026_prompts.js

# 3. Read any Google Doc
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://docs.googleapis.com/v1/documents/DOC_ID_HERE" | \
  node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
  let t=''; d.body.content.forEach(e=>{if(e.paragraph)e.paragraph.elements.forEach(x=>{if(x.textRun)t+=x.textRun.content;})}); console.log(t.substring(0,2000));"

# 4. List all Drive files
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType)"
```
