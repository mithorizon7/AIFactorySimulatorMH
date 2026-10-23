# Release B learning-content review

Review date: 2026-10-23. Audience: age 14 through adult.

This is a source and wording review, not learner-comprehension testing, learning-outcome evidence, product validation, or a forecast. No participants were recruited and no study responses were collected. Historical research supports only the bounded claims below, not the game's prices, timelines, era sequence, returns, capacity multipliers, or simulated customer behavior.

## Content contract and visible treatment

`client/src/lib/learningContent.ts` owns strict, runtime-validated `LearningClaim`, `EraLearning`, and `BreakthroughLearning` contracts. Every claim stores an ID, text, source URLs, review date, claim type, uncertainty label, and links to canonical command types or explicitly enumerated simulation observations. Historical/current claims require a source; game-only claims may have none. Unknown fields, dates, mechanic links, and unlabeled GNT-5–GNT-7 era entries fail validation.

The UI must display the claim type, uncertainty label, review date, and source links alongside the learning material. Source links are context, not endorsements of the simulation. Simulation-only copy is labeled as game guidance rather than real-world evidence. `narrativeLearning` and `tutorialLearning` provide provenance for the retained legacy keys; their target IDs and phase structure remain compatible with existing consumers.

The source registry is `learningSources`. The active era curriculum is `eraLearning`; the reviewed milestone lookup is `breakthroughLearning`. Legacy resource/era/synergy exports retain their old display shape and add a `lesson` field containing provenance. Any persisted training/funding/breakthrough prose must be replaced in active educational UI with these lookups or clearly simulation-only text; persisted catalog prose is not the reviewed curriculum.

## Primary-source ledger

| Source                                                                                                                                | Bounded use                                                                                                                                      | Explicit boundary                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| [Attention Is All You Need](https://arxiv.org/abs/1706.03762), 2017                                                                   | Attention-based Transformer architecture and translation evaluation; GNT-2, resource algorithms, breakthrough 1.                                 | Not a recipe for AGI or proof that one architecture explains all progress.                                           |
| [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165), 2020                                                       | GPT-3's 175-billion-parameter model; examples in prompts without per-task weight updates; GNT-3 and breakthroughs 2–4.                           | The paper reports failures too. Prompt learning is not retraining; GNT-3 is fictional, not GPT-3.                    |
| [GPT-4 Technical Report](https://arxiv.org/html/2303.08774v6), 2023; reviewed version v6                                              | Image/text inputs, text outputs, limitations, and section 2 withholding model size/hardware/training compute; breakthrough 6.                    | No claim of trillions of parameters, a known training bill, or universal human-level ability.                        |
| [Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556), 2022                                              | Chinchilla versus a larger comparison model at the same training-compute budget; data/model-size allocation; GNT-5 motivation and resource data. | Results on reported evaluations do not establish a universally optimal mix or predict a later model generation.      |
| [Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155), 2022                         | Human demonstrations, ranked responses, reward-based fine-tuning, and measured preference/truthfulness improvements; breakthroughs 5 and 17.     | Models still made mistakes. Human feedback does not certify harmlessness, truth, or alignment in every setting.      |
| [Chain-of-Thought Prompting Elicits Reasoning in Large Language Models](https://arxiv.org/abs/2201.11903), 2022                       | Intermediate-step prompting improved selected reasoning evaluations; historical motivation for speculative breakthrough 16.                      | Generated text is not proof of faithful thought, human-like cognition, or correctness.                               |
| [Textbooks Are All You Need](https://arxiv.org/abs/2306.11644), 2023                                                                  | Selected and generated coding data in phi-1; motivation for speculative breakthrough 19.                                                         | Specific coding evaluations do not show unlimited reliable generated knowledge.                                      |
| [The Curse of Recursion: Training on Generated Data Makes Models Forget](https://arxiv.org/abs/2305.17493), 2023; reviewed version v3 | Degradation observed in recursive generated-data settings; counterweight for breakthrough 19.                                                    | Does not establish inevitable failure of every synthetic-data mixture. Selection, mixture, and evaluation matter.    |
| [Google SRE: Handling Overload](https://sre.google/sre-book/handling-overload/)                                                       | Overload can produce degraded responses/errors; GNT-4 reliability context and GNT-6 reserves.                                                    | Does not establish customer churn rates, AI-specific dollar returns, or a universal utilization cutoff.              |
| [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)                                            | Voluntary consideration of risk through development/use; GNT-6 motivation.                                                                       | Not legal advice, a legal-compliance checklist, or a guarantee of safety; the source page notes an ongoing revision. |

All linked pages were read during this review. Research-paper abstracts support the narrow experimental claims; the GPT-4 report's section 2 was inspected directly for nondisclosure. No secondary cost estimate or unsourced product-market metric was retained as historical fact.

## Era learning and reflection

| Era                | Strategic tension                                       | Reflection                                                                            |
| ------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| GNT-2              | Seed capital across infrastructure, data, and research. | Which blocker did your first purchase remove, and what did you postpone?              |
| GNT-3              | Revenue versus training capacity.                       | Did serving more customers leave enough capacity for your next training run?          |
| GNT-4              | Growth versus overload and churn.                       | Did extra demand improve your revenue, or increase shortfall and churn?               |
| GNT-5, speculative | Quality/efficiency versus brute-force scale.            | Which choice improved progress per dollar?                                            |
| GNT-6, speculative | Speed versus governance, redundancy, and resilience.    | What did governance or spare capacity protect, and what did it cost?                  |
| GNT-7, speculative | Complete the scenario and reconsider decisions.         | Which trade-off would you reverse on replay, and which run facts support that choice? |

The future-era labels describe fictional scenarios even when a similarly named technique already has research literature. Historical motivation is not evidence that the game's future application works. Completing GNT-7 is not an AGI claim.

## Important corrections

- Removed the IQ analogy and claims of building the world's first AGI. Model Capability is explicitly synthetic and is not a real-world benchmark or intelligence forecast.
- Removed claims that OpenAI needed GPT-3 API revenue or ChatGPT subscriptions to pay a known GPT-4 training bill. The retained content makes no unsupported financing causation or exact training-cost claim.
- Removed one-to-one GNT/GPT era identity, undisclosed parameter-count claims, and assertions that scaling guarantees general intelligence.
- Replaced unqualified statements that RLHF makes models safe, local/federated processing eliminates privacy concerns, generated data guarantees truth, or formal verification makes arbitrary self-improvement risk-free.
- Replaced universal advice to invest evenly or treat high utilization as failure. Guidance asks players to inspect actual blockers, capacity shortfall, customer loss, and the opportunity cost of their next choice.
- All 21 existing breakthrough IDs have a reviewed lookup. Entries assigned to speculative GNT-5–GNT-7 remain speculative; retained historical research is explicitly bounded.

## Verification and release boundary

The content unit suite verifies strict metadata, registered source URLs, era/milestone coverage, future-era labels, distinct reflection questions, compatibility shapes, and removal of selected misleading wording. The tutorial-target compatibility check and TypeScript check cover existing consumers. These automated checks do not replace human comprehension review. Integration must separately verify that source/date/type/uncertainty are visible in the rendered UI and that legacy persisted educational prose is not still displayed.

Release B source completion is separate from deployment and learner acceptance. Release C's consented study and product-validation gates remain deferred.
