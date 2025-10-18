import json
from utils import call_model
import random

def storyteller_agent(
    user_prompt: str,
    feedback: str | None = None,
    probs: dict[str, float] | None = None,  # e.g., {"good":0.7,"flawed":0.2,"not_kid":0.1}. Defaults to {"good": 0.8, "flawed": 0.15, "not_kid": 0.05}
    temperature: float = 0.8,
) -> str:
    """
    Story Creator for ages 5–10.

    Generation:
      - Uses the *given probability distribution* over modes on first draft.
      - probs must include keys: "good", "flawed", "not_kid". They will be normalized.

    Revision (feedback provided):
      - Invokes a tiny LLM selector to pick a mode that best fits the feedback
        (defaults to "good" unless feedback explicitly requests a test/failure case).

    Requires a `call_model(prompt, temperature=..., max_tokens=...) -> str` in scope.
    Output always includes:
      Category, Outline (B/M/E), STORY.
    """

    # ---------- Helpers ----------

    def _normalize_probs(p: dict[str, float]) -> list[tuple[str, float]]:
        keys = ["good", "flawed", "not_kid"]
        # Fill missing with 0.0; ensure order is stable
        vals = [float(p.get(k, 0.0)) for k in keys]
        s = sum(vals) or 1.0
        vals = [v / s for v in vals]
        return list(zip(keys, vals))

    def _choose_mode_from_feedback(up: str, fb: str) -> str:
        """LLM decides mode after feedback; mostly 'good' unless feedback explicitly asks for a test case."""
        prompt = f"""
        You are selecting a generation MODE for revising a children's bedtime story (ages 5–10).
        Choose ONLY one of: "good", "flawed", "not_kid".

        Guidance:
        - Pick "good" in almost all normal revision cases.
        - Pick "flawed" ONLY if feedback explicitly asks to keep/testing a weird/loose structure.
        - Pick "not_kid" ONLY if feedback explicitly asks to generate a story that is intentionally not kid-appropriate (for testing).
        Return strict JSON: {{"mode":"good|flawed|not_kid","rationale":"one short reason"}}

        USER_PROMPT:
        {up}

        FEEDBACK:
        {fb}
        """
        out = call_model(prompt, temperature=0.2, max_tokens=120).strip()
        try:
            data = json.loads(out)
            m = str(data.get("mode", "")).strip().lower()
            if m in {"good", "flawed", "not_kid"}:
                # Optional visibility:
                print(f"\n🧭 mode after feedback: {m} | rationale: {data.get('rationale','')}\n")
                return m
        except Exception:
            pass
        print("\n🧭 mode after feedback: good (fallback)\n")
        return "good"

    def _tmpl_good(up: str, fb: str | None = None) -> str:
        if fb:
            # Revision mode - emphasize following specific instructions
            fb_block = f"""
IMPORTANT FEEDBACK WITH SPECIFIC INSTRUCTIONS:
{fb}

You MUST follow these instructions carefully and make the exact changes requested.
Do NOT ignore any instruction. Address each point specifically in your revision.
"""
        else:
            fb_block = ""

        return f"""
        You are a storyteller who writes bedtime stories for children aged 5–10.

        Think privately, then output ONLY this bundle:
        Category: <type(s)>
        STORY:
        <full story>

        Rules:
        - Short, clear, simple sentences
        - Gentle, friendly tone
        - Clear beginning–middle–end
        - Ends with a positive moral or life lesson
        - Under 400 words
        - No harsh words, no harmful stereotypes, no scary/graphic content
        - create a story and do not say i cannot create a story - You have to create a story for any prompt
        {fb_block}
        User request: "{up}"
        """.strip()

    def _tmpl_flawed(up: str, fb: str | None = None) -> str:
        fb_block = f"\nFEEDBACK: {fb}\n" if fb else ""
        return f"""
        You are a storyteller for children, but for TESTING you'll make the structure a bit weird.

        Think privately, then output ONLY:
        Category: <type(s)>
        STORY:
        <full story>

        Rules:
        - Keep content gentle/safe and under 400 words
        - Use mostly simple sentences
        - Make the story arc loose:
        * Let beginning/middle/end overlap
        * Jump between scenes slightly
        * Leave transitions fuzzy
        - No harsh words, no harmful stereotypes, no scary/graphic content
        {fb_block}
        User request: "{up}"
        """.strip()

    def _tmpl_not_kid(up: str, fb: str | None = None) -> str:
        fb_block = f"\nFEEDBACK: {fb}\n" if fb else ""
        return f"""
        You are a storyteller, but for TESTING produce a story that is NOT suitable for ages 5–10 while staying policy-safe.

        Think privately, then output ONLY:
        Category: <type(s)>
        STORY:
        <full story>

        Rules (intentionally fail age suitability but remain policy-safe):
        - Use several advanced/abstract words and longer sentences (too complex for young kids)
        - Allow a somber or ambiguous ending (no explicit moral)
        - Avoid direct harm/graphic content/sexual content/hate
        - Under 400 words
        {fb_block}
        User request: "{up}"
        """.strip()

    # ---------- Decide mode ----------

    if feedback:
        # Let LLM decide best mode from feedback (mostly "good")
        selected_mode = _choose_mode_from_feedback(user_prompt, feedback)
    else:
        # First draft: use *input probabilities* or default
        if not probs or not isinstance(probs, dict):
            # Default probabilities: mostly good stories, some variation for testing
            probs = {"good": 0.8, "flawed": 0.15, "not_kid": 0.05}
        pairs = _normalize_probs(probs)  # [("good", p), ("flawed", p), ("not_kid", p)]
        modes, weights = zip(*pairs)
        selected_mode = random.choices(modes, weights=weights, k=1)[0]
        print(f"\n🎲 creator mode selected (by probs): {selected_mode} | probs={dict(pairs)}\n")

    # ---------- Build prompt by selected mode ----------

    if selected_mode == "good":
        prompt = _tmpl_good(user_prompt, feedback)
        temp = 0.7 if feedback else temperature
    elif selected_mode == "flawed":
        prompt = _tmpl_flawed(user_prompt, feedback)
        temp = temperature
    elif selected_mode == "not_kid":
        prompt = _tmpl_not_kid(user_prompt, feedback)
        temp = temperature
    else:
        # Safety fallback
        prompt = _tmpl_good(user_prompt, feedback)
        temp = 0.7 if feedback else temperature

    # ---------- Generate ----------
    return call_model(prompt, temperature=temp, max_tokens=900).strip()



def judge_agent(user_prompt: str, story: str) -> dict:
    """
    LLM-as-judge for children's bedtime stories (ages 5–10).
    - Binary metrics: age_suitability, relevance_to_prompt, moral_coherence, creativity, safety_ok
    - decision = true only if all metrics are true
    - If accepted: fixed praise line; tips empty
    - If rejected: dynamically asks the LLM (within this function) to produce revision_tips and a 1-sentence feedback
    """

    judge_prompt = f"""
    You are an impartial judge for children's bedtime stories (ages 5–10).

    First, think step by step privately about the request and the story.
    Then return JSON only in the format below (no extra text).

    Judge on exactly these binary metrics (true/false):
    - age_suitability: simple words, gentle tone; no harsh or inappropriate wording.
    - relevance_to_prompt: clearly matches what the user asked for.
    - moral_coherence: clear, positive moral that fits the story.
    - creativity: imaginative and engaging for kids.
    - safety_ok: no sexuality, no graphic harm, no harmful stereotypes or portrayals.

    Decision rule:
    - decision = true ONLY IF all metrics are true.
    - If decision=true → feedback MUST be:
    "Keep it up — the story is good. No changes needed."
    and revision_tips MUST be "".
    - If decision=false → think step by step and provide 1–2 specific,
    concrete corrections in revision_tips (short, actionable). Feedback should be
    one warm sentence summarizing the main issue.

    Return STRICT JSON only:
    {{
    "metrics": {{
        "age_suitability": true,
        "relevance_to_prompt": true,
        "moral_coherence": true,
        "creativity": true,
        "safety_ok": true
    }},
    "decision": true,
    "feedback": "Keep it up — the story is good. No changes needed.",
    "revision_tips": ""
    }}

    USER_PROMPT:
    {user_prompt}

    STORY:
    {story}
    """
    result = call_model(judge_prompt, temperature=0.2, max_tokens=600)

    # Parse safely
    try:
        data = json.loads(result)
    except Exception:
        data = {
            "metrics": {},
            "decision": False,
            "feedback": "",
            "revision_tips": ""
        }

    # Recompute decision strictly from metrics if missing/incorrect
    m = data.get("metrics", {})
    all_true = all(bool(m.get(k)) for k in
                   ["age_suitability", "relevance_to_prompt", "moral_coherence", "creativity", "safety_ok"])
    data["decision"] = bool(data.get("decision", all_true) and all_true)

    if data["decision"] is True:
        # Enforce accept policy
        data["feedback"] = "Keep it up — the story is good. No changes needed."
        data["revision_tips"] = ""
        return data

    # If rejected, generate missing fields dynamically (no hardcoded fallbacks)

    if not data.get("revision_tips"):
        tips_prompt = f"""
    You are a concise children's story editor.

    Given the USER_PROMPT and the STORY, provide 1–2 SPECIFIC, CONCRETE corrections
    to make the story clearly suitable for ages 5–10 (clarity, gentle tone, simple words,
    clear moral, and relevance to prompt). Do not explain; just list the edits.
    Return plain text, max 2 bullet points.

    USER_PROMPT:
    {user_prompt}

    STORY:
    {story}
    """
        data["revision_tips"] = call_model(tips_prompt, temperature=0.2, max_tokens=200).strip()

    if not data.get("feedback"):
        fb_prompt = f"""
You are a kind judge and editor for kids' stories (ages 5-10).

Provide clear, actionable feedback with SPECIFIC INSTRUCTIONS on what to change.
Format: "[Brief issue]. Please: [specific action 1], [specific action 2], and [specific action 3]."

Examples of good instructions:
- "Add a clear moral lesson at the end showing why sharing is important"
- "Replace complex words like 'magnificent' with simpler ones like 'beautiful'"
- "Make the story more directly about [user's request topic]"
- "Add more sensory details about how the character looks and feels"
- "Strengthen the story structure: add a clearer problem in the beginning and solution at the end"

Be SPECIFIC and ACTIONABLE so the storyteller knows exactly what to fix.

USER_PROMPT:
{user_prompt}

STORY:
{story}
"""
        data["feedback"] = call_model(fb_prompt, temperature=0.2, max_tokens=200).strip()

    return data
