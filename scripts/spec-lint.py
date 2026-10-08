# Vendored from the CLEAR framework (~/clear-framework/scripts/spec-lint.py),
# framework 1.0.0 rev 20d296c — CF-05: the Tier D spec gate must be reproducible
# from a fresh checkout without an external CLEAR_FRAMEWORK_DIR. Update by
# re-copying from the framework and bumping this note.
#!/usr/bin/env python3
"""Lint specification markdown against the CLEAR spec-quality scorecard.

Implements the ten rules of docs/quality/spec-quality-scorecard.md as
checkable heuristics. CLEAR owns the policy; this tool is optional tooling an
adopter runs at Intent Lock, Specification review, or in a gate.

Usage:
    python3 scripts/spec-lint.py SPEC.md [SPEC2.md ...] [--glossary FILE] [--json]

Exit codes:
    0  no Tier D (error) findings
    1  at least one Tier D finding — blocking for L2+ locks
    2  usage error / unreadable input

Findings are matched against the scorecard rule numbers (1-10) and tiers:
    [D] Tier D — deterministic control, gate may block
    [G] Tier G — guidance, review lens
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

VAGUE_QUALIFIERS = [
    "quickly", "fast", "robust", "seamless", "intuitive", "user-friendly",
    "efficient", "scalable", "appropriate", "adequate", "optimal", "better",
    "improved", "extensive", "comprehensive", "performant", "asap",
    "as soon as possible", "state of the art", "best effort", "significant",
]
AMBIGUITY_MARKERS = [
    "etc.", "and/or", "as needed", "if necessary", "tbd", "to be determined",
    "some way", "where applicable", "if applicable", "as appropriate",
]
TECH_TERMS = [
    "React", "Vue", "Angular", "PostgreSQL", "MySQL", "MongoDB", "Redis",
    "Python", "TypeScript", "JavaScript", "Node.js", "Django", "Flask",
    "FastAPI", "Next.js", "Tailwind", "Docker", "Kubernetes", "Terraform",
    "GraphQL", "Prisma", "Redux", "S3", "Lambda", "Kafka", "RabbitMQ",
]

# Statements of obligation, for rules that apply to requirement lines only.
REQ_LINE = re.compile(r"\b(shall|must|will)\b", re.IGNORECASE)

RULE_NAMES = {
    1: "Singular",
    2: "Verifiable (vague qualifier)",
    3: "Implementation-free",
    4: "One interpretation (ambiguity marker)",
    5: "Active and owned (passive voice)",
    6: "Bounded negation",
    7: "Defined terms",
    8: "Machine-readable form",
    9: "Self-check named",
    10: "Complete set",
}


class Finding:
    def __init__(self, rule: int, tier: str, file: Path, line: int, text: str, note: str):
        self.rule = rule
        self.tier = tier
        self.file = file
        self.line = line
        self.text = text.strip()
        self.note = note

    def as_dict(self):
        return {
            "rule": self.rule,
            "rule_name": RULE_NAMES[self.rule],
            "tier": self.tier,
            "file": str(self.file),
            "line": self.line,
            "text": self.text[:160],
            "note": self.note,
        }


def strip_code_blocks(text: str) -> tuple[str, dict[int, str]]:
    """Replace fenced code with placeholder lines, keeping line numbers."""
    out: list[str] = []
    keep: dict[int, str] = {}
    in_fence = False
    fence_lang = ""
    for i, line in enumerate(text.splitlines(), 1):
        if line.strip().startswith("```"):
            if not in_fence:
                in_fence = True
                fence_lang = line.strip()[3:].strip().lower()
                keep[i] = f"FENCE:{fence_lang}"
                out.append(f"\x00FENCE{i}\x00")
            else:
                in_fence = False
                out.append(f"\x00ENDFENCE{i}\x00")
            continue
        if in_fence:
            keep[i] = line
            out.append(f"\x00SKIP{i}\x00")
        else:
            out.append(line)
    return "\n".join(out), keep


def table_rows(text: str):
    """Yield (line_number, header_cells, row_cells) for markdown tables."""
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.lstrip().startswith("|") and i + 1 < len(lines) and re.match(r"^\s*\|[\s\-|:]+\|\s*$", lines[i + 1]):
            header = [c.strip() for c in line.strip().strip("|").split("|")]
            j = i + 2
            while j < len(lines) and lines[j].lstrip().startswith("|"):
                cells = [c.strip() for c in lines[j].strip().strip("|").split("|")]
                yield i + 1, header, cells  # line number of the row
                j += 1
            i = j
        else:
            i += 1


def is_acceptance_header(header: list[str]) -> bool:
    joined = " ".join(h.lower() for h in header)
    return "criterion" in joined or "acceptance" in joined


def check_table_row(rule_findings, file, lineno, header, cells):
    lowered = [c.lower() for c in header]

    def col(*names):
        for n in names:
            if n in lowered:
                return lowered.index(n)
        return None

    crit_i = col("acceptance criterion", "criterion", "behavior", "requirement")
    if crit_i is None or crit_i >= len(cells):
        return
    text = cells[crit_i]
    where = f"{file}:{lineno}"

    # Rule 1 — singular: compound criteria in one row.
    if re.search(r"\band (then |the system )?shall\b", text, re.IGNORECASE) or re.search(r";\s*\w+.*\bshall\b", text):
        rule_findings(1, "D", lineno, text, "compound criterion — split into one capability per row")
    # Rule 2 — verifiable: vague qualifiers.
    for w in VAGUE_QUALIFIERS:
        if re.search(rf"\b{re.escape(w)}\b", text, re.IGNORECASE):
            rule_findings(2, "D", lineno, text, f"vague qualifier '{w}' — replace with a measured bound")
            break
    # Rule 4 — one interpretation.
    for m in AMBIGUITY_MARKERS:
        if m in text.lower():
            rule_findings(4, "D", lineno, text, f"ambiguity marker '{m}'")
            break
    # Rule 3 — implementation-free (tech terms).
    for t in TECH_TERMS:
        if re.search(rf"\b{re.escape(t)}\b", text):
            rule_findings(3, "G", lineno, text, f"technology term '{t}' in behavior — move to plan")
            break
    # Rule 9 — self-check named: verification column present and filled.
    ver_i = col("verification method", "verification", "check", "evidence")
    if ver_i is not None and ver_i < len(cells) and not cells[ver_i]:
        rule_findings(9, "D", lineno, text, "criterion has no named check — every criterion names its verification")


def check_requirement_line(rule_findings, file, lineno, text):
    # Rule 5 — active and owned: passive obligation.
    m = re.search(r"\b(shall|must|will) be (\w+(?:ed|en))\b", text, re.IGNORECASE)
    if m and m.group(2).lower() not in {"held", "set"}:
        rule_findings(5, "G", lineno, text, f"passive obligation ('{m.group(0)}') — name the actor as subject")
    # Rule 6 — bounded negation: bare negation in an obligation line.
    if REQ_LINE.search(text):
        for n in re.finditer(r"\bnot\b", text, re.IGNORECASE):
            before = text[max(0, n.start() - 30):n.start()].lower()
            if not re.search(r"\b(shall|must|may|cannot|can)\s*$", before):
                rule_findings(6, "G", lineno, text, "negation without 'shall not/must not' — state the positive behavior")
                break


def check_document(file: Path, glossary: set[str] | None):
    findings: list[Finding] = []

    def rule_findings(rule: int, tier: str, lineno: int, text: str, note: str):
        findings.append(Finding(rule, tier, file, lineno, text, note))

    raw = file.read_text(encoding="utf-8")
    text, fences = strip_code_blocks(raw)
    lines = text.splitlines()

    has_gherkin_after_ac = False
    ac_sections_without_evidence: list[tuple[int, str]] = []
    last_ac_heading = None
    headings: list[tuple[int, str]] = []

    for lineno, line in enumerate(lines, 1):
        if line.lstrip().startswith("|"):
            continue
        heading = re.match(r"^(#{1,6})\s+(.*)", line)
        if heading:
            headings.append((lineno, heading.group(2)))
            if re.match(r"^AC[-\s]?\d", heading.group(2).strip(), re.IGNORECASE):
                last_ac_heading = (lineno, heading.group(2).strip())
                ac_sections_without_evidence.append(last_ac_heading)
            continue
        if re.match(r"^\x00FENCE\d+\x00$", line):
            content = ""
            # find the fence language recorded at this line
            src_line = None
            for src_no, src in fences.items():
                if f"\x00FENCE{src_no}\x00" == line:
                    src_line = src
                    break
            lang = (src_line or "").replace("FENCE:", "")
            if lang in {"gherkin", "cucumber"}:
                has_gherkin_after_ac = True
                if ac_sections_without_evidence:
                    ac_sections_without_evidence.pop()
            continue
        if re.match(r"^\x00SKIP\d+\x00$", line):
            continue
        if REQ_LINE.search(line):
            check_requirement_line(rule_findings, file, lineno, line)

    # Acceptance tables.
    for _header_line, header, cells in table_rows(text):
        if is_acceptance_header(header):
            check_table_row(rule_findings, file, _header_line, header, cells)

    # Gherkin evidence inside an acceptance table's check column is fine; a
    # file whose only scenarios are fenced blocks satisfies rule 9 per section.
    del has_gherkin_after_ac

    # Rule 9 — AC headings need a scenario, table, or traceability row.
    traceability_ids: set[str] = set()
    for _hl, header, cells in table_rows(text):
        joined = " ".join(h.lower() for h in header)
        if "criterion" in joined and any(k in joined for k in ("evidence", "check", "verification")):
            evid_i = max(i for i, h in enumerate(header) if any(k in h.lower() for k in ("evidence", "check", "verification")))
            for _rl, _h, row in table_rows(text):
                if row and len(row) > evid_i and row[0].upper().startswith("AC") and row[evid_i].strip():
                    traceability_ids.add(row[0].upper().split()[0])
    for _lineno, name in ac_sections_without_evidence:
        ac_id = name.split()[0].upper().rstrip("—-").strip()
        if ac_id and any(t.startswith(ac_id) for t in traceability_ids):
            continue
        rule_findings(9, "D", _lineno, name, "acceptance section has no gherkin scenario, table, or traceability row with named evidence")

    # Rule 10 — completeness: non-goals required when scope is stated.
    h_low = [h.lower() for _, h in headings]
    has_scope = any(h.startswith(("in scope", "scope")) for h in h_low)
    has_non_goals = any("non-goal" in h for h in h_low)
    has_acceptance = any("acceptance" in h for h in h_low)
    if has_scope and has_acceptance and not has_non_goals:
        rule_findings(10, "D", 1, file.name, "specification states scope and acceptance but has no Non-goals section")
    if has_acceptance:
        has_states_section = any(re.search(r"\bstate", h) for h in h_low)
        if has_states_section:
            text_lower = text.lower()
            canonical = ("loading", "empty", "error", "permission")
            present = [s for s in canonical if s in text_lower]
            # Flag only a partially enumerated canonical set: the author used
            # the set but missed members. A section using different vocabulary
            # entirely is not flagged.
            if 1 < len(present) < len(canonical):
                missing = [s for s in canonical if s not in present]
                rule_findings(10, "G", 1, file.name, f"states section enumerates {present} but misses {missing} — complete the state set")

    # Rule 7 — defined terms (only with --glossary).
    if glossary:
        terms = set(re.findall(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b", raw))
        # Exclude headings and sentence starts: keep terms seen mid-sentence at
        # least twice.
        for t in terms:
            occurrences = len(re.findall(rf"\b{re.escape(t)}\b", raw))
            if occurrences >= 3 and t not in glossary and t.lower() not in {g.lower() for g in glossary}:
                findings.append(Finding(7, "G", file, 1, t, f"recurring term '{t}' not in glossary"))

    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description="Lint specifications against the CLEAR spec-quality scorecard")
    parser.add_argument("specs", nargs="+", type=Path, help="specification markdown files")
    parser.add_argument("--glossary", type=Path, help="optional glossary markdown for rule 7")
    parser.add_argument("--json", action="store_true", dest="as_json", help="emit findings as JSON")
    args = parser.parse_args()

    glossary: set[str] | None = None
    if args.glossary:
        glossary = set(re.findall(r"\b[A-Za-z][A-Za-z0-9 \-]{2,40}", args.glossary.read_text(encoding="utf-8")))

    all_findings: list[Finding] = []
    for spec in args.specs:
        if not spec.exists():
            print(f"ERROR {spec}: file not found", file=sys.stderr)
            return 2
        all_findings.extend(check_document(spec, glossary))

    if args.as_json:
        print(json.dumps([f.as_dict() for f in all_findings], indent=2))
    else:
        errors = [f for f in all_findings if f.tier == "D"]
        warnings = [f for f in all_findings if f.tier == "G"]
        for f in all_findings:
            marker = "ERROR" if f.tier == "D" else "WARN"
            print(f"{marker} {f.file}:{f.line} rule {f.rule} ({RULE_NAMES[f.rule]}): {f.note}")
            print(f"      | {f.text}")
        if not all_findings:
            print("Spec quality: no findings.")
        print(
            f"Spec lint: {len(errors)} error(s), {len(warnings)} warning(s) "
            f"across {len(args.specs)} file(s)."
        )

    return 1 if any(f.tier == "D" for f in all_findings) else 0


if __name__ == "__main__":
    sys.exit(main())