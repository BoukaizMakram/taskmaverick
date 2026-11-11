# CEO review — 2026-10-16

Recording: `C:\Users\makra\Videos\2026-10-16 23-52-11.mp4` (16 min). The CEO and Makram watch the storyboard's videos: Live Oversight
(the overview board: "What missions are aging", "claimed", "who is performing", "the execution duration"), Requesting Maintenance, the
Improved Quality web report, Precision Planning (the old Planning Dashboard) and Reporting & AI (the evidence photo). Machine transcript
(Whisper large-v3, local) at the end; only his side is clear. 14:16–15:46 is an interruption (people coming in).

**This overrides the 2026-10-01 rule "the hand is for buttons only":** the hand now also points at what is only shown, then leaves.

## What he asked for

1. **Point, then leave.** The words come first ("this is my statement: what missions are aging"), then the hand shows the thing
   ("see"), then it disappears. "We certainly don't point and speak at the same time." (0:35–1:12)
2. **What it does:** "What missions are aging" → the hand goes to **Open** and pops it, the hand disappears; "What missions are
   claimed" → it goes to **Claimed** and pops it. "Give me the feel that you're driving me to something." (0:09–0:35)
3. **No hand waiting between scenes** (instruction → alert): it disappears and comes back out of the words, "so it's always in
   context of words". **Step by step is the exception:** it can stay through the steps, then disappear. (1:13–1:56) A hand that
   stays keeps his eyes on it while the writing happens elsewhere. (2:06)
4. **Click and go.** After a press the hand disappears; "if you want to close the picture … make the hand appear again and close
   it". "Anytime I see the hand appearing, it's a cue to look there." Ideally it starts from the words. (12:20–13:43)
5. **The yellow circle, with a small pop** when the hand points: "a little pop … not huge". (4:50–5:29)
6. **Big boards: words at the bottom.** Writing on the right loses too much room on the overview, the knowledge library, the
   reports and the planning. Show the board on the full image, the words in a band under it (cut the board by about 1–1.5 rows
   if needed: "enough to write a comfortable sentence without cramming"). (3:02–6:51, 8:51–9:11, 10:38–10:43)
7. **On those boards the finger does not fly up from the words:** it appears on the thing (e.g. Open), the circle comes out of
   the finger ("as if the finger, when you press it somewhere, creates a circle"), it pops, the finger disappears. With the words
   on the right the finger can still come from them (a short way). Same for who's performing and the duration. (6:51–8:49)
8. **The board must look like the board, and the live heartbeat (the timers) has to be moving.** (2:15–2:25)
9. **Text size:** the words 26 (they were made smaller), the intro about 36 (it was 60). Confirmed by Makram on 2026-10-19:
   words 26, titles 36. (10:51–11:48)
10. Asked whether Training and Risk were staged yet (10:02). The vision: many short videos an AI can serve when people ask
    questions (13:47–14:16).

## What was done (2026-10-19)

All in the video player (`components/storyboardPlayerDom.js`); see `docs/storyboard.md`, "The CEO's review of 2026-10-16".

- 1–3, 7: `pointMarks` (the words, then the hand on what is outlined, the circle out of its fingertip, the hand leaves);
  `keepCursor` is off; a press after which there is something to look at makes the hand leave (`rest` → `clickOut`, `leave`
  on a section's act); a run of presses (step by step) still glides.
- 4: Reporting & AI: the hand opens the photo, leaves, comes back to press ×, leaves, opens the video.
- 5: every outline is a card of what it is round, its yellow border on, lifted 5 % (`popMarks`, `spotsAt`).
- 6–7: `boardLayout`: a slide whose software is the web window shows its whole page across the picture, the gray side is a
  band under it with the words in the middle; on those boards the hand appears in place (no glide from the words). Precision
  Planning's page is now 1600 wide.
- 8: `timerPlan` / `tickTimers`: the sections' running timers count up in real time across the slides and stop when closed.
- 9: the words were already 26 (the video text editor, 2026-10-17); titles are 36 in the videos (`setTitleFont`).

**Then the user (2026-10-19), over points 1, 3 and 4:** "the pop up style is good, but don't fade out the cursor between two thing, it should just move to next
place pop then so on, change allllll of them": in every video the cursor stays from one thing to the next and glides there, the next thing pops; it fades only after
the last thing of a run (`keepHand`).

## Transcript (machine, his side)

```
[00:00] top saying open claimed closed where is that i'm not seeing it i get it so if you're trying to find
[00:09] yeah so we need to make it look like it to tell the story and it's going to be like what missions
[00:16] are aging the the hand has to go to the word open and then you show that you put like something or
[00:23] you pop it and the hand disappears what missions are appending it goes to that claimed pops it
[00:29] you put the hand on claimed and it pops it right just give me the feel that you're driving me to
[00:35] something okay so let's practice the idea that the hand shows something and disappears and then
[00:43] the words come up and they send the hand again because the hand is like i'm gonna say something
[00:49] look so think about how we talk to each other i want to show you the red car here and then it can
[00:57] become green here right
[00:59] i don't just point at the red car and i say look there i want to show you the red car that's not how
[01:06] we speak and we certainly don't point and speak at the same time right so that's what we're gonna
[01:12] do like look at me here this is my statement what missions are aging see what missions are
[01:18] claimed see right and here in this case the hand has to leave because you keep the hand
[01:24] on the screen when you're going from say instruction
[01:29] to alert but also it may be a good idea to take the hand disappear it and bring it back from the
[01:36] words so it's always in context of words so we may want to explore that because i know in the prior
[01:42] we move it around but when you're doing step by step you go of course it can stay and then it
[01:50] should disappear and then you put the words and it comes back from the words and then you have this
[01:56] connection to the text okay
[01:59] so that's one correction i would say play it continue playing it let me see what else i have in terms of comments for you
[02:06] you see by keeping the hand there my eyes stay on the hand but you're starting to write somewhere else so i don't look
[02:12] you understand
[02:14] yeah okay
[02:15] but i like it overall makram but it has to also reflect the board how it looks and when it's
[02:20] showing the light heartbeat you gotta show it like moving right
[02:25] see everything right okay
[02:28] so
[02:31] i got it
[02:32] i got it
[02:32] I don't need to know why it's not that, but let's go with the feedback.
[02:36] Yeah, as long as we are on the same page,
[02:39] I don't need to know the background of why it is like that.
[02:41] Now you know what to do.
[02:43] Okay, what else do you want to show me?
[02:50] Yeah, so, yeah, I think the hand should be coming from the words
[02:59] and then we'll improve the words at the end.
[03:02] Go to this overview board.
[03:04] I also have an issue with the big boards.
[03:07] The big boards, maybe we need a different strategy on the big boards.
[03:12] So go to the overview board.
[03:18] Yeah, this here, any big board, okay, any big board,
[03:23] I'm losing a lot of space on the right when I write on the right.
[03:29] I want you to figure out another strategy of how I can write on the big boards.
[03:36] Like take me back to the overview board.
[03:39] Okay, let's start.
[03:48] Stop here for a second.
[03:51] I'm trying to think, in this case only, if the words should be at the bottom,
[03:58] I can use the horizontal space, but in the wide boards,
[04:04] instead of putting the words on the right, maybe they should be on the bottom
[04:09] and the hand comes from the bottom to point at things,
[04:13] or they could be, I don't see them on the top,
[04:18] and I don't like to see them in the middle of the board,
[04:22] although there is an argument for that.
[04:25] But can you quickly, or does it take a long time,
[04:28] make a copy of this and show the board on the full image
[04:31] as opposed to on the small image?
[04:34] Like, yeah, let's try that, Makram, just for the big boards.
[04:50] You see how you have this yellow circling?
[04:52] That's a good idea, but pop it a little bit when you point with the hand, right?
[04:56] Yeah, yeah.
[05:13] Do cursor, do highlight and pop.
[05:20] I think we need a little pop.
[05:21] What do you think?
[05:24] Not a lot.
[05:25] Don't pop it like where it becomes, you know, huge.
[05:29] Yeah, give it a little, yeah.
[05:31] Yeah.
[05:35] Yeah.
[05:36] Yeah, yeah.
[05:37] Yeah, yeah.
[05:38] Okay.
[05:46] Yeah, that's not funny.
[05:48] That's not funny.
[05:49] That's smart.
[05:49] Very nice.
[05:50] I love it.
[05:52] That's a good job.
[05:53] No, I can see you're creating a lot of systems for the future,
[05:58] and it's amazing.
[06:01] So let's try to put this board on the full screen
[06:04] and see where we can put the words.
[06:17] My feeling is we're going to like it best at the bottom
[06:21] by cutting the board in the bottom by about two timers
[06:27] or a single timer, I don't know, and write it at the bottom.
[06:42] Yeah, not too.
[06:43] Maybe you need the mission, like one and a half.
[06:46] I don't know.
[06:46] Enough to kind of write a comfortable sentence without cramming.
[06:51] And now when you're writing at the bottom,
[06:55] it would be silly for the finger to come from the bottom
[06:59] all the way to the top to press on open.
[07:02] So what I would do is I would circle it, okay,
[07:08] and pop it because it's natural when the finger goes from the word,
[07:13] on the right to the left.
[07:15] I feel like that's a natural feel.
[07:18] If it's going to climb from the bottom, I feel it's too much.
[07:24] So what I would do, Makram, imagine this,
[07:27] and let's see if we're on the same page with imagination.
[07:30] I write the words at the bottom, and then I put the finger,
[07:34] it appears on the top at open, and it circles.
[07:38] So the finger has finger.
[07:43] And circle.
[07:44] So the finger doesn't have to come from the words.
[07:47] It just pops on the top, and the circle comes from the finger.
[07:51] As if you're saying, look here, this area, right?
[07:54] And then it disappears.
[07:56] And then when we put the new words, finger, circle.
[08:00] So we don't want to climb the finger from the bottom to the top.
[08:04] But when you do words on the right, the finger can go from left to right.
[08:08] It's not a lot of distance.
[08:10] I feel like.
[08:11] It's a lot of distance to fly the finger from the bottom.
[08:16] Now, when it comes to having the words saying, look who's performing, same thing.
[08:24] You take the finger to a person's name, you pop it, you circle it and pop it at the same time.
[08:31] Look at the duration.
[08:32] You take your finger there.
[08:33] So what we're going to do, instead of having the finger travel from the bottom when we're doing boards,
[08:38] it just appears where it needs to appear.
[08:41] And then it circles, as if the finger, when you press it somewhere, it creates a circle of what you're showing me.
[08:48] You understand?
[08:49] That's a different motion that we're going to use.
[08:51] And you use this motion with boards.
[08:54] When we do the knowledge library, when we do the reports, when we do the overview, the planning.
[09:02] Because we don't want to write on the right.
[09:05] It's taking a lot of space.
[09:06] And to highlight these boards, it's better to show them horizontally.
[09:11] And lose vertical space on the boards.
[09:16] Right?
[09:18] Yeah.
[09:19] And if you want to keep going, are you going to work this weekend at all on this?
[09:34] Anyway, if you decide to, it's fine with me.
[09:39] Okay?
[09:39] But if you can't, that's fine.
[09:42] But if you wanted to, you have the ability to do it.
[09:47] If you wanted to continue going.
[09:49] And yeah, let's do that.
[09:52] Anything else you want to show me from this?
[09:56] Okay.
[09:57] Yeah.
[09:58] Okay.
[09:59] Show me what videos did you stage so far?
[10:02] Did you stage anything on training and risk or not yet?
[10:25] Show me precision planning, Makram.
[10:34] Yeah, yeah, yeah.
[10:35] I got it.
[10:37] So, yeah.
[10:38] Let's use the bottom.
[10:39] As you can see, it's going to be better.
[10:41] Okay?
[10:43] We have a lot of valuable real estate horizontally that we need.
[10:51] Makram, I feel like the writing on the right, we made it smaller, didn't we?
[10:55] Or this is...
[10:56] This is the size we decided.
[10:58] What size you have there?
[11:02] How much is it?
[11:06] Are you sure 35 we said?
[11:07] Or we said 26?
[11:16] No, that's the one, Makram.
[11:18] I think 26, that's the size that we did.
[11:21] Here it is.
[11:24] Right?
[11:24] You remember?
[11:26] And the 35, what we went on the front, Makram, when you were at 60.
[11:30] What is your intro?
[11:31] Show me the intro.
[11:33] You were at 60 and we went down.
[11:34] What is your intro showing?
[11:40] Okay.
[11:41] It's not 30.
[11:42] I think it's 36 here.
[11:46] Remember?
[11:48] So, make these corrections.
[11:50] Yeah.
[11:52] Okay.
[11:59] So, look at this.
[12:01] Look at the hand, Makram.
[12:02] Here, here.
[12:02] Just replay.
[12:04] Okay?
[12:04] Let's see.
[12:06] Okay.
[12:07] Let me see.
[12:08] Just start it from the beginning.
[12:11] Okay.
[12:20] So, Makram, you could point with the finger.
[12:22] You see how you brought this finger here?
[12:24] You see how you brought it here?
[12:25] When you press on it, Makram, when you press on it, make the hand disappear.
[12:29] Okay?
[12:30] Okay.
[12:30] And then, yeah, we don't need this hand there.
[12:33] Okay?
[12:34] But if you want to close the picture, you want to get fancy, make the hand appear again and close it.
[12:39] You understand?
[12:39] Give me this feeling of like, hey, press here, press there, right?
[12:42] But don't keep it on my face, the hand sitting there.
[12:45] You understand?
[12:49] Yeah.
[12:49] Disappear.
[12:50] That's it.
[12:51] Yeah, exactly.
[12:52] Click and go.
[12:53] So, I can focus.
[12:54] And then this way, anytime I see the hand appearing, it's a cue to look there.
[12:59] But if you keep it there, I stop looking at it.
[13:02] Because I don't know.
[13:02] I don't know that it's pointing something new or it's been sitting there all this time, right?
[13:07] So, it's got to point and leave.
[13:10] And ideally, it starts from the words, Makram.
[13:13] So, I'm reading the words and I see the hand going, whoo, okay, look here.
[13:19] And then the words send it.
[13:20] In some instances, we have to kind of use our own feeling.
[13:23] Like, does it work or does it not work from the words?
[13:26] But overall, you're telling me something.
[13:29] I'm looking at you.
[13:30] And you point your finger.
[13:31] I'm looking at you.
[13:32] I see your finger.
[13:33] If I'm looking somewhere else, it doesn't matter if you point your finger.
[13:37] I don't see it.
[13:39] Right?
[13:40] So, mimic reality as much as possible.
[13:43] Then we end up with a demo.
[13:44] We end up with the equivalent of a demo and better than a demo.
[13:47] Because now with this style and your ability to edit the words on the fly,
[13:53] we can create all kinds of videos easily that speak better than a salesperson.
[13:58] And then we can take them into the next level where you can ask AI,
[14:02] you can ask AI questions, and it'll show you the right video.
[14:07] Yeah.
[14:08] Yeah, then we can create 1,000 small videos that's constantly to AI, okay?
[14:16] One second.
[14:18] Yes, Neil.
[14:20] Good, good.
[14:22] I just have some people coming, Randall.
[15:46] I'll call you when I'm ready.
[15:48] Okay.
[15:50] We're on the same page?
[15:54] Okay, Makram.
[15:55] Thank you.
```
