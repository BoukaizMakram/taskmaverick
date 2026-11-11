# CEO review — 2026-10-20

Recording: `C:\Users\makra\Videos\2026-10-20 23-39-59.mp4` (11 min, screen share of `/storyboard`). Makram shows the CEO Live Oversight (the "full
board" video, then the Stored history video), Improved Quality ("The tablet and its Knowledge Base", cursor and pop-up line) and Reactive Training ("A
failed audit"). The machine transcript (Whisper large-v3, local) is at the end. Both voices are clear, but the transcript does not say who is speaking: the
speakers below are worked out from the conversation and from what the cursor points at on screen.

**These are the latest decisions. They override the 2026-10-16 column outlines on the overview and the 2026-10-20 "search by = a column's ⋮ menu" for By
Person.**

## What he asked for

1. **On the Live Oversight board, outline ROWS, not columns.** (0:13–3:25)
   - Today an outline goes round a whole column (Open, Claimed…). The CEO: "instead of being up like this, it would be horizontal… what's open would be
     from left to right." Makram: "highlighting rows instead of columns."
   - **What each outline covers:** the rows of missions in that state, from the left (the mission's name) up to that state's column. "You highlight up
     to open."
     - **What missions are aging (open):** the top rows (rows 1–4: Check equipment … Prepare for handoff), from the name to the **Open** column. "You
       have to do from the top, open to here."
     - **What missions are claimed:** rows 5–8 (Tidy work area … Restock supplies), from the name to the **Claimed** column. "From here to just here."
     - **What missions are completed (closed):** rows 9–12 (Storage Room Check … Complete opening check), across to **Closed At**. The gray (stopped)
       timers show that the missions are closed: "these gray things shows that it's been closed."
   - **Why not the whole column:** every row has an Open timer, so an outline round the whole Open column also takes in the claimed and closed missions.
     "To do this, you cannot do this… those are the opened ones, these down are closed and claimed."
   - **The column's title pops with its rows:** "I would pop the word Claimed with it too. And here I would pop the word Open."
   - They agreed this way is clearer (Makram: "what you said is much more clearer"; "the way you told me first, it's much better").
   - Shown on the "full board" video (Videos line, first video). The "overview board" video has the same scenes (aging, claimed, completed).
2. **Reactive Training — a failed checkpoint triggers the lesson at once.** (6:13–7:19)
   - "I don't think we need to get into auditor closed." Drop the steps where the auditor presses Close and the audit is closed.
   - Show it this way instead: **pressing No (Fail) on "Door hinges are in safe condition" triggers the lesson** (the purple line to the three
     Workplace Safety cards). "It's easier to express it where when you say no it triggers that, like for illustration purposes."
   - The rule behind it: **"We don't need to be so loyal to the way the software works. We need to just express the idea that if you identify an issue,
     it triggers the training."**
   - He is fine with the purple connector lines for triggered missions (5:56–6:08).
3. **Live Oversight's Stored history: "by person" is a Group by, on the History board.** (7:25–8:38)
   - Search by mission = filtering by name: Makram asked "filtering by name, right?", and the CEO said "uh-huh".
   - By person (and the other "by …"): Makram asked "the filtering or the group by?" The CEO: **"Group by, I would say."** "You can do it by person with
     group by."
   - It stays on **History**, not in Reporting: "this is not reporting, this is history, right?" — "Yes, yes."
   - Today By Person uses the Closed By column's ⋮ menu (People, Emily Carter, Close, Apply). That has to become the toolbar's Group by.
4. **Big boards: the "By Person" slide is the model.** (8:47–10:47)
   - "Where you have By Person written … this is the right spacing." "Your sides are good, and your bottom also is good spacing. That's how it should
     look." This is the big-board layout: the whole window across the picture, the words in a band under it. He compared it with another video that
     looked different; Makram said he had been trying out ways to show the software.
   - **No gray background, and no white one either: one color.** "You don't need the gray background." He asked to try white, then: "I don't think
     it's going to look good … leave it at the same color. Don't have three colors." White would "lose the UI thing".
   - **The board must not look cut off at the bottom:** "I don't want to see that because it looks like it got cut off at the bottom where you have By
     Person."
   - **Better still, make the board fill the space:** "If you can use the space to make the board be the size of the whole thing, that's even better."
     Makram: "expand the board so that we don't have the spacing." — "Yes, of course … may as well use the space."
5. **Improved Quality pacing: to be worked on with him.** (4:11–5:12)
   - Makram is not happy with the pacing. The pauses he added between the words and the click make it too slow.
   - The CEO watched "The tablet and its Knowledge Base" (cursor and pop-up line): "We'll fix this together. We can edit it together. There's a lot of
     comments on this, but you have the infrastructure in place … it's the right strategy."
6. **Next steps.** Finish the other boards first; the CEO will then go through them with Makram: "I just want you to finish and then I'll go with you",
   "just from a high level comments" (3:36–3:51). Fix the points above, "and then I can sit with you and tell the story in the context of this art"
   (10:53–11:00).

## The user's decisions on these notes (2026-10-21)

- **Rows, with the column title, for the missions:** open, claimed and closed each outline two things: the rows (from the name to that state's column)
  and the column's title on top ("Open", "Claimed", "Closed At").
- **"Who Is Performing" is gone:** it says the same as "Who Performed Each Mission". That one, and "The Execution Duration", outline **the column**
  (not rows).
- **The failed audit:** a Fail draws a purple line to a mission, the audit scrolls down, another Fail draws a line to another mission. Only the idea
  of missions being triggered; no Close.
- **Big boards edge to edge:** no light gray background behind the board. The board spans the whole picture with the gray band under it for the
  words, as big as possible.

**Done (2026-10-21):**
- Live Oversight: `lib/sections/live-oversight.mjs` (marks `{rows, to}` + `{head}`; `fb-performing` and `performing` removed), measured by
  `lib/sections/rows.mjs` and `extract`. The full board is 1600 × 768 with the words in the band (`LiveOversightStage`, `UNDER`).
- Every big board in every video: `BOARD` in `components/storyboardPlayerDom.js` (margin 0, the window down to the band, square, no shadow).
- Reactive Training: `AuditView` in `components/sections/ReactiveStage.jsx` (the lessons Workplace Safety and Fire Safety, lines measured from the
  Fail buttons), the `audit` chapter and its steps.
- Both boards were recaptured. Their videos were not watched.
- By Person (point 3): the toolbar's Group by → Person on History (`board-group-by`, `board-group-Person`, `historyByPerson`); Live Oversight
  recaptured.
- **Still open:** the survey scene still closes the survey before its lesson.

## Where it stood before those decisions (2026-10-21)

- **Done after the meeting (the user, 2026-10-21; Improved Quality pacing, point 5):**
  - The words are written before any highlight, pop or click (`wordsFirst`).
  - There is no reading pause between the words and the action (`SAY_TAIL` 0.2 s).
  - The Knowledge Base's cards come in one by one over the dimmed board (`stagger`). See `docs/storyboard.md`, "The words first…".
- **Not done yet:**
  - **1 (rows).** The outlines are still columns: `marks: [{col: 'open' | 'claimed' | 'closed'}]` in `lib/sections/live-oversight.mjs` (`fb-aging`,
    `fb-claimed`, `fb-completed`, and `aging`, `claimed`, `completed` in the overview board video). The art is `OverviewScene`.
  - **2 (Reactive Training).** Chapter `audit` in `lib/sections/reactive-training.mjs` still presses `close`, and its `end` folds the audit into a
    closed card. The detailed steps still say "The auditor taps Close." and "The audit is closed."
  - **3 (By Person).** Chapter `byPerson` in `lib/sections/live-oversight.mjs` still uses the Closed By column's menu.
  - **4 (board size).** `BOARD` in `boardLayout` (`components/storyboardPlayerDom.js`: 24 px margins, a 132 px band) keeps the window's own height. It
    cuts the window at the bottom only when the window is taller than the room, so a short page leaves white space and ends just above the band.

## Open questions (not settled in the meeting)

- **The other column scenes on the overview** (Who is performing, Who performed each mission, The execution duration): not discussed. Following his
  logic, each would outline only the rows it is about: Claimed By on the claimed rows, Claimed By on the closed rows, Duration on the closed rows.
- **The overview board video** (not only the full board video): it has the same aging, claimed and completed scenes. Most likely it takes rows too.
- **"The size of the whole thing":** the board as tall as the room above the words, keeping the side margins he called good. Or the board edge to edge
  ("so that we don't have the spacing").
- **"Or written" (7:23)**, said right after the Reactive Training point: unclear (perhaps the written-notice lesson).

## Transcript (machine)

Whisper large-v3 with its silence filter dropped 0:13–1:00 and 4:39–5:12; those spans were run again without the filter (marked †).

```
[00:13] † And what I want to do
[00:30] † I'm wondering if the circle, the yellow, instead of being up like this, it would be horizontal with what's open would be from left to right.
[00:57] † So you can show what missions, you understand?
[01:00] Yes, I understand.
[01:02] Can you show me how, with your cursor?
[01:04] So, basically, highlighting rows instead of columns.
[01:08] Yeah, but highlight what? You highlight up to open. You understand?
[01:15] Share.
[01:16] Okay.
[01:17] So, what missions are open would be the yellow here, here, come up from here, and here.
[01:31] Got it.
[01:32] Missions are claimed would be this, to this, and it'll be like this. You understand?
[01:39] Yes.
[01:40] And what missions are closed, it would be to here.
[01:43] Got it.
[01:44] You understand?
[01:44] Yes.
[01:47] And I think that will give you more like, these are the missions that are open. These are the missions that are claimed. Do you think it's clearer, or should we do it like this?
[02:01] I think what you said is much more clearer.
[02:05] Now, if you want to do this, like you just said, what missions are open, take us back to open for a moment. Let's just say back to here. Okay, let's go back to here.
[02:14] Okay.
[02:15] To do this, you cannot do this. You have to do this.
[02:22] Yeah, because those are the opened one. These down are closed and claimed.
[02:28] Yeah, so you have to do from the top, open to here.
[02:32] Yep, yep.
[02:33] And then claimed, you're going to do from here to just here. And then closed, you're going to do basically...
[02:44] Here.
[02:47] You understand?
[02:48] Yes. Yes, I do.
[02:50] I think so, the way you told me first, it's much better. Since we're not going to highlight this section here, we can just like highlight the whole thing to show these are the missions and these gray things shows that it's been closed. Same for the claimed.
[03:10] If you get the claimed and you do this, and you want to pop.
[03:19] These, I would pop the word claimed with it too. And here I would pop the word open.
[03:25] Okay.
[03:26] Right.
[03:28] Okay, what else?
[03:30] Yeah, so basically that's it. That's what I'm trying to do. I've done these ones. I can show you.
[03:38] Just like there's a lot here, as you can see, we cannot... Do you want me to go like through them one by one?
[03:45] No, because I just want you to finish and then I'll go with you.
[03:49] Yeah.
[03:49] Just from a high level comments.
[03:51] Exactly. Yeah. So basically it's just the same thing on all of them. I didn't do some of the UI here, so I'm trying to figure out a better way to do it, a faster way. But for these ones are mostly done. I was working also on this one, improved quality. I'm not happy with the pacing still. I'm trying to test different ways.
[04:21] Here I added some pauses between texts and then the click and then text and then pause, then click. But I'm not really happy with this because it's so slow.
[04:35] Start from the beginning.
[04:37] Okay. I would love your comments on this.
[05:00] † Yeah, we'll fix this together. We can edit it together. There's a lot of comments on this,
[05:06] † but you have the infrastructure in place. It's the right strategy.
[05:16] Okay, perfect. So, one are still in progress. But basically what I've done is most of the work is already done. Like it's so easy to put like the UI here. It didn't take me much time because of what we built.
[05:35] Do you want, for example, this reactive training? I want to show you this.
[05:44] I have videos, videos in details and with the pop-up, yeah.
[05:54] So, for this one, I've used that purple line that we used before to show that missions get triggered like this.
[06:07] Yeah.
[06:08] So, you're fine with this type of UI here?
[06:13] I want to see how the safety audit led to this. So, start from the beginning. So, how did you fail a safety audit?
[06:25] Door hinges are safe. It failed. So, what is going to happen is I don't think we need to get into auditors closed. Okay. Here, it's easier to express it where when you say no, it triggers that like for illustration purposes.
[06:49] Got it. I think I've done it here or something like that. No, not this one. But I get your point. We already did that one. So, I tried it in different places.
[07:02] Yeah. We don't need to be so loyal to the way the software works. We need to just express the idea that if you identify an issue, it triggers the training.
[07:19] Okay. Perfect.
[07:20] Right?
[07:21] Yes.
[07:23] Or written.
[07:25] This one will be a dumb question, but I would love to know.
[07:32] In live oversight here. Yeah, this one. So, what you said here is you go to history, then we see missions. And here, search by missions. So, you're talking about the filter, filtering by name, right?
[07:59] † Uh-huh.
[08:05] And for this one, yes. When you go to by person, by mission.
[08:13] You also talk about like the filtering or like the group by?
[08:18] Group by, I would say.
[08:20] Okay. Okay. So, that makes it easier on me.
[08:26] Is this history or is this, this is not history. This is, it's not reporting. This is history, right?
[08:34] Yes. Yes.
[08:35] Yeah. You can do it by person with group by. Yeah.
[08:38] Okay. Okay. Perfect.
[08:40] Yeah.
[08:40] That's, those are my questions. And I'm still working on the others. I think.
[08:47] Now, look at this, by the way.
[08:49] Okay.
[08:50] Where you have by person written, right?
[08:52] Yes.
[08:53] This is the right spacing. So, I don't know why you had that one [looking different].
[08:57] That was, that was just like, I was trying to figure out different ways to show the software.
[09:03] Yeah, yeah, yeah.
[09:03] As you can see here.
[09:04] But you're on the same page with me. You're on the same page.
[09:06] Yes, of course.
[09:06] So, if you look at your sides, your sides are good.
[09:09] Yeah.
[09:10] And your bottom also is good spacing.
[09:13] That's how it should look.
[09:15] I was trying to figure out, should I keep like the gray background or like these different.
[09:20] No, no, you don't need the gray background.
[09:25] So, like, keep it like this, basically.
[09:30] Try a white background. Can you do it on the fly or no?
[09:33] Yes, I can. I can do it in the storyboard much [better].
[09:51] But I don't think it's going to look good, actually, Makram.
[09:54] I think, I think leave it at the same color. Don't have three colors.
[10:01] Okay, perfect.
[10:03] Yeah, I don't think it's going to look good because it's going to lose the UI thing.
[10:08] I agree.
[10:09] Yeah, I think you leave a little corner, but I don't want to see that because it looks like it got cut off at the bottom where you have by person.
[10:18] Got it.
[10:18] But the spacing is fine.
[10:20] Okay, I'll fix that, of course.
[10:23] I mean, if the board, if you can use the space to make the board be the size of the whole thing, that's even better.
[10:36] Yeah, I can do that. Like expand the board so that we don't have the spacing.
[10:40] Yes, of course.
[10:41] Yeah, that'll be the space.
[10:44] May as well use the space.
[10:47] That'll be easy.
[10:51] Great effects.
[10:53] So let's let you go for another day and see what happens.
[10:56] Okay, fix this, and then I can sit with you and tell the story in the context of this art.
[11:02] Okay, sir.
[11:03] Thank you.
[11:04] Sounds good.
```
