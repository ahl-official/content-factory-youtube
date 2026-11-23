/**
 * creativePlaybook.js — Meta creative playbook for the Ads Script Writer (task T-27489,
 * "Meta Ads creative agent" knowledge). Angle, Script Writer and Audit all read it.
 *
 * Written in our own words from public sources: Meta's Reels ads guidance, Meta's Advertising
 * Standards, and 2026 practitioner write-ups on the Andromeda ad-retrieval system. Nothing here is
 * copied from a paid course.
 *
 * The same text lives in meta-ads-dashboard/server/services/mark/creative-playbook.ts for MARK;
 * change both together. The agents' own rules (First Word Rule, MOFU/BOFU only, 15-30 sec,
 * Hook/Body/CTA) win over anything here.
 */

const CREATIVE_PLAYBOOK = `META CREATIVE PLAYBOOK (standing knowledge; the numbers and learnings above win when they disagree)

1. How Meta picks ads now (Andromeda retrieval)
- The creative is the targeting. With broad audiences, Meta decides who sees an ad mostly from what the ad says and shows.
- Prefer few, broad ad sets (location + age/gender only where needed) with several genuinely different ads, over many narrow ad sets with copies of the same ad.
- Near-identical ads (same angle, new colour or one changed word) are treated as one ad and add little. A new ad counts as new when it differs from live ads on at least 2 of:
  angle (the customer argument), format (talking head, UGC/testimonial, demo/process, static, carousel), person on camera, first 3 seconds, look/setting.
- Small edits of a winning ad (new hook line, new cut) are variations inside that concept, not new concepts.
- Meta publishes no "diversity score" or required number of creatives; numbers like "6-15 concepts" are vendor rules of thumb, not Meta rules.

2. Format (Meta's Reels guidance)
- Full-screen 9:16 vertical video, audio on, captions burned in (many watch muted).
- Keep the bottom ~35% of the frame free of text, logos and faces' key detail: the Reels interface covers it.
- The first frame must work as a still: it is what people see while scrolling.
- Advantage+ creative may auto-crop or add effects; check the previews before publishing.

3. Hooks (first 1-3 seconds)
- Describe the viewer's exact situation, not the product. Specific beats general.
- Use the customer's own words (from consultation remarks, comments, DMs) over brief language.
- State, don't ask. Lead with the strongest word.
- Test several hooks on one proven body before making a new body.

4. Body and proof
- One angle for one audience per ad. Get to value fast; no dead moments.
- Show proof: real demo of the process, real (honest) results, testimonial, specialist authority, numbers only if true.
- Answer the main objections for hair: "it will look fake", "it will fall off", "upkeep", "price", "what will people say".

5. Call to action by awareness stage
- Cold / problem-aware: soft CTA (watch, learn, see how it looks).
- Warm / solution-aware: book a free consultation or trial fitting.
- Hot / retargeting: direct CTA with a reason to act now (slot availability, a real offer).

6. Ad copy (primary text, headline)
- Meta cuts primary text after about 125 characters; the first line must carry the hook or benefit on its own.
- Benefits over features, "you" over "we", short lines.
- Useful structures: Problem-Agitate-Solve; Before-After-Bridge; Objection-Answer; Attention-Interest-Desire-Action.
- High-ticket lead ads: pre-qualify in the copy (who it is for, city, that it is a premium service) so fewer junk leads come in.

7. Creative psychology (use honestly)
- Specificity, social proof, authority, curiosity gap, "this is about me" recognition, fear of missing out only when real.

8. Policy for hair / beauty ads (Meta Advertising Standards)
- Never assert or imply the viewer has a condition ("Are you bald?", "your thinning hair"). Talk about situations ("If you've been hiding your crown under a cap...", "Most men who...").
- Before/after must be realistic and not exaggerated; no medical or "cure" claims, no guaranteed results.
- A disapproved ad or a restricted account costs more than a weaker but safe ad.

9. Testing and judging
- Judge creatives on CRM real leads, cost per real lead, consultations and orders, never on Meta "results" alone.
- Give a new ad enough spend to judge before killing it; change one thing at a time when testing.
- Fatigue: when frequency climbs while hook rate / CTR falls and cost per real lead rises, the concept needs a fresh angle, not a new colour.
- A reel that does well organically is a strong candidate to run as an ad.`;

function renderCreativePlaybook() {
    return `# ${CREATIVE_PLAYBOOK}

If anything in this playbook conflicts with the rules above it in this prompt, the rules above win.`;
}

module.exports = { CREATIVE_PLAYBOOK, renderCreativePlaybook };
