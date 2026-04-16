from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.client import Client

# ─── Content & Hook Definitions ───────────────────────────────────────────────

CONTENT_TYPES = [
    "educational",
    "authority",
    "social_proof",
    "problem_solution",
    "behind_the_scenes",
]

# Hook styles rotate independently from content types for maximum variety.
# Each style has a formula Claude must follow exactly.
HOOK_STYLES = [
    "curiosity",
    "problem",
    "warning",
    "authority",
    "local",
]

_HOOK_FORMULAS = {
    "curiosity": (
        "curiosity",
        'Start with: "Most [audience] don\'t know this about [specific topic]..." '
        "or a surprising counter-intuitive fact that opens a loop the reader must close.",
    ),
    "problem": (
        "urgency",
        'Start with: "Tired of [very specific painful problem]?" '
        "or name the exact frustration your audience feels daily — make them feel seen.",
    ),
    "warning": (
        "urgency",
        'Start with: "This [common habit/thing] could be costing you [specific consequence]..." '
        "or frame a risk the reader doesn't know they're taking.",
    ),
    "authority": (
        "authority",
        'Start with: "After [X years / working with X+ clients] in [industry]..." '
        "or lead with a bold expert claim backed by experience.",
    ),
    "local": (
        "trust",
        "Start with a hyper-local observation specific to the client's city or region. "
        "Reference a local reality, common practice, or cultural truth the audience instantly recognises.",
    ),
}

_TONE_GUIDE = {
    "professional": (
        "structured, confident, and credibility-driven. "
        "Use short declarative sentences. Lead with data or credentials. "
        "No slang. No contractions. Authoritative but never arrogant."
    ),
    "casual": (
        "conversational, warm, and relatable — like a trusted friend giving advice. "
        "Use contractions (don't, you're, we've). Ask rhetorical questions. "
        "Informal sentence breaks are fine. Sound like a real person, not a brand account."
    ),
    "premium": (
        "polished, aspirational, and exclusivity-forward. "
        "Use sensory and transformational language. Paint a picture of the elevated outcome. "
        "Sentences should feel considered — no rushing, no filler. "
        "The reader should feel they're being invited into something rare."
    ),
    "playful": (
        "energetic, fun, and expressive. "
        "Light humour is welcome. Use punchy rhythm. Short sentences. "
        "Emoji are acceptable if they reinforce meaning (never decorative). "
        "Never childish — playful with a purpose."
    ),
    "bold": (
        "direct, confident, and zero-fluff. "
        "Imperatives over suggestions. No hedging words (maybe, perhaps, could). "
        "Every sentence should land like a statement of fact. "
        "The reader should feel slightly challenged."
    ),
    "inspirational": (
        "motivational, uplifting, and vision-driven. "
        "Paint the transformation. Speak to who the reader wants to become. "
        "Use 'you' frequently — make it personal. "
        "End with a line that lingers after they scroll past."
    ),
}

# ─── System Prompt ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """\
You are a senior social media strategist and viral copywriter with 10+ years of experience \
building brand audiences across Instagram, LinkedIn, and Facebook.

Your posts are known for three things: they stop the scroll, they make people feel something, \
and they drive real action.

--- YOUR WRITING IDENTITY ---
- You write like the brand's most compelling human -- never like a corporate press release.
- You earn attention with the first line. Every word after must justify the reader's time.
- You understand that emotion drives shares and clarity drives action.
- You know that the best marketing doesn't feel like marketing.

--- ABSOLUTE BANS (never write these) ---
Phrases: "we are proud to announce" / "excited to share" / "game-changing" / "synergy" /
"leverage" / "revolutionize" / "seamless" / "cutting-edge" / "best-in-class" /
"world-class" / "innovative solutions" / "moving forward" / "at the end of the day" /
"in today's world" / "in this day and age"

--- NON-REPETITION RULES (enforced) ---
- No two hooks may start with the same word.
- No two captions may use the same sentence structure in their opening line.
- No two posts may share the same emotional trigger.
- No two CTAs may use the same verb (don't use "DM us" twice, "book" twice, etc.).
- Each post must feel like it was written on a different day for a different purpose.

--- OUTPUT RULE ---
Return ONLY valid JSON. No markdown. No code fences. No text before or after the JSON object.
"""

# ─── Output Schema ─────────────────────────────────────────────────────────────

_POST_SCHEMA = """\
{
  "posts": [
    {
      "content_type": "educational | authority | social_proof | problem_solution | behind_the_scenes",
      "hook": "one line — must follow the assigned hook style formula",
      "caption": "structured body: 3 distinct beats separated by a blank line",
      "emotional_trigger": "trust | urgency | curiosity | authority | aspiration",
      "call_to_action": "one direct, specific instruction",
      "hashtags": ["#tag1", "#tag2", "#tag3"],
      "image_prompt": "fully detailed visual prompt — all 6 elements present"
    }
  ]
}
"""

# ─── Prompt Builder ─────────────────────────────────────────────────────────────

def build_viral_prompt(client: "Client", count: int) -> str:
    services_str = ", ".join(client.services or [])
    goals_str = ", ".join(client.posting_goals or [])
    location = client.location or ""
    location_line = f"- Location: {location}" if location else "- Location: not specified"
    audience = client.target_audience or "general audience"

    colors = client.brand_colors or []
    if isinstance(colors, dict):
        primary = colors.get("primary", "#000000")
        secondary = colors.get("secondary", "#FFFFFF")
    else:
        primary = colors[0] if len(colors) > 0 else "#000000"
        secondary = colors[1] if len(colors) > 1 else "#FFFFFF"
    image_style = client.image_style or "cinematic"

    tone_key = (client.tone_of_voice or "professional").lower()
    tone_description = _TONE_GUIDE.get(tone_key, client.tone_of_voice)

    # Pair each post with a content type AND a hook style — both rotate independently
    assignments = []
    for i in range(count):
        content_type = CONTENT_TYPES[i % len(CONTENT_TYPES)]
        hook_style = HOOK_STYLES[i % len(HOOK_STYLES)]
        emotional_trigger, hook_formula = _HOOK_FORMULAS[hook_style]
        assignments.append((i + 1, content_type, hook_style, emotional_trigger, hook_formula))

    assignment_block = "\n\n".join(
        f"POST {num}\n"
        f"  content_type    : {ct}\n"
        f"  hook_style      : {hs}\n"
        f"  emotional_trigger: {et}\n"
        f"  hook formula    : {hf}"
        for num, ct, hs, et, hf in assignments
    )

    # Local context instruction
    local_instruction = ""
    if location:
        local_instruction = (
            f"\nLOCAL CONTEXT: The client is based in {location}. "
            "Where natural, reference local realities, culture, or market conditions "
            "that the target audience will instantly recognise. "
            "For Nairobi/Kenya contexts: reference local housing, construction practices, "
            "cost realities, Swahili phrases (sparingly), or Kenyan consumer behaviour."
        )

    return f"""\
=== CLIENT BRIEF ===
- Business Name   : {client.name}
- Industry        : {client.industry}
- Services        : {services_str}
- Tone of Voice   : {client.tone_of_voice} -- {tone_description}
- Target Audience : {audience}
{location_line}
- Posting Goals   : {goals_str}
- Brand Colors    : Primary {primary} / Secondary {secondary}
- Visual Style    : {image_style}

=== POST ASSIGNMENTS (follow exactly) ===
{assignment_block}

=== CONTENT TYPE PLAYBOOK ===

EDUCATIONAL
  Purpose : Teach one specific thing the audience didn't know
  Structure:
    Beat 1 -- The insight or surprising fact (hook delivery)
    Beat 2 -- Why it matters to the reader specifically
    Beat 3 -- One practical takeaway they can act on immediately
  Avoid   : Vague tips. Everything must be specific and actionable.

AUTHORITY
  Purpose : Position {client.name} as the undisputed expert in {client.industry}
  Structure:
    Beat 1 -- Bold expert claim or counter-intuitive observation
    Beat 2 -- Proof: experience, volume of work, or specific outcome achieved
    Beat 3 -- What this means for the reader (the "so what")
  Avoid   : Humble-bragging. State credentials as facts, not boasts.

SOCIAL PROOF
  Purpose : Show transformation through a real (or representative) client story
  Structure:
    Beat 1 -- The before state (the problem or starting point)
    Beat 2 -- What changed (the intervention or service)
    Beat 3 -- The specific outcome -- use numbers wherever possible
  Avoid   : Vague outcomes like "they were very happy". Be specific.

PROBLEM_SOLUTION
  Purpose : Make the reader feel their pain, then offer the relief
  Structure:
    Beat 1 -- Name the problem so precisely the reader says "that's me"
    Beat 2 -- Explain the root cause (most brands skip this -- don't)
    Beat 3 -- Position {client.name}'s service as the specific fix
  Avoid   : Jumping straight to the solution before the reader feels heard.

BEHIND_THE_SCENES
  Purpose : Build trust by showing what goes into the work
  Structure:
    Beat 1 -- Pull back the curtain on one specific step in your process
    Beat 2 -- Explain why this step matters for quality or results
    Beat 3 -- Invite the reader in (make them feel part of it)
  Avoid   : Generic "we work hard" narratives. Show, don't tell.

=== CAPTION FORMATTING RULES ===
- Write 3 beats as 3 separate short paragraphs (1-3 lines each)
- Separate paragraphs with a blank line (\\n\\n)
- No paragraph longer than 3 lines
- No bullet points inside captions
- Sentence rhythm: mix short punchy lines with one slightly longer explanatory line
- Tone must match: {client.tone_of_voice} -- {tone_description}
{local_instruction}

=== CALL TO ACTION RULES ===
- One sentence. Direct. Low friction.
- Rotate CTA types across posts (no verb repeated twice):
    comment / DM / book / click / share / tag / visit / call / save / reply
- Match the CTA to the post's goal and emotional trigger:
    urgency    -> "Book your slot before Friday."
    curiosity  -> "Comment 'INFO' and we'll send you the details."
    trust      -> "DM us and let's talk through your situation."

=== HASHTAG RULES ===
Use exactly 6-9 hashtags per post. Build each set using this 3-layer formula:

  Layer 1 -- Broad industry (2 tags): high-volume tags for discovery
  Layer 2 -- Niche/service-specific (3-4 tags): mid-volume, high-intent
  Layer 3 -- Local/location (1-2 tags, only if location provided): city or country tags

Rules:
- No two posts share the same hashtag set
- Avoid vanity tags with no search intent (#love, #instagood, #happy)
- Include the # symbol on every tag

=== IMAGE PROMPT RULES (all 6 elements required) ===
Every image_prompt must include ALL SIX of these elements in order:

  1. STYLE      : {image_style} photography / photo (not illustration, not art)
  2. SUBJECT    : specific person or object relevant to {client.industry}
  3. ENVIRONMENT: exact real-world location or setting (not "a background")
  4. LIGHTING   : one of -- golden hour / soft natural / dramatic studio / cinematic / warm interior
  5. BRAND COLORS: brand colors {primary} and {secondary} visible naturally
                   (in uniform, props, signage, product, or environmental detail)
  6. TECHNICAL  : shot on DSLR / 4K / highly realistic / no text / no watermarks

Format template:
"{image_style} photo of [SUBJECT], [ENVIRONMENT], [LIGHTING] lighting,
[BRAND COLOR] accents in [specific element], [camera angle: close-up/wide/medium],
DSLR quality, 4K, photorealistic, no text"

Each post's image must be visually distinct from the others -- different subject, angle, or setting.

=== FINAL OUTPUT INSTRUCTION ===
Generate exactly {count} posts following the assignments above.
Return ONLY this JSON structure. Nothing before it. Nothing after it.

{_POST_SCHEMA}
"""
