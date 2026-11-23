'use strict';

/**
 * Storytelling + educational structures for short-form reels (task T-27493).
 *
 * Source: the team's "Script Storytelling Structures" Google Doc
 * (docs.google.com/document/d/18l4Yw5vWfx_ut06in1kuUjlWe7U4mtPhRM75W1y7gKc), rewritten for AHL:
 * the hero is a client (or Vinitt), the dream result is natural-looking hair and confidence back.
 *
 * The Reel writer (scriptDna.js SYSTEM_PROMPT) uses these to fill blocks 2-5 of its 7-block
 * structure; Hook, CTA and Close stay as they are. Vinitt can name a structure in the brief
 * ("Structure: Hero's Journey"); otherwise the writer picks the one that fits the topic.
 * To add or change one, edit STORY_STRUCTURES or EDUCATIONAL_STRUCTURES below.
 */

const STORY_STRUCTURES = [
  {
    name: "Hero's Journey",
    useWhen: 'a client transformation story',
    beats: [
      'Intro: who the hero is (a client) and the problem. "Two years ago he started hiding under a cap..."',
      'Inflection point: what the problem cost him (photos avoided, wedding stress, confidence).',
      'Rising action: what he tried that failed (oils, cheap patch, a bad transplant, doing nothing).',
      'Climax: the one thing that finally worked (the AHL solution).',
      'Falling action: the result and proof (how he looks and lives now).',
      'Resolution: lead into the CTA — we help people exactly like him.',
    ],
  },
  {
    name: 'About Me',
    useWhen: "Vinitt's own origin story or why AHL exists",
    beats: [
      'Intro: where the story starts — a normal life, a normal role.',
      'Conflict: the event that set him on this path.',
      'Epiphany: what he realised because of it.',
      'Change: what he did next, and where that led to today.',
      'Purpose: the mission — taking people from [pain] to [dream result].',
    ],
  },
  {
    name: 'The Lesson',
    useWhen: 'a bold setback that teaches one clear takeaway',
    beats: [
      'Setback: a shocking or bold line about what went wrong.',
      'Pain points: three things tried with no success, then the one that changed it.',
      'Resolution: the result within a stated time.',
      'Lesson: the one thing this taught.',
    ],
  },
  {
    name: 'The Big Goal / Dream',
    useWhen: 'a journey in progress the audience can follow (a client prepping for a wedding, a brand milestone)',
    beats: [
      'Introduce the dream and where it came from.',
      'Pursuit: the moment they stopped dreaming and started acting (be honest about the fear).',
      'Progress update: what is done, what is next, and the deadline.',
      'CTA invites the audience to follow along and see if it happens.',
    ],
  },
  {
    name: 'Challenge to Victory',
    useWhen: 'someone was told it could not be done',
    beats: [
      'Doubt: someone (or society) said they would never get [dream result].',
      'Initial struggle: the effort put in, and the bad result anyway.',
      'Turning point: the realisation that changed everything.',
      'Solution: the method — a named 3-step framework or an acronym, each step in one line.',
      'Transformation: from [before] to [after], plus the side benefits.',
      'Myth bust: [dream result] is not hard; most people are just doing the wrong things.',
    ],
  },
  {
    name: 'The Breakthrough',
    useWhen: 'one realisation or one action that unlocked the result',
    beats: [
      'Problem: doing [action] and still getting [bad result], even after trying more.',
      'Breakthrough: "until I realised..." or "until I did this one thing..."',
      'Fix: how they came across it, what they did, and the result — or the 3 steps that got them there.',
    ],
  },
];

const EDUCATIONAL_STRUCTURES = [
  { name: 'Tip / Hack', beats: ['Hook: you are about to give away something valuable.', 'The tip in one short line (skip if the hook said it).', 'How-to: the practical steps.', 'CTA: follow for one of these every day.'] },
  { name: 'Myth', beats: ['Hook states or teases the myth.', 'Debunk: why it is wrong.', 'Solution: what to do instead.', 'Promote: subtly, AHL helps people get exactly this result.', 'CTA to where they can learn more.'] },
  { name: 'Viral Video Reaction', beats: ['5-7 sec clip of a viral hair reel.', 'Expert opinion: true or nonsense? If true, why; if not, what to do instead.', 'CTA: follow the expert.'] },
  { name: 'Step-by-Step System', beats: ['Hook.', 'Name the framework or say "here are the X steps".', 'Step 1, Step 2, Step 3 — each in 1-2 short lines.', 'Optional promote: we help people do exactly this.', 'CTA.'] },
  { name: 'Common Mistake', beats: ['Hook names or teases the mistake.', 'Debrief: why it is a mistake.', 'Solution: what to do instead.', 'Optional promote.', 'CTA.'] },
  { name: 'Authority', beats: ['Hook.', 'Social proof: a real result for a client.', 'How-to: the tip or steps behind it.', 'CTA.'] },
  { name: 'Selling the Service', beats: ['Hook: a common pain of the ideal client.', 'Solution: there is a way out.', 'Value: an actionable step-by-step answer.', 'Promote: subtly, AHL does exactly this.', 'CTA.'] },
];

const renderList = (list) =>
  list
    .map((s) => `## ${s.name}${s.useWhen ? ` — use for ${s.useWhen}` : ''}\n${s.beats.map((b, i) => `${i + 1}. ${b}`).join('\n')}`)
    .join('\n\n');

const STRUCTURES_PROMPT = `# STORY & EDUCATIONAL STRUCTURES

If the brief names a structure below (e.g. "Structure: Hero's Journey", "Myth reel"), use it. Otherwise use one only when the topic is clearly a story or one of these educational shapes; if none fits, keep the default 7 blocks.
When you use a structure, its beats REPLACE blocks 2-5 (The Turn, Truth Bomb, Authority, Hard Truth). Keep block 1 (Hook), 6 (CTA) and 7 (Close) exactly as defined above, keep all language, pacing and duration rules, and keep at least one screenshot-worthy line. Label the replaced blocks with the beat names (e.g. [INFLECTION POINT — Xsec]) instead of the default labels.
Never invent a real client's name, age or numbers — write [client] / [X months] placeholders unless the brief gives them.

STORY STRUCTURES

${renderList(STORY_STRUCTURES)}

EDUCATIONAL STRUCTURES

${renderList(EDUCATIONAL_STRUCTURES)}`;

module.exports = { STORY_STRUCTURES, EDUCATIONAL_STRUCTURES, STRUCTURES_PROMPT };
