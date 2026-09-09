// Content-rule validation for generated ad scripts — catches the mechanical rule
// violations that prose-only prompting doesn't reliably prevent, especially on
// weaker fallback providers. Runs on top of (not instead of) the zod schema check
// that already happens inside generate().

const SOFT_OPENER_RE = /^(want|worried|tired of|did you know|so\b|imagine|kya aap)\b/i;
const LABEL_LEAK_RE = /\b(HOOK|BODY|CTA)\s*:/i;
const MIN_RUNTIME_SECONDS = 10;
const MAX_RUNTIME_SECONDS = 35;

function validateScriptOutput(script) {
    const violations = [];
    if (!script || typeof script !== 'object') {
        violations.push('Missing script object.');
        return violations;
    }

    const hook = (script.hook || '').trim();
    const fullScript = script.fullScript || '';
    const runtime = script.estimatedRuntimeSeconds;

    if (SOFT_OPENER_RE.test(hook)) {
        const preview = hook.split(/\s+/).slice(0, 5).join(' ');
        violations.push(`The hook opens with a soft question/filler word ("${preview}..."). Rewrite it to open with a stated claim or concrete pain point instead — see the First Word Rule.`);
    }

    if (LABEL_LEAK_RE.test(fullScript)) {
        violations.push('fullScript contains literal "HOOK:"/"BODY:"/"CTA:" labels. Remove them — fullScript must be pure spoken lines and pacing directions only.');
    }

    if (!/runtime/i.test(fullScript)) {
        violations.push('fullScript is missing a stated "Runtime: ~XX sec" line at the end.');
    }

    if (typeof runtime !== 'number' || runtime < MIN_RUNTIME_SECONDS || runtime > MAX_RUNTIME_SECONDS) {
        violations.push(`estimatedRuntimeSeconds (${runtime}) must be a number between ${MIN_RUNTIME_SECONDS} and ${MAX_RUNTIME_SECONDS} seconds — this is a Meta ad, not long-form video.`);
    }

    return violations;
}

module.exports = { validateScriptOutput };
