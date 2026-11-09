/**
 * hookLibrary.js — Meta ad hook types for the Ads Script Writer.
 *
 * Each hook type is a named, repeatable pattern: why it stops the scroll, a
 * fill-in template, and AHL-specific examples. The Ad Angle Agent must tag every
 * angle with one hookType from this list (and use a different type per angle so
 * the set is varied); the Script Writer executes that type's pattern; the Audit
 * Agent checks the final hook still follows it.
 *
 * Source: the "Best hooks for Meta ads" library (Watch-This, Doing-It-Wrong, Pain)
 * plus proven direct-response patterns, rewritten for AHL's audiences.
 *
 * To add or change a type, edit HOOK_TYPES below. Rules every entry must follow:
 * - Templates and examples are STATED, never a question (the First Word Rule).
 * - Never open with Want / Worried / Tired of / Did you know / So / Imagine /
 *   Kya aap — adsScriptValidation.js rejects those openers.
 * - No invented numbers, prices or medical claims in examples; use [placeholders].
 */

const HOOK_TYPES = [
    {
        id: 'watch_this',
        name: 'Watch-This Hook',
        whyItStops: "Describes the viewer's exact situation — not the product. When they feel \"this is about me\", they stop. The more specific the situation, the harder it stops the right person.",
        template: "If you've been [specific struggle] for [time], watch this.",
        examples: [
            "If you've been hiding your crown under a cap for two years, watch this.",
            "If you've been checking your hairline in every mirror since college, watch this.",
            "If you've been putting off your wedding shoot because of your hair, watch this."
        ],
        bestFor: 'MOFU — people who know the problem and are quietly looking for a way out.'
    },
    {
        id: 'doing_it_wrong',
        name: 'Doing-It-Wrong Hook',
        whyItStops: "Names the exact audience and their mistake in one line, with no pitch yet. It opens a loop (\"wait, am I doing that wrong?\") and frames you as the one who knows better.",
        template: 'Most people with [trait] are [doing Y] wrong — here\'s why.',
        examples: [
            "Most men with a receding hairline are hiding it the wrong way — here's why.",
            "Most people with thinning hair are spending on the wrong fix — here's why.",
            'Most hair patch users are choosing the base wrong — here\'s why.'
        ],
        bestFor: 'MOFU — people already trying fixes (oils, fibres, caps) that are not working.'
    },
    {
        id: 'pain',
        name: 'Pain Hook',
        whyItStops: 'No callout, no label — just the pain, stated as a fact. It goes straight to the felt problem and opens a loop (what is the reason?) that only the ad answers.',
        template: 'The reason your [recurring painful outcome] keeps happening.',
        examples: [
            'The reason you avoid group photos has nothing to do with your face.',
            'The reason your hair looks fine at home and thin under office lights.',
            'The reason every patch you tried looked fake from two feet away.'
        ],
        bestFor: 'MOFU / BOFU — when the audience notes list a sharp, specific pain.'
    },
    {
        id: 'callout',
        name: 'Direct Callout Hook',
        whyItStops: 'Names the exact person in the first words, so the right viewer feels singled out and everyone else scrolls past (which is cheaper on Meta).',
        template: '[Exact audience], [specific situation]. This is for you.',
        examples: [
            'Men in their 30s with a thinning crown. This is for you.',
            'Grooms with less than three months to the wedding. This is for you.',
            'Women whose parting is getting wider every year. This is for you.'
        ],
        bestFor: 'BOFU — narrow, well-defined segments ready to act.'
    },
    {
        id: 'contrarian',
        name: 'Contrarian / Myth-Bust Hook',
        whyItStops: 'Contradicts what the viewer believes is true. The brain stops to defend or update the belief, and the ad then earns the right to explain.',
        template: '[Common belief] is wrong. [Short counter-claim].',
        examples: [
            'Hair transplant is not your only option. Not even close.',
            "A hair system doesn't have to look like a wig. This one doesn't.",
            'Bald is not permanent. Bald is a decision.'
        ],
        bestFor: 'MOFU — people stuck between transplant, medicines and doing nothing.'
    },
    {
        id: 'proof',
        name: 'Proof / Result-First Hook',
        whyItStops: 'Shows the end result in the first second (before/after, a real client) and states it plainly. The viewer stops to work out how.',
        template: '[Before state]. [After state]. Same [person / day / chair].',
        examples: [
            'Walked in bald. Walked out with a full hairline. Same afternoon.',
            'Same guy. Same chair. Ninety minutes apart.',
            'This is not a filter. This is his real hair line, today.'
        ],
        bestFor: 'BOFU — needs real client footage; pair with a before/after visual.'
    },
    {
        id: 'objection_killer',
        name: 'Objection-Killer Hook',
        whyItStops: "Opens on the exact fear that stops people buying (slipping, looking fake, gym, rain) and answers it in the same breath.",
        template: '[Fear stated as fact]. [This one / we] [answer].',
        examples: [
            "Your hair system shouldn't survive a workout. This one does.",
            'Rain, helmet, pool. Nobody will know.',
            'Zero surgery. Zero shaving. Full density in five minutes.'
        ],
        bestFor: 'BOFU — audiences who want it but have one specific doubt.'
    },
    {
        id: 'moment',
        name: 'Life-Moment Hook',
        whyItStops: 'Ties the hair problem to a date or event that cannot be moved (wedding, interview, reunion). The deadline turns "someday" into "now".',
        template: '[Event] in [time]. [Hair problem] is not coming with you.',
        examples: [
            'Wedding in sixty days. Your bald patch is not invited.',
            'Interview on Monday. Walk in looking like yourself again.',
            'College reunion next month. Let them notice the right thing.'
        ],
        bestFor: 'BOFU — segments with a known event or deadline.'
    }
];

const HOOK_TYPE_IDS = HOOK_TYPES.map(h => h.id);

function normalizeKey(s) {
    return String(s || '').toLowerCase().replace(/hook/g, '').replace(/[^a-z]/g, '');
}

// Accepts an id ("doing_it_wrong") or a name ("Doing-It-Wrong Hook"); returns the entry or null.
function findHookType(idOrName) {
    const key = normalizeKey(idOrName);
    if (!key) return null;
    return HOOK_TYPES.find(h => normalizeKey(h.id) === key || normalizeKey(h.name) === key) || null;
}

function renderHookType(h) {
    return `## ${h.name} (hookType: "${h.id}")
Why it stops the scroll: ${h.whyItStops}
Template: ${h.template}
AHL examples:
${h.examples.map(e => `- ${e}`).join('\n')}
Best for: ${h.bestFor}`;
}

// Full library as a prompt block, for the Ad Angle Agent.
function renderHookLibrary() {
    return `# META AD HOOK LIBRARY (AHL)
Every hookLine must follow ONE of these hook types. Use the template as a pattern, not as fixed words — adapt it to the audience's own pain point and words. The examples show the level of specificity expected; do not copy them word for word.

${HOOK_TYPES.map(renderHookType).join('\n\n')}`;
}

module.exports = { HOOK_TYPES, HOOK_TYPE_IDS, findHookType, renderHookType, renderHookLibrary };
