# Moraloop long-form 30-day plan (storylines)

Long-form videos are 2–3 minute claymation storylines built on dilemmas we already posted as shorts. A short (20–40 s) sets up a dilemma and stops. A long video tells a small story: named characters, a setup that makes **both** sides understandable, then **CHOICE A** played out, "Now... rewind.", **CHOICE B** played out, and finally the man in the suit: "Two choices. Two very different endings." → the question (PDF wording) → "What would you do?".

**Posting slot:** 4:00 PM (owner's local time), every other day, Sat Oct 24 – Sat Nov 21, 2026 (15 episodes). The 7:00 PM daily shorts plan (`30_day_plan.md`) and the 12:00 PM trend shorts are separate slots.

**How the long-form agent uses this plan**

1. Each run (day D) produces the first episode below whose `Status` is `todo`, for posting at 4:00 PM on D+1. Check that its post date is D+1; if an earlier episode was missed, make the earliest `todo` one and note the slip in the run summary.
2. Write `src/stories/<slug>.py` from `src/stories/example_template.py`, following the outline here. The outline is a guide, not a script: keep the setup, the two choice labels, and the gains/costs of each ending; you can reword lines, add reaction beats and adjust settings so the stills read clearly. Scenes hold at most 3 characters on screen.
3. Target 120–180 s (`STORY=<slug> python3 story.py plan`), roughly 18–26 short spoken lines. Keep the two branches about the same length (within ~2 lines of each other).
4. Neutrality check before rendering (see `AGENT_GUIDE.md`): count wins and losses per branch, make sure neither ending is happier, no loaded words ("selfish", "coward", "the right thing", "betrayal" as a verdict), and no "punishment" scene on one side only. If you change a branch, re-balance the other.
5. Host block at the end: `M("Two choices. Two very different endings.")`, then the episode's question exactly as written under **Question**, then `M("What would you do?", close=True)`.
6. After rendering and review, change the episode's `Status: todo` to `Status: done (YYYY-MM-DD) → long/<slug>.mp4`, and change its row in the summary table from `todo` to `done`. Then append the queue row and commit as described in `AGENT_GUIDE.md`.

**Spacing rule used:** every long episode airs at least 8 days away from its own short (before or after), so a dilemma never appears twice in the same week. Two episodes (#13, #15) use dilemmas that have no short in the 30-day plan. Questions marked "PDF wording" are copied exactly from `src/ads_spec.py`.

## Summary

| # | Post date (4:00 PM) | Storyline title | Source short | Theme | Status |
|---|---|---|---|---|---|
| 1 | Sat Oct 24, 2026 | The Plus One | 04_the_ex_plus_one — The Ex Plus One (short Nov 7) | Relationships | done |
| 2 | Mon Oct 26, 2026 | The Apology | 24_another_chance — Another Chance (short Nov 6) | Forgiveness / friendship | todo |
| 3 | Wed Oct 28, 2026 | The Job Offer | 08_the_resume — The Résumé (short Nov 9) | Work / money | todo |
| 4 | Fri Oct 30, 2026 | The Last Season | 18_the_team_secret — The Team Secret (short Nov 15) | Sports / loyalty | todo |
| 5 | Sun Nov 1, 2026 | Rent Night | 07_the_wallet — The Wallet (short Oct 24) | Money / honesty | todo |
| 6 | Tue Nov 3, 2026 | The Offer Letter | 45_your_dream_or_your_family — Your Dream or Your Family (short Nov 16) | Family / life choices | todo |
| 7 | Thu Nov 5, 2026 | Overheard | 23_the_promotion — The Promotion (short Oct 27) | Work | todo |
| 8 | Sat Nov 7, 2026 | Back Me Up | 22_the_lie — The Lie (short Oct 26) | Friendship / loyalty | todo |
| 9 | Mon Nov 9, 2026 | The Voice | 51_the_urgent_call — The Urgent Call (short Nov 1) | Family / tech | todo |
| 10 | Wed Nov 11, 2026 | Five Stars? | 26_the_honest_review — The Honest Review (short Oct 31) | Friendship / honesty | todo |
| 11 | Fri Nov 13, 2026 | The Empty Yard | 02_the_school_garden — The School Garden (short Nov 2) | Community | todo |
| 12 | Sun Nov 15, 2026 | Moving Day | 06_the_missing_deposit — The Missing Deposit (short Oct 30) | Relationships / money | todo |
| 13 | Tue Nov 17, 2026 | One Saturday | 34_who_do_you_help — Who Do You Help? (no short in plan) | Community / loyalty | todo |
| 14 | Thu Nov 19, 2026 | The Surprise | 21_the_birthday_plan — The Birthday Plan (short Nov 10) | Friendship | todo |
| 15 | Sat Nov 21, 2026 | No Filter | 41_every_unfiltered_thought — Every Unfiltered Thought (no short in plan) | Big hypothetical / relationships | todo |

Approval: all 15 episodes are approved. #1, 2, 3, 5, 7, 8, 10, 11 and 12 were approved in the PDF, and the owner approved #4, 6, 9, 13, 14 and 15 on Oct 20, 2026. All posting times are US Eastern.

Note: Thu Nov 5 also has the "Two Best Friends" storyline in the 7:00 PM slot, so that day's 4:00 PM episode (#7, work) is deliberately a different theme.

---

## Episode 1: The Plus One
- **Posts:** Sat Oct 24, 2026, 4:00 PM (produce Fri Oct 23)
- **Source:** `04_the_ex_plus_one`, "The Ex Plus One" (approved; short airs Nov 7)
- **Slug:** `the_plus_one`
- **Cast:** You (`you`); Avery, your partner (`partner`); Jamie, Avery's ex (`ex`)
- **Settings:** cafe, home, home_night, party (the wedding)
- **Question (PDF wording):** "Do you say you’re uncomfortable, or support the one-night plan?"

**Setup**
- Avery and Jamie dated years ago and stayed friendly. You and Avery have been together a year and things are good.
- Jamie, at the café: "My sister's wedding is Saturday. We RSVP'd as a pair before we split. Just one evening?"
- Jamie's grandparent is unwell and has been asking about "Jamie and Avery". Jamie doesn't want a scene at the wedding.
- The wedding is small. You're not invited. Avery, at home: "It means nothing. But it's your call."
- You trust Avery. You also notice the knot in your stomach.

**CHOICE A: SAY YOU'RE UNCOMFORTABLE**
- You: "I trust you. I just don't feel okay with it." Avery listens and nods.
- Avery texts Jamie that they can't go. Jamie replies "Okay." and nothing else.
- Jamie goes alone and fields questions all night. The friendship between Avery and Jamie goes quiet.
- **Ending:** Avery: "I'm glad you told me. I just hope Jamie's okay." You feel heard; Avery glances at the silent phone.
- **Gains:** your feelings are said out loud; you and Avery set a clear boundary together. **Costs:** Jamie has a hard night alone; Avery's long friendship cools and Avery misses it.

**CHOICE B: SUPPORT THE ONE-NIGHT PLAN**
- You: "Go. Help Jamie out." Avery hugs you, relieved.
- Saturday night you're home alone; photos of Avery and Jamie dancing pop up in a group chat. The knot comes back.
- Avery comes home early: "Thank you for trusting me." Jamie texts you: "That meant a lot to my family."
- **Ending:** a relative comments under a photo: "So happy you two are back together!" Avery says they'll clear it up. You smile, and wonder where the line will be next time.
- **Gains:** Avery feels trusted; Jamie's family gets an easier night; the friendship stays intact. **Costs:** a long uneasy evening for you; a story is now out there that isn't true.

**Balance check:** one side protects your own comfort at the cost of a friend's hard night; the other gives trust and kindness at the cost of your unease and a lingering half-truth.

Status: done (2026-10-20) → long/the_plus_one.mp4

---

## Episode 2: The Apology
- **Posts:** Mon Oct 26, 2026, 4:00 PM (produce Sun Oct 25)
- **Source:** `24_another_chance`, "Another Chance" (approved original; short airs Nov 6)
- **Slug:** `the_apology`
- **Cast:** You (`you`); Robin, your former best friend (`friend`); Dana, your close friend now (`friend2`)
- **Settings:** cafe, park, home, store
- **Question (PDF wording):** "Do you forgive them… or protect your peace?"

**Setup**
- Two years ago you and Robin planned to open a food stall together. A week before launch, Robin pulled out and opened it with someone else. No explanation.
- It took you a long time to feel settled again. Dana helped.
- Today Robin finds you at the café: "I was scared and I handled it badly. I'm sorry. I've changed. Can we try again?"
- Robin sounds sincere. Dana, later: "You finally have your calm back."
- You miss Robin. You also remember how that week felt.

**CHOICE A: FORGIVE**
- You say yes. Coffee turns into hours; you laugh like you used to.
- Robin shows up on a rainy Saturday to help you carry a new couch. It feels like old times.
- Then Robin cancels plans last minute once. It's small, but the old fear comes back for a second.
- Dana: "I'm happy for you. I just see you less now."
- **Ending:** you and Robin on a bench. "Are we okay?" "I think so." You're glad, and still a little on guard.
- **Gains:** an important friendship back; shared history and laughs. **Costs:** you're vulnerable again; Dana feels a bit sidelined.

**CHOICE B: PROTECT YOUR PEACE**
- You: "I accept your apology. I'm just not ready to start over." Robin nods, eyes down.
- Life stays steady: game nights with Dana, a routine that feels good.
- Months later you walk past Robin's stall. It's busy. Robin waves. You wave back.
- **Ending:** Dana: "Do you ever wonder?" You: "Sometimes." The door is open; you haven't walked through it.
- **Gains:** your calm and the life you rebuilt stay safe; no risk of being hurt the same way. **Costs:** a friendship that might have healed stays closed; a quiet "what if".

**Balance check:** a real apology pulls one way and hard-earned peace pulls the other, and both endings leave something unfinished.

Status: todo

---

## Episode 3: The Job Offer
- **Posts:** Wed Oct 28, 2026, 4:00 PM (produce Tue Oct 27)
- **Source:** `08_the_resume`, "The Résumé" (saved favorite; short airs Nov 9)
- **Slug:** `the_job_offer`
- **Cast:** You (`you`); Casey, your partner (`partner`); Morgan, the hiring manager (`boss`)
- **Settings:** home, home_night, office, moving
- **Question (PDF wording):** "Would you expose the lie?"

**Setup**
- Your rent is going up, and you have 30 days to cover it or move out.
- Casey lands a great job offer from Morgan. You celebrate with takeout on the floor.
- Later you glance at the résumé on the laptop: it lists a degree Casey never finished. Two classes short.
- Casey: "I can do this job. I've done it for years. I just needed them to look at me."
- Morgan hired Casey partly for that degree. Without the job, you probably lose the apartment.

**CHOICE A: EXPOSE THE LIE**
- You: "I can't pretend I didn't see it. Either we tell Morgan, or I'll have to." Casey goes quiet, then agrees.
- In Morgan's office, Casey explains. Morgan: "I appreciate the honesty. I can't keep the offer. Finish those classes and apply again."
- Boxes. A smaller apartment across town. Casey enrolls in the two classes.
- **Ending:** in the cramped new place, Casey: "We start over. With nothing to hide." You squeeze hands, and both look at the stack of bills.
- **Gains:** nothing hidden between you or from Morgan; a door left open for later. **Costs:** the job and the home are gone; money is tight and Casey's pride is bruised.

**CHOICE B: KEEP QUIET**
- You say nothing. Casey starts Monday and is genuinely good at the work.
- The rent gets paid. You keep the apartment and the balcony plants.
- Morgan praises Casey in a meeting and asks Casey to mentor new hires "since you have the degree". Casey smiles and doesn't answer.
- **Ending:** late night, both awake. Casey: "I'll fix it one day." You: "When?" The home is safe; the question isn't.
- **Gains:** you keep your home; Casey thrives at a job they're good at. **Costs:** a secret you both carry; it could surface any day; Morgan's trust rests on something untrue.

**Balance check:** honesty costs a home, and keeping the home costs living with a lie, and both outcomes are ones a viewer can picture choosing.

Status: todo

---

## Episode 4: The Last Season
- **Posts:** Fri Oct 30, 2026, 4:00 PM (produce Thu Oct 29)
- **Source:** `18_the_team_secret`, "The Team Secret" (approved by owner Oct 20; short airs Nov 15)
- **Slug:** `the_last_season`
- **Cast:** You (`you`); Jesse, your teammate and close friend (`teammate`); Coach Lane (`coach`); Kit, a younger player (`kid`)
- **Settings:** field, hall, street, home_night
- **Question (PDF wording):** "Do you tell the coach the team needs a backup, or keep your teammate’s secret for now?"

**Setup**
- Jesse is the team's best player. After practice Jesse tells you: "I might quit. My family needs me at the shop. Please don't tell anyone until I decide."
- Coach Lane is building the whole tournament plan around Jesse.
- Kit keeps showing up early, asking for a real shot.
- Coach, to you: "Anything I should know before I lock the lineup?"
- Jesse is your friend. The team is your team.

**CHOICE A: TELL THE COACH**
- You: "You might want a backup. I can't say more." Coach starts training Kit with the first squad.
- Jesse figures out why. "I asked you for two weeks."
- Kit improves fast and finally gets real minutes.
- **Ending:** tournament day. The team is ready for anything. Jesse is there and plays, passes you the ball, but doesn't high-five you after.
- **Gains:** the team is prepared; Kit gets a fair chance. **Costs:** Jesse's trust in you is cracked; Jesse felt pushed while still deciding.

**CHOICE B: KEEP THE SECRET**
- You say "Nothing, Coach." Jesse: "Thanks. I needed time to think without everyone watching."
- You and Jesse talk it through on long walks home. The friendship gets deeper.
- Two days before the tournament, Jesse decides to leave. Coach scrambles; Kit is thrown in with almost no practice.
- **Ending:** Kit steps onto the field, nervous but ready to try. Jesse watches from the stands and gives you a nod. Coach looks at you for a long second.
- **Gains:** Jesse decided freely, with a friend beside them; your bond is stronger. **Costs:** the team and Kit are caught off guard; Coach wonders what you knew.

**Balance check:** loyalty to one friend versus fairness to the whole team, and in each branch someone you care about pays a price.

Status: todo

---

## Episode 5: Rent Night
- **Posts:** Sun Nov 1, 2026, 4:00 PM (produce Sat Oct 31)
- **Source:** `07_the_wallet`, "The Wallet" (saved favorite; short aired Oct 24)
- **Slug:** `rent_night`
- **Cast:** You (`you`); Quinn, your landlord (`elder`); Pat, the wallet's owner (`stranger`); Max, your brother (`brother`)
- **Settings:** street, home_night, home, store
- **Question:** "Do you return it or keep it?" (the short's own close is "Still so sure?", so this uses the PDF wording from `40_the_found_wallet`)

**Setup**
- Host-style opener from the short: "Of course I'd return it." Then the story starts.
- Rent is due at midnight. You're $400 short. Quinn has already given you one extension.
- Walking home you find a wallet on the sidewalk: an ID, a few cards, about $500 in cash. No one around.
- The ID says Pat lives ten minutes away.
- You stand under a streetlight doing math you don't want to do.

**CHOICE A: RETURN IT**
- You knock on Pat's door. Pat: "Oh, thank you! I thought it was gone." A handshake, the door closes.
- At midnight you text Quinn: "I'm short." Quinn: "Late fee, and this is the last extension."
- You call Max to borrow money, which you swore you'd never do again. Max helps, with a sigh.
- **Ending:** you lie awake, broke and owing Max, but you can walk past Pat's street without a second thought.
- **Gains:** Pat gets everything back; you have nothing to hide. **Costs:** a late fee and a final warning; borrowing from family and the pride that costs you.

**CHOICE B: KEEP IT**
- You pay Quinn on time. Quinn: "Thanks. You had me worried."
- You mail the ID and cards back to Pat with no note and no return address.
- At the store you see Pat's flyer: "Lost wallet. Please return the cards." You already did. Not the cash.
- **Ending:** you start a jar labeled "Pat" and drop a few dollars in it. You have a home, and a name you won't forget.
- **Gains:** your home is secure; no favors owed; Pat gets the ID and cards back. **Costs:** Pat is out $500 and never knows why; you carry it every time you pass that street.

**Balance check:** the cost of keeping your word is your rent, and the cost of keeping your home is someone else's money, so it's easy to say what you'd do and hard to be sure.

Status: todo

---

## Episode 6: The Offer Letter
- **Posts:** Tue Nov 3, 2026, 4:00 PM (produce Mon Nov 2)
- **Source:** `45_your_dream_or_your_family`, "Your Dream or Your Family" (approved by owner Oct 20; short airs Nov 16)
- **Slug:** `the_offer_letter`
- **Cast:** You (`you`); Rae, your grandparent (`elder`); Milo, your little brother (`kid`); Sasha, your best friend (`friend`)
- **Settings:** home, dinner, office, moving, field
- **Question (PDF wording):** "Do you chase your dream, or stay for them?"

**Setup**
- You've drawn since you were six. An email arrives: a studio in a big city across the country wants you. The answer is due Friday.
- Since your parents started working nights, you're the one who takes Milo to practice and eats dinner with Rae.
- At dinner Milo asks: "Who'll come to my games?" Rae says: "Go. We'll be fine." Her voice wobbles.
- Sasha: "Chances like this don't come twice. But you're the glue in that house."

**CHOICE A: CHASE YOUR DREAM**
- Moving boxes, a long hug with Rae, Milo waving from the porch.
- First week at the studio: your sketch goes up on the big screen. You've never felt this alive.
- Video calls get shorter. Milo scores his first goal; you watch it on a shaky phone video.
- **Ending:** city lights out the window. Milo on the phone: "Will you be home for winter?" You: "I'll try."
- **Gains:** your dream job; growth you couldn't get at home. **Costs:** missed moments with Milo and Rae; the house is quieter without you.

**CHOICE B: STAY FOR THEM**
- You write "Thank you, but I can't." The send button takes a long time to press.
- Saturday games, cheering for Milo. Weeknight dinners with Rae, who laughs more.
- You take a local job and draw at night. Months later the studio releases the project you would have worked on.
- **Ending:** Milo hands you a drawing: "I want to be like you." You smile, and look at the studio's poster on your wall.
- **Gains:** you're there for your family, and they feel it. **Costs:** the dream is on hold, maybe for good; a quiet "what if".

**Balance check:** both are acts of love, one for the life you want and one for the people you love, and each gives up something real.

Status: todo

---

## Episode 7: Overheard
- **Posts:** Thu Nov 5, 2026, 4:00 PM (produce Wed Nov 4)
- **Source:** `23_the_promotion`, "The Promotion" (approved original; short aired Oct 27)
- **Slug:** `overheard`
- **Cast:** You (`you`); Taylor, your coworker and work friend (`coworker`); Morgan, your boss (`boss`)
- **Settings:** office, hall, cafe, home_night
- **Question (PDF wording):** "Stay quiet? It’s fair. Tell your boss? You likely win."

**Setup**
- You and Taylor are both up for team lead. You eat lunch together most days and cheer each other on.
- Morgan says the new lead has to "stay at least two years, the team needs stability".
- In the hallway you overhear Taylor on the phone: "If my partner's transfer comes through, we'll move abroad next year."
- Taylor hasn't told anyone. It might not even happen.
- Morgan, the next day: "You know the team well. Anything that should factor into this?"

**CHOICE A: TELL YOUR BOSS**
- You: "I heard Taylor might be moving next year. I thought you'd want to know." Morgan writes something down.
- You get the promotion. Your family takes you out to celebrate.
- Taylor, at the café: "Morgan asked about my move. I hadn't told anyone but family." A long silence.
- **Ending:** you're at the lead's desk; Taylor's lunch seat across from you stays empty. You earned the job, and you aren't sure how you got it.
- **Gains:** the promotion and the raise; Morgan gets a lead who's staying. **Costs:** Taylor's private plans were shared without consent; the friendship goes cold.

**CHOICE B: STAY QUIET**
- You: "Nothing I can think of." It feels fair, and it stings.
- Taylor gets the promotion. You congratulate them and mean most of it.
- Eight months later, Taylor tells the team they're moving abroad. Morgan looks at the open lead role, then at you.
- **Ending:** Taylor hugs you goodbye: "You were the best part of this job." You might get the role now, or you might not.
- **Gains:** the choice was fair; the friendship stayed warm and honest. **Costs:** you missed the promotion and the raise; the team gets the disruption Morgan worried about.

**Balance check:** a job you could win versus a fairness you'd keep, and the information is both true and not yours to share.

Status: todo

---

## Episode 8: Back Me Up
- **Posts:** Sat Nov 7, 2026, 4:00 PM (produce Fri Nov 6)
- **Source:** `22_the_lie`, "The Lie" (approved original; short aired Oct 26)
- **Slug:** `back_me_up`
- **Cast:** You (`you`); Drew, your close friend (`friend`); Bea, the neighbor (`elder`); Sky, another friend (`friend2`)
- **Settings:** yard, street, home, park
- **Question (PDF wording):** "Do you back them up… or tell the truth?"

**Setup**
- You, Drew and Sky are playing catch in the yard. Drew throws wild, and Bea's greenhouse window cracks.
- Drew is on thin ice at home. One more incident and their summer trip is cancelled. It's the first one they've saved up for themselves.
- Bea comes out. Drew, fast: "It was already cracked when we got here."
- Bea turns to you. "Is that true?" Sky looks at the ground.
- Bea has known you since you were little. Drew is looking at you too.

**CHOICE A: BACK THEM UP**
- You: "Yeah. It was already like that." Bea sighs and goes inside.
- Drew, on the walk home: "I owe you. Seriously." The trip is saved.
- A week later Bea asks you to help fix the greenhouse. "I'm glad I can count on you." You hand her the tape and say nothing.
- **Ending:** Drew sends you a photo from the trip: "Wish you were here." You smile, and think of Bea's window.
- **Gains:** Drew keeps the trip; your friendship gets stronger. **Costs:** you lied to someone who trusts you; Bea pays for the window herself.

**CHOICE B: TELL THE TRUTH**
- You: "It was us. I'm sorry." Drew stares at you.
- You and Drew offer to pay. Drew's parents find out and the trip is cancelled.
- Drew doesn't text for a week. You and Bea fix the greenhouse together; she makes you lemonade.
- **Ending:** Drew finally shows up at the park: "You could've just said yes." "I know." You toss the ball; Drew catches it, still not smiling.
- **Gains:** Bea gets the truth and the repair; nothing to carry. **Costs:** Drew loses the trip; your friendship takes a real hit.

**Balance check:** the cost of one answer falls on a friend and the cost of the other falls on a neighbor, and you carry part of it either way.

Status: todo

---

## Episode 9: The Voice
- **Posts:** Mon Nov 9, 2026, 4:00 PM (produce Sun Nov 8)
- **Source:** `51_the_urgent_call`, "The Urgent Call" (approved by owner Oct 20; short aired Nov 1)
- **Slug:** `the_voice`
- **Cast:** You (`you`); Nico, your sibling, backpacking abroad (`sibling`); Gran, who you call for advice (`elder`)
- **Settings:** home_night, street, home, cafe
- **Question (PDF wording):** "Do you send help immediately and risk being scammed… or hold off to verify and risk losing precious time?"

**Setup**
- Nico is on a backpacking trip. Their last message was two days ago: a photo from a train.
- 2 AM, your phone rings. Nico's voice, Nico's laugh when nervous: "My bag got stolen. I need $3,000 for a place to stay and a new passport. My phone's about to die."
- It sounds exactly like them. But last week you read about AI voice clones, and $3,000 is almost all your savings.
- The call drops. Nico's number goes straight to voicemail.
- Keep it non-scary: no danger shown, just a worried person in a dark kitchen.

**CHOICE A: SEND HELP NOW**
- You send the money in under a minute. Your hands are shaking.
- Morning: Nico calls from a hostel phone. It was really them. "You got me a bed and a ride to the embassy. Thank you."
- Your savings are gone. Nico promises to pay you back "bit by bit".
- **Ending:** Gran: "And if it hadn't been Nico?" You don't have an answer. You'd send it again; you also know anyone with that voice could have asked.
- **Gains:** Nico got help fast and knows you came through. **Costs:** your savings are drained; you realize how easily you could have been fooled.

**CHOICE B: VERIFY FIRST**
- You call Gran, text Nico's friends, check the train company. Ninety long minutes.
- A friend of Nico's replies: it's real, Nico is at a station. You send help after checking.
- Nico spent a cold night on a bench before the money came. "I was so scared. Why did it take so long?"
- **Ending:** the family sets a code word for emergencies. Nico agrees, still a little hurt. Your savings are safe; Nico's night wasn't.
- **Gains:** you confirmed it before sending; your money is safe; the family now has a plan. **Costs:** Nico waited alone and scared; it stung that you hesitated.

**Balance check:** speed protects the person you love and caution protects you from being fooled, and in both branches the call was real, so neither choice is shown as foolish.

Status: todo

---

## Episode 10: Five Stars?
- **Posts:** Wed Nov 11, 2026, 4:00 PM (produce Tue Nov 10)
- **Source:** `26_the_honest_review`, "The Honest Review" (approved original; short aired Oct 31)
- **Slug:** `five_stars`
- **Cast:** You (`you`); Reese, your friend who just opened a bakery (`friend`); Ash, a mutual friend (`friend2`); a customer (`stranger`)
- **Settings:** store, cafe, home_night, street
- **Question (PDF wording):** "Do you post an honest review… or protect their business and stay positive?"

**Setup**
- Reese quit a steady job to open a tiny bakery. Opening week, the whole town is watching.
- Reese: "Reviews make or break new places. Will you write one?"
- You try the cookies. They're dry. The coffee is great; the staff is lovely.
- Ash: "Just give five stars. Friends support friends." You've always trusted reviews when deciding where to eat.
- You open the review app, and stare at the stars.

**CHOICE A: POST AN HONEST REVIEW**
- Three stars: "Lovely people, great coffee. Cookies were a bit dry." Kind, but honest.
- Reese reads it and goes quiet. "I asked for help, not a grade." A slow week.
- A customer says: "I came for the coffee because of a review." Reese starts testing new cookie recipes at night.
- **Ending:** Reese slides a new cookie across the counter without a word. You take a bite. Reese waits.
- **Gains:** Reese gets real feedback and improves; your word stays credible. **Costs:** Reese feels let down by a friend; a slow week when it mattered most.

**CHOICE B: STAY POSITIVE**
- Five stars: "Best bakery in town!" Reese hugs you over the counter.
- New customers come in. Some love it. A few leave half-eaten cookies and mixed reviews.
- Reese reads them, confused. "Your review said they were perfect."
- **Ending:** Reese, quietly: "Be honest with me. Are they good?" You open your mouth...
- **Gains:** Reese felt backed by a friend; a strong opening rush. **Costs:** Reese never got the feedback in time; your review doesn't match what people found.

**Balance check:** honesty helps the business and strains the friendship now, while support helps the friendship now and leaves the business to find out later.

Status: todo

---

## Episode 11: The Empty Yard
- **Posts:** Fri Nov 13, 2026, 4:00 PM (produce Thu Nov 12)
- **Source:** `02_the_school_garden`, "The School Garden" (approved; short aired Nov 2)
- **Slug:** `the_empty_yard`
- **Cast:** You, a parent on the school committee (`you`); Principal Rowan (`elder`); Bo, a student who wants a garden (`kid`); Pip, a student who wants a play space (`cousin`)
- **Settings:** yard, hall, classroom, field
- **Question (PDF wording):** "Do you make a garden for growing food, or make a play space for everyone?"

**Setup**
- There's one empty yard behind the school and money to build one thing.
- Bo's class has been learning where food comes from. Some families in the neighborhood rarely get fresh vegetables.
- Pip and the younger kids spend recess squeezed onto a strip of concrete. There's nowhere safe to run.
- At the committee meeting the vote is tied. Principal Rowan turns to you: "You decide."

**CHOICE A: MAKE A GARDEN**
- Kids in gloves planting seeds. Bo waters every morning before class.
- Harvest day: Bo carries a bag of tomatoes home, beaming.
- Pip kicks a ball against the wall on the same concrete strip. A teacher says, "Careful, not near the plants."
- **Ending:** Pip helps Bo water and asks, "Can we play here someday?" Bo shrugs. "Maybe next year."
- **Gains:** fresh food for families; kids learn to grow it. **Costs:** the kids who needed room to play still don't have it.

**CHOICE B: MAKE A PLAY SPACE**
- New lines painted, a soft field, goals. Pip's whole class plays together for the first time.
- Recess is loud and happy; shy kids get picked for teams.
- Bo's seed packets sit in a drawer. The garden lesson moves to a few pots on a windowsill.
- **Ending:** Bo shows you one small tomato from the windowsill. "It grew." Outside, Pip scores.
- **Gains:** a safe place for every kid to play; more kids included. **Costs:** no fresh food from the yard; Bo's class loses the garden it worked toward.

**Balance check:** food and play are both real needs for the same kids, and each choice leaves one group waiting.

Status: todo

---

## Episode 12: Moving Day
- **Posts:** Sun Nov 15, 2026, 4:00 PM (produce Sat Nov 14)
- **Source:** `06_the_missing_deposit`, "The Missing Deposit" (approved; short aired Oct 30)
- **Slug:** `moving_day`
- **Cast:** You (`you`); Sam, your partner (`partner`); Jo, Sam's younger sibling (`sibling`)
- **Settings:** moving, home, cafe, home_night
- **Question (PDF wording):** "Do you delay the move, or cover the gap once?"

**Setup**
- You and Sam found the apartment with the balcony. The lease is signed Saturday, deposit split in half.
- Friday night Sam admits: "My half is gone. I gave it to Jo. Jo was about to be evicted."
- Jo, embarrassed, at the café: "I'll pay Sam back. I just needed a month."
- Sam: "I'll pay you back in three months. I promise." You have enough savings to cover it, just barely.
- The landlord has three other couples waiting.

**CHOICE A: DELAY THE MOVE**
- You: "Let's wait until we can both pay our half." Sam nods, but looks stung.
- The balcony apartment goes to someone else. You stay in separate places three more months.
- Sam saves every paycheck. Jo pays back part of it.
- **Ending:** a smaller place, no balcony. Sam: "It's not the one we wanted." You: "But it's half and half." You both smile, a little tired.
- **Gains:** you start even, with no debt between you; your savings stay intact. **Costs:** you lose the apartment you loved; Sam felt judged for helping family.

**CHOICE B: COVER THE GAP ONCE**
- You pay the full deposit. Keys, boxes, pizza on the balcony at sunset.
- Sam pays you back slowly; the first payment is two weeks late.
- One evening Sam's phone lights up: "Thanks again, you're a lifesaver" from Jo. You don't ask. Not yet.
- **Ending:** on the balcony, Sam reaches for your hand. You take it, and glance at the phone.
- **Gains:** you're living together now in the place you loved; Jo kept a roof too. **Costs:** your savings are drained; an unspoken question about money sits between you.

**Balance check:** waiting protects fairness and loses the home you wanted, while covering it wins the home and opens a money question, so it's love and caution on both sides.

Status: todo

---

## Episode 13: One Saturday
- **Posts:** Tue Nov 17, 2026, 4:00 PM (produce Mon Nov 16)
- **Source:** `34_who_do_you_help`, "Who Do You Help?" (approved by owner Oct 20; no short in the 30-day plan)
- **Slug:** `one_saturday`
- **Cast:** You (`you`); Mo, your oldest friend (`friend`); Ellis, a newcomer to town (`stranger`)
- **Settings:** library, moving, street, office, home
- **Question (PDF wording):** "Who do you help?"

**Setup**
- Mo has helped you move twice, sat with you in a waiting room all night, and never asked for anything back.
- Mo is moving Saturday morning and asks: "Can you help? I can't afford movers."
- At the library you've been chatting with Ellis, who just arrived in town, knows nobody, and has a job interview Saturday morning across the city. No car, no one to practice with.
- Ellis, shyly: "Could you drive me and help me prepare? I don't have anyone else to ask."
- You have one car and one morning.

**CHOICE A: HELP MO** (card: "THE ONE WHO ALWAYS HELPED YOU")
- Boxes, laughs, a couch stuck in the doorway. Pizza on the floor of Mo's new place.
- Mo: "I knew you'd show up."
- Ellis takes two buses, arrives late and flustered, and texts: "Did my best."
- **Ending:** a week later Ellis texts: "Still waiting to hear." You type "Good luck" and wonder if a ride would have changed anything.
- **Gains:** you honor years of friendship; Mo's move goes smoothly. **Costs:** someone with no one faced a big day alone.

**CHOICE B: HELP ELLIS** (card: "THE ONE WHO NEVER HAD ANYONE")
- Practice questions in the car. Ellis gets more confident with each answer.
- Ellis walks into the interview standing tall: "Thank you. Nobody's done that for me before."
- Mo moves with fewer hands. A box breaks. Mo texts: "It's fine. Done."
- **Ending:** you call Mo. Mo: "Next time, okay?" A pause. "Yeah, of course." Ellis is still waiting to hear back.
- **Gains:** a person on their own got a real chance and a new friend. **Costs:** a loyal friend felt let down when they needed you.

**Balance check:** loyalty you owe versus need you can see, and the job outcome stays unknown in both branches so neither choice is shown to "pay off".

Status: todo

---

## Episode 14: The Surprise
- **Posts:** Thu Nov 19, 2026, 4:00 PM (produce Wed Nov 18)
- **Source:** `21_the_birthday_plan`, "The Birthday Plan" (approved by owner Oct 20; short aired Nov 10)
- **Slug:** `the_surprise`
- **Cast:** You (`you`); Harper, the birthday friend (`friend`); Rio, the organizer (`friend2`)
- **Settings:** cafe, home, party, yard
- **Question (PDF wording):** "Do you tell the group to change the plan, or keep the surprise they worked hard on?"

**Setup**
- Rio has spent three weeks and real money planning Harper's surprise party: twenty friends, a cake, a playlist.
- Two days before, at the café, Harper says: "Please, no fuss this year. I hate surprises. I just want a quiet day."
- But last year Harper also said: "Nobody ever makes an effort for me."
- Rio, texting you: "Harper is going to LOVE this. Don't you dare spoil it."

**CHOICE A: CHANGE THE PLAN**
- You tell Rio what Harper said. Rio: "Three weeks. The deposits are non-refundable."
- The party turns into a small dinner at home. Harper is relaxed and laughing.
- Rio is quieter all night, eating cake that was meant for twenty.
- **Ending:** Harper hugs Rio: "Thank you for even thinking of it." Rio smiles, a little thin. Harper never knew how much was planned.
- **Gains:** Harper gets the day they asked for. **Costs:** Rio's effort and money are lost; a bit of tension between you and Rio.

**CHOICE B: KEEP THE SURPRISE**
- Lights on: "SURPRISE!" Harper freezes, then forces a smile.
- Harper slips out to the yard for air. You follow. "I told you I wanted quiet."
- Back inside, Harper sees the photo wall Rio made of years of friendship, and tears up.
- **Ending:** end of night, Harper: "That was a lot. And... thank you. I think." Rio is beaming. You're not sure which part Harper will remember.
- **Gains:** Rio's work is celebrated; Harper sees how loved they are. **Costs:** Harper's clear wish was ignored; an overwhelming night.

**Balance check:** respecting what someone says they want versus honoring the love behind a plan, and both endings have someone smiling a little thinly.

Status: todo

---

## Episode 15: No Filter
- **Posts:** Sat Nov 21, 2026, 4:00 PM (produce Fri Nov 20)
- **Source:** `41_every_unfiltered_thought`, "Every Unfiltered Thought" (approved by owner Oct 20; no short in the 30-day plan)
- **Slug:** `no_filter`
- **Cast:** You (`you`); Skyler, your partner of three years (`partner`); a mysterious street vendor (`stranger`)
- **Settings:** street, home, dinner, home_night
- **Question (PDF wording):** "Would that honesty save the relationship or destroy it?"

**Setup**
- You and Skyler are comfortable. Happy, mostly. Sometimes you wonder what Skyler really thinks.
- A street vendor hands you a little clay bracelet: "Whoever wears this says every thought they have about you. Out loud. No filter. One week."
- Keep it playful and clearly make-believe.
- Skyler laughs, then shrugs: "I'll wear it if you want. Your call."
- You hold the bracelet over Skyler's wrist.

**CHOICE A: TURN IT ON**
- Skyler: "You look great today." "I love how you laugh at your own jokes." You grin.
- Then: "I wish you'd put your phone down at dinner." "Sometimes I miss having more time alone." Ouch.
- Late-night talks you've never had before. Some things get fixed. Some things can't be unheard.
- **Ending:** day seven, the bracelet clicks off. Skyler: "Do you still want to know?" You both laugh nervously.
- **Gains:** real closeness; problems out in the open; compliments you never knew about. **Costs:** words that sting and linger; less mystery.

**CHOICE B: LEAVE IT OFF**
- You drop the bracelet in a drawer. Skyler kisses your forehead.
- Life stays gentle: inside jokes, little kindnesses, what goes unsaid stays unsaid.
- Some nights Skyler goes quiet and you wonder what they're thinking.
- **Ending:** you open the drawer, look at the bracelet, and close it again.
- **Gains:** kindness, privacy and calm kept intact. **Costs:** questions that stay unanswered; you'll never know what you didn't hear.

**Balance check:** total honesty brings closeness and hurt together, and keeping filters brings peace and doubt together, so neither looks clearly better.

Status: todo
