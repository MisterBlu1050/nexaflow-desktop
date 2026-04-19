# Claude HR Plugin — Documentation complète des Skills

> Export exhaustif de la suite Human Resources du plugin Claude.
> Date d'export : 19 avril 2026

---

## Table des matières

1. [/comp-analysis — Analyse de la rémunération](#1-comp-analysis--analyse-de-la-rémunération)
2. [/draft-offer — Rédaction de lettre d'offre](#2-draft-offer--rédaction-de-lettre-doffre)
3. [/onboarding — Intégration d'un nouvel employé](#3-onboarding--intégration-dun-nouvel-employé)
4. [/people-report — Rapport sur les effectifs](#4-people-report--rapport-sur-les-effectifs)
5. [/performance-review — Évaluation des performances](#5-performance-review--évaluation-des-performances)
6. [/policy-lookup — Recherche de politiques internes](#6-policy-lookup--recherche-de-politiques-internes)
7. [/interview-prep — Préparation d'entretiens structurés](#7-interview-prep--préparation-dentretiens-structurés)
8. [/recruiting-pipeline — Suivi du pipeline de recrutement](#8-recruiting-pipeline--suivi-du-pipeline-de-recrutement)
9. [/org-planning — Planification organisationnelle](#9-org-planning--planification-organisationnelle)

---

## 1. /comp-analysis — Analyse de la rémunération

**Description :** Analyze compensation — benchmarking, band placement, and equity modeling. Trigger with "what should we pay a [role]", "is this offer competitive", "model this equity grant", or when uploading comp data to find outliers and retention risks.

**Argument-hint :** `<role, level, or dataset>`

**Logiciels émulés :** PayScale, Radford (Aon), Salary.com, Figures.hr, Compdata

### Usage

```
/comp-analysis $ARGUMENTS
```

### Ce que le skill attend de vous

**Option A : Analyse d'un poste unique**
"What should we pay a Senior Software Engineer in SF?"

**Option B : Upload de données de rémunération**
Upload un CSV ou collez vos bandes salariales. Le skill analyse le positionnement, identifie les valeurs aberrantes et compare au marché.

**Option C : Modélisation equity**
"Model a refresh grant of 10K shares over 4 years at a $50 stock price."

### Framework de rémunération

#### Composantes de la rémunération totale
- **Base salary** : rémunération fixe en espèces
- **Equity** : RSUs, stock options, ou autres instruments
- **Bonus** : bonus annuel cible, signing bonus
- **Benefits** : santé, retraite, avantages (plus difficile à quantifier)

#### Variables clés
- **Role** : fonction et spécialisation
- **Level** : niveaux IC, niveaux management
- **Location** : ajustements géographiques
- **Company stage** : startup vs. croissance vs. coté
- **Industry** : tech vs. finance vs. santé

#### Sources de données
- **Avec données de compensation connectées** : benchmarks vérifiés
- **Sans** : recherche web, données salariales publiques, contexte fourni par l'utilisateur
- Toujours noter la fraîcheur des données et les limitations des sources

### Output produit

Fournit des bandes percentiles (25th, 50th, 75th, 90th) pour base, equity et comp totale. Inclut ajustements géographiques et contexte du stade de l'entreprise.

```markdown
## Compensation Analysis: [Role/Scope]

### Market Benchmarks
| Percentile | Base | Equity | Total Comp |
|------------|------|--------|------------|
| 25th | $[X] | $[X] | $[X] |
| 50th | $[X] | $[X] | $[X] |
| 75th | $[X] | $[X] | $[X] |
| 90th | $[X] | $[X] | $[X] |

**Sources:** [Web research, compensation data tools, or user-provided data]

### Band Analysis (if data provided)
| Employee | Current Base | Band Min | Band Mid | Band Max | Position |
|----------|-------------|----------|----------|----------|----------|
| [Name] | $[X] | $[X] | $[X] | $[X] | [Below/At/Above] |

### Recommendations
- [Specific compensation recommendations]
- [Equity considerations]
- [Retention risks if applicable]
```

### Connecteurs optionnels

- **~~compensation data** : pull de benchmarks vérifiés par rôle, niveau et localisation ; comparaison des bandes avec des données de marché en temps réel
- **~~HRIS** : pull des données de rémunération actuelles pour analyse de bandes ; identification automatique des outliers et risques de rétention

### Conseils d'utilisation

1. **La localisation compte** — Toujours spécifier la localisation pour le benchmarking (SF vs. Austin vs. London = très différent)
2. **Comp totale, pas juste le base** — Inclure equity, bonus et benefits pour une vue complète
3. **Confidentialité** — Les données de rémunération sont sensibles. Les résultats restent dans votre conversation

---

## 2. /draft-offer — Rédaction de lettre d'offre

**Description :** Draft an offer letter with comp details and terms. Use when a candidate is ready for an offer, assembling a total comp package (base, equity, signing bonus), writing the offer letter text itself, or prepping negotiation guidance for the hiring manager.

**Argument-hint :** `<role and level>`

**Logiciels émulés :** BambooHR Offer Module, Workday Recruiting, DocuSign (workflow signature)

### Usage

```
/draft-offer $ARGUMENTS
```

### Ce que le skill attend de vous

- **Role and title** : quel poste ?
- **Level** : Junior, Mid, Senior, Staff, etc.
- **Location** : lieu de travail (affecte comp et benefits)
- **Compensation** : salaire de base, equity, signing bonus (si applicable)
- **Start date** : date de début souhaitée
- **Hiring manager** : responsable hiérarchique

Si vous n'avez pas tous les détails, le skill vous aide à les déterminer.

### Output produit

```markdown
## Offer Letter Draft: [Role] — [Level]

### Compensation Package
| Component | Details |
|-----------|---------|
| **Base Salary** | $[X]/year |
| **Equity** | [X shares/units], [vesting schedule] |
| **Signing Bonus** | $[X] (if applicable) |
| **Target Bonus** | [X]% of base (if applicable) |
| **Total First-Year Comp** | $[X] |

### Terms
- **Start Date**: [Date]
- **Reports To**: [Manager]
- **Location**: [Office / Remote / Hybrid]
- **Employment Type**: [Full-time, Exempt]

### Benefits Summary
[Key benefits highlights relevant to the candidate]

### Offer Letter Text

Dear [Candidate Name],

We are pleased to offer you the position of [Title] at [Company]...

[Complete offer letter text]

### Notes for Hiring Manager
- [Negotiation guidance if needed]
- [Comp band context]
- [Any flags or considerations]
```

### Connecteurs optionnels

- **~~HRIS** : pull des données de bande salariale pour le niveau/rôle ; vérification de l'approbation de headcount ; auto-population des détails benefits
- **~~ATS** : pull des détails candidat depuis l'application ; mise à jour du statut de l'offre dans le pipeline

### Conseils d'utilisation

1. **Inclure la comp totale** — Les candidats comparent la rémunération totale, pas juste le base
2. **Être précis sur l'equity** — Nombre de parts, méthode de valorisation, vesting schedule
3. **Personnaliser** — Référencer quelque chose du processus d'entretien pour rendre l'offre chaleureuse

---

## 3. /onboarding — Intégration d'un nouvel employé

**Description :** Generate an onboarding checklist and first-week plan for a new hire. Use when someone has a start date coming up, building the pre-start task list (accounts, equipment, buddy), scheduling Day 1 and Week 1, or setting 30/60/90-day goals for a new team member.

**Argument-hint :** `<new hire name and role>`

**Logiciels émulés :** BambooHR Onboarding, Workday, Sapling, Enboarder

### Usage

```
/onboarding $ARGUMENTS
```

### Ce que le skill attend de vous

- **New hire name** : qui commence ?
- **Role** : quel poste ?
- **Team** : quelle équipe ?
- **Start date** : quand ?
- **Manager** : responsable hiérarchique ?

### Output produit

```markdown
## Onboarding Plan: [Name] — [Role]
**Start Date:** [Date] | **Team:** [Team] | **Manager:** [Manager]

### Pre-Start (Before Day 1)
- [ ] Send welcome email with start date, time, and logistics
- [ ] Set up accounts: email, Slack, [tools for role]
- [ ] Order equipment (laptop, monitor, peripherals)
- [ ] Add to team calendar and recurring meetings
- [ ] Assign onboarding buddy: [Suggested person]
- [ ] Prepare desk / remote setup instructions

### Day 1
| Time | Activity | With |
|------|----------|------|
| 9:00 | Welcome and orientation | Manager |
| 10:00 | IT setup and tool walkthrough | IT / Buddy |
| 11:00 | Team introductions | Team |
| 12:00 | Welcome lunch | Manager + Team |
| 1:30 | Company overview and values | Manager |
| 3:00 | Role expectations and 30/60/90 plan | Manager |
| 4:00 | Free time to explore tools and docs | Self |

### Week 1
- [ ] Complete required compliance training
- [ ] Read key documentation: [list for role]
- [ ] 1:1 with each team member
- [ ] Shadow key meetings
- [ ] First small task or project assigned
- [ ] End-of-week check-in with manager

### 30-Day Goals
1. [Goal aligned to role]
2. [Goal aligned to role]
3. [Goal aligned to role]

### 60-Day Goals
1. [Goal]
2. [Goal]

### 90-Day Goals
1. [Goal]
2. [Goal]

### Key Contacts
| Person | Role | For What |
|--------|------|----------|
| [Manager] | Manager | Day-to-day guidance |
| [Buddy] | Onboarding Buddy | Questions, culture, navigation |
| [IT Contact] | IT | Tool access, equipment |
| [HR Contact] | HR | Benefits, policies |

### Tools Access Needed
| Tool | Access Level | Requested |
|------|-------------|-----------|
| [Tool] | [Level] | [ ] |
```

### Connecteurs optionnels

- **~~HRIS** : pull des détails du nouveau collaborateur et de l'organigramme ; auto-population de la liste d'accès outils basée sur le rôle
- **~~knowledge base** : lien vers les docs d'onboarding pertinentes, wikis d'équipe et runbooks ; pull de la checklist d'onboarding existante pour personnalisation
- **~~calendar** : création automatique des événements Day 1 et des invitations Week 1

### Conseils d'utilisation

1. **Personnaliser pour le rôle** — L'onboarding d'un ingénieur est différent de celui d'un designer
2. **Ne pas surcharger le Day 1** — Focus sur le setup et les relations. Le travail profond commence en Week 2
3. **Assigner un buddy** — Avoir une personne de référence qui n'est pas le manager fait une énorme différence

---

## 4. /people-report — Rapport sur les effectifs

**Description :** Generate headcount, attrition, diversity, or org health reports. Use when pulling a headcount snapshot for leadership, analyzing turnover trends by team, preparing diversity representation metrics, or assessing span of control and flight risk across the org.

**Argument-hint :** `<report type — headcount, attrition, diversity, org health>`

**Logiciels émulés :** Workday Analytics, Visier, BambooHR Analytics, Tableau HR

### Usage

```
/people-report $ARGUMENTS
```

### Types de rapports

- **Headcount** : snapshot organisationnel — par équipe, localisation, niveau, ancienneté
- **Attrition** : analyse du turnover — volontaire/involontaire, par équipe, tendances
- **Diversity** : métriques de représentation — par niveau, équipe, pipeline
- **Org Health** : span of control, couches managériales, taille des équipes, flight risk

### Métriques clés

#### Rétention
- Taux d'attrition global (volontaire + involontaire)
- Taux d'attrition regrettable
- Ancienneté moyenne
- Indicateurs de flight risk

#### Diversité
- Représentation par niveau, équipe et fonction
- Diversité du pipeline (funnel de recrutement par démographie)
- Taux de promotion par groupe
- Analyse d'équité salariale

#### Engagement
- Scores de sondage et tendances
- eNPS (Employee Net Promoter Score)
- Taux de participation
- Thèmes des feedbacks ouverts

#### Productivité
- Revenue par employé
- Efficacité du span of control
- Time to productivity pour les nouveaux embauchés

### Approche méthodologique

1. Comprendre la question à laquelle on essaie de répondre
2. Identifier les bonnes données (upload, collage, ou pull depuis ~~HRIS)
3. Analyser avec les méthodes statistiques appropriées
4. Présenter les résultats avec contexte et caveats
5. Recommander des actions spécifiques basées sur les données

### Ce que le skill attend de vous

Upload un CSV ou décrivez vos données. Champs utiles :
- Employee name/ID, department, team
- Title, level, location
- Start date, end date (si applicable)
- Manager, compensation (si pertinent)
- Demographics (pour les rapports diversité, si disponibles)

### Output produit

```markdown
## People Report: [Type] — [Date]

### Executive Summary
[2-3 key takeaways]

### Key Metrics
| Metric | Value | Trend |
|--------|-------|-------|
| [Metric] | [Value] | [up/down/flat] |

### Detailed Analysis
[Charts, tables, and narrative for the specific report type]

### Recommendations
- [Data-driven recommendation]
- [Action item]

### Methodology
[How the numbers were calculated, any caveats]
```

### Connecteurs optionnels

- **~~HRIS** : pull de données employés en direct — headcount, ancienneté, département, niveau ; génération de rapports sans besoin d'upload CSV
- **~~chat** : possibilité de partager le résumé du rapport dans un canal pertinent

---

## 5. /performance-review — Évaluation des performances

**Description :** Structure a performance review with self-assessment, manager template, and calibration prep. Use when review season kicks off and you need a self-assessment template, writing a manager review for a direct report, prepping rating distributions and promotion cases for calibration, or turning vague feedback into specific behavioral examples.

**Argument-hint :** `<employee name or review cycle>`

**Logiciels émulés :** 15Five, Lattice, Culture Amp, Workday Performance, SAP SuccessFactors

### Usage

```
/performance-review $ARGUMENTS
```

### Modes disponibles

```
/performance-review self-assessment       # Template d'auto-évaluation
/performance-review manager [employee]    # Template évaluation manager pour un employé
/performance-review calibration           # Document de préparation calibration
```

Si aucun mode n'est spécifié, le skill demande quel type d'évaluation est nécessaire.

### Output — Template d'auto-évaluation

```markdown
## Self-Assessment: [Review Period]

### Key Accomplishments
[List your top 3-5 accomplishments this period. For each, describe the situation, your contribution, and the impact.]

1. **[Accomplishment]**
   - Situation: [Context]
   - Contribution: [What you did]
   - Impact: [Measurable result]

### Goals Review
| Goal | Status | Evidence |
|------|--------|----------|
| [Goal from last period] | Met / Exceeded / Missed | [How you know] |

### Growth Areas
[Where did you grow? New skills, expanded scope, leadership moments.]

### Challenges
[What was hard? What would you do differently?]

### Goals for Next Period
1. [Goal — specific and measurable]
2. [Goal]
3. [Goal]

### Feedback for Manager
[How can your manager better support you?]
```

### Output — Évaluation Manager

```markdown
## Performance Review: [Employee Name]
**Period:** [Date range] | **Manager:** [Your name]

### Overall Rating: [Exceeds / Meets / Below Expectations]

### Performance Summary
[2-3 sentence overall assessment]

### Key Strengths
- [Strength with specific example]
- [Strength with specific example]

### Areas for Development
- [Area with specific, actionable guidance]
- [Area with specific, actionable guidance]

### Goal Achievement
| Goal | Rating | Comments |
|------|--------|----------|
| [Goal] | [Rating] | [Specific observations] |

### Impact and Contributions
[Describe their biggest contributions and impact on the team/org]

### Development Plan
| Skill | Current | Target | Actions |
|-------|---------|--------|---------|
| [Skill] | [Level] | [Level] | [How to get there] |

### Compensation Recommendation
[Promotion / Equity refresh / Adjustment / No change — with justification]
```

### Output — Calibration

```markdown
## Calibration Prep: [Review Cycle]
**Manager:** [Your name] | **Team:** [Team] | **Period:** [Date range]

### Team Overview
| Employee | Role | Level | Tenure | Proposed Rating | Notes |
|----------|------|-------|--------|-----------------|-------|
| [Name] | [Role] | [Level] | [X years] | [Rating] | [Key context] |

### Rating Distribution
| Rating | Count | % of Team | Company Target |
|--------|-------|-----------|----------------|
| Exceeds Expectations | [X] | [X]% | ~15-20% |
| Meets Expectations | [X] | [X]% | ~60-70% |
| Below Expectations | [X] | [X]% | ~10-15% |

### Calibration Discussion Points
1. **[Employee]** — [Why this rating may need discussion]
2. **[Employee]** — [Discussion point]

### Promotion Candidates
| Employee | Current Level | Proposed Level | Justification |
|----------|-------------|----------------|---------------|
| [Name] | [Current] | [Proposed] | [Evidence of next-level performance] |

### Compensation Actions
| Employee | Action | Justification |
|----------|--------|---------------|
| [Name] | [Promotion / Equity refresh / Market adjustment / Retention] | [Why] |

### Manager Notes
[Context the calibration group should know — team changes, org shifts, project impacts]
```

### Connecteurs optionnels

- **~~HRIS** : pull de l'historique d'évaluation et données de suivi des objectifs ; pré-population des détails employé et informations de rôle actuel
- **~~project tracker** : pull du travail complété et des contributions pour la période d'évaluation ; référence à des tickets spécifiques et jalons de projet comme preuves

### Conseils d'utilisation

1. **Être spécifique** — "Great job" n'est pas du feedback. "You reduced deploy time 40% by implementing the new CI pipeline" en est
2. **Équilibrer positif et constructif** — Les deux sont essentiels. Aucun ne devrait être une surprise
3. **Se concentrer sur les comportements, pas la personnalité** — "Your documentation has been incomplete" vs. "You're careless"
4. **Rendre le développement actionnable** — "Improve communication" est vague. "Present at the next team all-hands" est actionnable

---

## 6. /policy-lookup — Recherche de politiques internes

**Description :** Find and explain company policies in plain language. Trigger with "what's our PTO policy", "can I work remotely from another country", "how do expenses work", or any plain-language question about benefits, travel, leave, or handbook rules.

**Argument-hint :** `<policy topic — PTO, benefits, travel, expenses, etc.>`

**Logiciels émulés :** BambooHR Policy Module, Notion Knowledge Base, Confluence HR Space, HROne

### Usage

```
/policy-lookup $ARGUMENTS
```

### Comment ça fonctionne

```
┌─────────────────────────────────────────────────────────────────┐
│                    POLICY LOOKUP                                │
├─────────────────────────────────────────────────────────────────┤
│  STANDALONE (fonctionne toujours)                               │
│  ✓ Posez n'importe quelle question de politique en langage clair│
│  ✓ Collez votre manuel de l'employé et le skill le recherche    │
│  ✓ Obtenez des réponses claires, sans jargon                   │
├─────────────────────────────────────────────────────────────────┤
│  SUPERCHARGED (quand vos outils sont connectés)                 │
│  + Knowledge base : recherche automatique du handbook et docs   │
│  + HRIS : pull des détails spécifiques à l'employé             │
└─────────────────────────────────────────────────────────────────┘
```

### Sujets de politique courants

- **PTO et congés** : vacances, congés maladie, congé parental, deuil, sabbatique
- **Benefits** : assurance santé, dentaire, vision, 401k, HSA/FSA, bien-être
- **Rémunération** : calendrier de paie, timing bonus, vesting equity, remboursement frais
- **Travail à distance** : politique télétravail, localisations autorisées, allocation équipement, coworking
- **Voyages** : politique de réservation, per diem, notes de frais, processus d'approbation
- **Conduite** : code de conduite, politique harcèlement, conflits d'intérêts
- **Développement** : budget développement professionnel, politique conférences, remboursement formation

### Méthodologie de réponse

1. Rechercher dans ~~knowledge base le document de politique pertinent
2. Fournir une réponse claire en langage courant
3. Citer le langage spécifique de la politique
4. Noter toute exception ou cas particulier
5. Indiquer qui contacter pour les cas limites

**Gardes-fous importants :**
- Toujours citer le document source et la section
- Si aucune politique n'est trouvée, le dire clairement plutôt que deviner
- Pour les questions juridiques ou de conformité, recommander de consulter les RH ou le juridique directement

### Output produit

```markdown
## Policy: [Topic]

### Quick Answer
[1-2 sentence direct answer to their question]

### Details
[Relevant policy details, explained in plain language]

### Exceptions / Special Cases
[Any relevant exceptions or edge cases]

### Who to Contact
[Person or team for questions beyond what's documented]

### Source
[Where this information came from — document name, page, or section]
```

### Connecteurs optionnels

- **~~knowledge base** : recherche automatique du manuel de l'employé et documents de politique ; citation du document spécifique, section et numéro de page
- **~~HRIS** : pull des détails spécifiques à l'employé comme le solde de congés, les élections de benefits et le statut d'inscription

### Conseils d'utilisation

1. **Poser en langage courant** — "Can I work from Europe for a month?" est mieux que "international remote work policy"
2. **Être précis** — "PTO for part-time employees in California" obtient une meilleure réponse que "PTO policy"

---

## 7. /interview-prep — Préparation d'entretiens structurés

**Description :** Create structured interview plans with competency-based questions and scorecards. Trigger with "interview plan for", "interview questions for", "how should we interview", "scorecard for", or when the user is preparing to interview candidates.

**Logiciels émulés :** Greenhouse Scorecards, Lever Interview Plans, iCIMS, BrightHire

### Principes de design d'entretien

1. **Structuré** : mêmes questions pour tous les candidats du poste
2. **Basé sur les compétences** : mapper les questions à des skills et comportements spécifiques
3. **Basé sur les preuves** : utiliser des questions comportementales et situationnelles
4. **Panel diversifié** : perspectives multiples pour réduire les biais
5. **Noté** : utiliser des grilles, pas l'intuition

### Composantes du plan d'entretien

#### Compétences du rôle
Définir 4-6 compétences clés pour le rôle (ex : compétences techniques, communication, leadership, résolution de problèmes).

#### Banque de questions
Pour chaque compétence :
- 2-3 questions comportementales ("Tell me about a time...")
- 1-2 questions situationnelles ("How would you handle...")
- Questions de suivi / relances

#### Scorecard
Noter chaque compétence sur une échelle cohérente (1-4) avec des descriptions claires de ce que chaque niveau représente.

#### Template de debrief
Format structuré pour que les intervieweurs partagent leurs résultats et prennent une décision.

### Output produit

Kit d'entretien complet : assignation du panel (qui interviewe sur quoi), banque de questions par compétence, grille de notation, et template de debrief.

---

## 8. /recruiting-pipeline — Suivi du pipeline de recrutement

**Description :** Track and manage recruiting pipeline stages. Trigger with "recruiting update", "candidate pipeline", "how many candidates", "hiring status", or when the user discusses sourcing, screening, interviewing, or extending offers.

**Logiciels émulés :** Lever, Greenhouse, Workable, SmartRecruiters, Ashby

### Étapes du pipeline

| Étape | Description | Actions clés |
|-------|-------------|-------------|
| Sourced | Identifié et contacté | Outreach personnalisé |
| Screen | Screen téléphonique/vidéo | Évaluer le fit de base |
| Interview | Entretiens sur site ou panel | Évaluation structurée |
| Debrief | Décision d'équipe | Calibrer les feedbacks |
| Offer | Extension de l'offre | Package comp, négociation |
| Accepted | Offre acceptée | Transition vers onboarding |

### Métriques à suivre

- **Pipeline velocity** : jours par étape
- **Conversion rates** : taux de déperdition étape par étape
- **Source effectiveness** : quels canaux produisent des embauches
- **Offer acceptance rate** : offres étendues vs. acceptées
- **Time to fill** : jours de l'ouverture du poste à l'acceptation de l'offre

### Connecteur optionnel

Si **~~ATS** connecté : pull automatique des données candidats, mise à jour des statuts, et suivi des métriques de pipeline en temps réel.

---

## 9. /org-planning — Planification organisationnelle

**Description :** Headcount planning, org design, and team structure optimization. Trigger with "org planning", "headcount plan", "team structure", "reorg", "who should we hire next", or when the user is thinking about team size, reporting structure, or organizational design.

**Logiciels émulés :** Visier, Lattice, ChartHop, Orgvue, 15Five

### Dimensions de planification

- **Headcount** : combien de personnes, dans quels rôles, d'ici quand ?
- **Structure** : lignes hiérarchiques, span of control, frontières d'équipe
- **Séquençage** : quelles embauches sont les plus critiques ? Quel est le bon ordre ?
- **Budget** : modélisation du coût du headcount et trade-offs

### Benchmarks d'organisation saine

| Métrique | Zone saine | Signal d'alerte |
|----------|------------|-----------------|
| Span of control | 5-8 rapports directs | < 3 ou > 12 |
| Couches managériales | 4-6 pour 500 personnes | Trop = décisions lentes |
| Ratio IC-to-manager | 6:1 à 10:1 | < 4:1 = top-heavy |
| Taille d'équipe | 5-9 personnes | < 4 = isolé, > 12 = difficile à gérer |

### Output produit

Organigrammes (text-based), plans de headcount avec modélisation des coûts, et roadmaps d'embauche séquencées. Signale les problèmes structurels comme les single points of failure ou l'overhead managérial excessif.

---

## Annexe : Connecteurs disponibles

Les skills HR peuvent être supercharged par la connexion de systèmes externes :

| Connecteur | Skills concernés | Fonctionnalité ajoutée |
|------------|-----------------|----------------------|
| **~~HRIS** (BambooHR, Workday, Personio) | Tous les skills | Données employés en direct, automatisation |
| **~~ATS** (Greenhouse, Lever, Workable) | recruiting-pipeline, draft-offer, interview-prep | Pipeline candidats, statuts, métriques |
| **~~compensation data** (Radford, PayScale) | comp-analysis | Benchmarks de marché en temps réel |
| **~~knowledge base** (Notion, Confluence) | policy-lookup, onboarding | Recherche automatique de politiques et docs |
| **~~calendar** (Google Calendar, Outlook) | onboarding, interview-prep | Création automatique d'événements |
| **~~chat** (Slack, Teams) | people-report | Partage de rapports dans les canaux |
| **~~project tracker** (Jira, Linear, Asana) | performance-review | Pull des contributions pour les évaluations |

---

*Document généré automatiquement depuis les fichiers SKILL.md du plugin human-resources de Claude.*
*Version : avril 2026*
