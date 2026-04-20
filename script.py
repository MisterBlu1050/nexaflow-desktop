from pathlib import Path
import sys

# Set console encoding to UTF-8 for Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

# Config
out = Path('output')
out.mkdir(exist_ok=True)

# Correct Data Constants
DATA = {
    'dept': 'Engineering',
    'headcount': 185,
    'total_headcount': 500,
    'median_salary': '€79,500',
    'turnover': '22%',
    'framework': 'CP200',
    'sites': 'Brussels, Amsterdam, Berlin, Lisbon',
    'source': 'NexaFlow_SIRH_500.xlsx, extracted on 19/04/2026',
    'cases': ['CAS-005', 'CAS-006']
}

def generate_memo():
    memo = f'''INTERNAL MEMORANDUM

TO: Bruno Mineo, CHRO
FROM: NexaAI, CHRO Assistant
DATE: April 2026
SUBJECT: Compensation & Retention Analysis: Focus on Engineering Department Risks

***

### I. Executive Summary & Urgency Assessment

The analysis of compensation structures within the {DATA['dept']} department reveals critical areas of risk. With a {DATA['turnover']} engineering turnover rate and multiple active legal cases (including {DATA['cases'][0]} and {DATA['cases'][1]}), our current compensation architecture requires structural intervention to stabilize talent across our EU sites.

### II. Core Analysis Findings

**1. Engineering Compensation Audit (N={DATA['headcount']}):**
*   **Median Salary:** {DATA['median_salary']} (Canonical benchmark).
*   **Geographic Parity:** Ensuring alignment across {DATA['sites']}.
*   **Turnover:** The {DATA['turnover']} churn rate in technical roles is a primary risk factor for FY2026 deliverables.

**2. Legal & Compliance Focus:**
*   **Framework:** All analysis adheres to {DATA['framework']} standards.
*   **Active Cases:** 
    *   {DATA['cases'][0]}: Addressing 3 Senior Engineers underpaid by 15-20%.
    *   {DATA['cases'][1]}: Berlin promotion bias / discrimination claim.

**3. Structural Gaps:**
*   **Comp & Ben Role:** Currently VACANT. This remains a priority hire to manage localized pay compliance.

### III. Recommendations

1. **Grade Audit:** Align all Engineering roles with the {DATA['median_salary']} median benchmark.
2. **Site-Specific Adjustments:** Review pay bands for {DATA['sites']} to ensure market parity.
3. **Retention Packages:** Proactive intervention for 70 High and 153 Medium flight-risk engineers.

***

{DATA['framework']} | {DATA['dept']} | N={DATA['headcount']} | Médiane {DATA['median_salary']}

Source: {DATA['source']}
Footnote: Total company headcount is {DATA['total_headcount']}.
'''
    return memo

if __name__ == "__main__":
    final_memo = generate_memo()
    (out / 'final_chro_memo.txt').write_text(final_memo, encoding='utf-8')
    print(final_memo)
    print(f"\n[Fichier généré : {out/'final_chro_memo.txt'}]")
