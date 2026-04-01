# Multilingual AI Prompt Architecture Research

## Key Findings

### 1. English Prompts Are More Reliable (Industry Consensus)
- **Appian Documentation**: "Write your core instructions in English, regardless of the input or output language. LLMs' instruction-following and safety training is primarily in English, making it the most consistent and reliable way to control behavior and output format."
- **HBR Research (Dec 2025)**: LLMs respond differently in English vs Chinese - not just translation differences but actual reasoning differences.
- **Reddit/PromptDesign consensus**: Keep system prompts in English, add explicit output language instruction.

### 2. Three Strategies for Multilingual Output

**Strategy A: English Prompt + Output Language Instruction (RECOMMENDED)**
- Keep all system prompts in English
- Add a single line: "Always respond in {{userLanguage}}"
- Pros: Simplest, one set of prompts, leverages model's strongest instruction-following
- Cons: Slight quality loss for complex reasoning in non-English

**Strategy B: Translate-Process-Translate (Highest Quality)**
- Step 1: Translate user input to English
- Step 2: Process/reason in English
- Step 3: Translate output back to target language
- Pros: Best reasoning quality, English-level accuracy
- Cons: 3x API calls, higher latency, higher cost

**Strategy C: Dual Prompt Sets (Most Control)**
- Maintain separate English and Chinese prompt templates
- Pros: Full control over each language's output
- Cons: 2x maintenance burden, drift between versions, harder to iterate

### 3. For Our Use Case (B2B Sales Intelligence)
- Sales terminology (MEDDIC, Champion, POC) is universally used in English even in Chinese B2B
- Complex reasoning (deal analysis, risk scoring) benefits from English processing
- User-facing output (insights, recommendations) should be in Chinese for Chinese users

## Recommendation for Meridian

**Use Strategy A with a small enhancement:**

1. Keep ALL prompt templates in English (single source of truth)
2. Add a dynamic language instruction at the end of each system prompt:
   ```
   IMPORTANT: Respond entirely in {{language}}. Use professional business language appropriate for the target audience.
   ```
3. For sales-specific terms (MEDDIC, Champion, POC, etc.), let the model naturally handle them - in Chinese B2B context, these terms are commonly used in English
4. No need for dual prompt sets - this avoids maintenance burden and version drift

**Implementation**: Just inject `\nIMPORTANT: Respond in Chinese (简体中文).` into the system prompt when user's language preference is 'zh'.
