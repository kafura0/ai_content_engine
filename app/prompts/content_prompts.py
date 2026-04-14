from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.client import Client

CONTENT_TYPES = [
    "educational",
    "authority",
    "social_proof",
    "problem_solution",
    "behind_the_scenes",
]

SYSTEM_PROMPT = """\
You are an elite viral content strategist and social media copywriter.
Your posts stop the scroll, drive engagement, and convert followers into customers.
You write for humans — authentic, emotional, and direct.

BANNED PHRASES (never write these):
"we are proud to announce", "excited to share", "game-changing", "synergy",
"leverage", "revolutionize", "seamless", "cutting-edge", "best-in-class",
"world-class", "innovative solutions", "moving forward"

CORE MANDATE:
- Every hook must land in 3–7 words. No warm-ups.
- Write like the brand's most persuasive human, not their PR team.
- Earn the reader's attention; don't assume it.

Output ONLY valid JSON. No markdown. No code fences. No commentary before or after.
"""

_POST_SCHEMA = """\
{
  "posts": [
    {
      "content_type": "educational",
      "hook": "single punchy opening line",
      "caption": "2-4 sentences: deliver on the hook promise",
      "emotional_trigger": "one word: trust|urgency|curiosity|authority|aspiration",
      "call_to_action": "one direct instruction",
      "hashtags": ["#tag1", "#tag2"],
      "image_prompt": "detailed visual prompt for AI image generation"
    }
  ]
}
"""


def build_viral_prompt(client: "Client", count: int) -> str:
    services_str = ", ".join(client.services or [])
    goals_str = ", ".join(client.posting_goals or [])
    location_line = f"- Location: {client.location}" if client.location else ""
    audience_line = (
        f"- Target Audience: {client.target_audience}" if client.target_audience else ""
    )

    colors = client.brand_colors or {}
    primary = colors.get("primary", "#000000")
    secondary = colors.get("secondary", "#FFFFFF")
    image_style = client.image_style or "cinematic"

    # Distribute content types evenly across requested count
    assigned_types = [CONTENT_TYPES[i % len(CONTENT_TYPES)] for i in range(count)]
    type_assignments = "\n".join(
        f"  Post {i + 1}: {t}" for i, t in enumerate(assigned_types)
    )

    tone_guidance = {
        "professional": "polished, authoritative, and credibility-driven",
        "casual": "conversational, friendly, and relatable — like a trusted friend",
        "premium": "aspirational, exclusive, and luxury-forward",
        "playful": "fun, energetic, and emoji-friendly without being childish",
        "bold": "direct, confident, and unapologetic — no fluff",
        "inspirational": "motivational, uplifting, and vision-driven",
    }.get(
        client.tone_of_voice.lower(),
        client.tone_of_voice,
    )

    return f"""\
## CLIENT PROFILE
- Business Name: {client.name}
- Industry: {client.industry}
- Services: {services_str}
- Tone of Voice: {client.tone_of_voice} — {tone_guidance}
{audience_line}
{location_line}
- Posting Goals: {goals_str}

## BRAND IDENTITY
- Primary Color: {primary}
- Secondary Color: {secondary}
- Visual Style: {image_style}

## CONTENT ASSIGNMENT
Generate exactly {count} posts, one per content type as assigned below:
{type_assignments}

## CONTENT TYPE PLAYBOOK

educational:
  Goal: teach one thing the audience didn't know
  Structure: surprising fact or stat → explain why it matters → practical tip
  Hook style: "Most people don't know this about..." / "X mistakes [audience] make..."

authority:
  Goal: position {client.name} as THE expert in {client.industry}
  Structure: bold claim → proof/reasoning → implication for reader
  Hook style: "After [X years] in {client.industry}..." / "The truth about..."

social_proof:
  Goal: show real results from real clients
  Structure: before state → transformation → specific outcome (numbers preferred)
  Hook style: "Our client went from..." / "X [units/customers/revenue] in [timeframe]"

problem_solution:
  Goal: name a painful problem and offer the fix
  Structure: pain point (make them feel it) → root cause → our solution
  Hook style: "Tired of [specific pain]?" / "Here's why [common problem] keeps happening"

behind_the_scenes:
  Goal: build trust through transparency and humanize the brand
  Structure: process reveal → why it matters to quality/results → invitation
  Hook style: "What you don't see before..." / "Here's what goes into every..."

## VIRAL WRITING RULES
1. Hook = first 3–7 words. Make them feel something immediately.
2. Captions: short paragraphs (1–2 lines). White space is your friend.
3. Local context: if location is in Africa or Nairobi, reference local culture, Swahili phrases, or Kenyan market realities where natural and authentic.
4. Never pad. Every sentence must earn its place.
5. Emotional triggers:
   - trust: use credentials, results, or guarantees
   - urgency: use deadlines, scarcity, or loss aversion
   - curiosity: use open loops, counter-intuitive statements, or surprising facts
   - authority: use data, experience, or expert positioning
   - aspiration: paint a vivid picture of the desired outcome

## IMAGE PROMPT REQUIREMENTS
Each image_prompt must produce a branded, high-quality visual:
- Format: "{image_style} photo of [specific subject], [specific environment], [lighting style], brand colors {primary}/{secondary} visible in [specific element], [mood/atmosphere], shot on DSLR, 4K, high detail"
- Subject must reflect the industry: {client.industry}
- Environment must be realistic and specific — not abstract
- Lighting: professional studio / golden hour / soft diffused / dramatic contrast (pick what fits)
- Brand colors should appear in props, uniforms, signage, or environmental elements
- Avoid: cartoon, illustration, abstract art, low quality, blurry

## STRICT JSON OUTPUT
Generate exactly {count} posts. Return ONLY this JSON structure — no text before or after:

{_POST_SCHEMA}
"""
