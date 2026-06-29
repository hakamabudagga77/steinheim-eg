# Steinheim Egypt Use Case Map

This document is the business guardrail for new features. If a feature does not make selection, specification, purchase, or trade follow-up easier, it should not be built yet.

## Core direction

Steinheim Egypt should feel like a custom digital showroom and specification assistant, not a generic Shopify storefront.

The site should help people:

1. Understand the Steinheim brand.
2. Choose the right collection.
3. Choose the right finish.
4. Pick exact Egypt-available products.
5. Build a cart or project board.
6. Request trade pricing with less back-and-forth.

## Primary audiences

### 1. Homeowner / villa buyer

Need:

- Understand which collection fits their bathroom style.
- See products clearly with prices and finishes.
- Add products to cart.
- Ask for help without needing technical knowledge.

Best website response:

- Clear collection guidance.
- Finish visual explanation.
- Simple cart.
- Later: AI consultant for "what should I buy for my bathroom?"

### 2. Interior designer

Need:

- Compare collection moods.
- Select finishes confidently.
- Prepare product selections for a client.
- Share model numbers and specification details.

Best website response:

- Collection positioning.
- Finish visualizer.
- Product pages with model numbers and technical tabs.
- Project board with downloadable PDF.

### 3. Developer / hotel / project manager

Need:

- Turn room counts into a product schedule.
- Set quantities across many rooms.
- Request trade pricing.
- Avoid long WhatsApp/email explanation loops.

Best website response:

- Smart Room Calculator.
- Project board.
- RFQ PDF.
- Lead scoring/completion.
- Later: project status tracker.

### 4. Contractor / procurement

Need:

- Model numbers.
- Finishes.
- Quantities.
- Technical details.
- Availability and lead time from Steinheim Egypt.

Best website response:

- Product specs.
- Downloadable RFQ/spec PDF.
- Clear disclaimer that trade price, stock, and lead time are confirmed by the team.

### 5. Kareem / Steinheim Egypt team

Need:

- Better-quality leads.
- Fewer vague messages.
- Product schedules with model numbers and quantities.
- Clear project context before replying.

Best website response:

- Trade lead dashboard.
- Project board submissions.
- PDF generation.
- Later: AI-assisted lead summary and recommended reply.

## Feature priority

### Phase 1 - Accuracy and trust

Goal: Make the current site honest, consistent, and demo-safe.

- Keep product counts tied to catalogue data.
- Do not claim real email/WhatsApp sending unless implemented and approved.
- Keep demo contact destinations obvious internally.
- Avoid unsupported origin claims such as "Made in Germany" unless confirmed.

### Phase 2 - Smart Room Calculator

Goal: The first truly business-changing feature.

User flow:

1. Choose project type: villa, apartment, hotel, compound, commercial.
2. Choose room types and quantities.
3. Choose collection strategy: practical premium, premium, signature.
4. Choose finish preference.
5. Generate a project schedule.
6. Add schedule to project board.

Why this matters:

- It turns a vague trade enquiry into a structured schedule.
- It saves Kareem time.
- It makes the website feel custom-built for Steinheim.

### Phase 3 - AI Consultant

Goal: Make the site feel intelligent, but grounded in real Steinheim Egypt data.

The AI should:

- Recommend only Egypt-available products unless clearly saying otherwise.
- Explain collection choices.
- Ask clarifying questions when project context is missing.
- Add recommended products to the project board.
- Use the Smart Room Calculator logic instead of inventing schedules.

The AI should not:

- Invent trade discounts, stock, delivery times, project details, or unavailable SKUs.
- Pretend to be Kareem.
- Send real messages without approval.

### Phase 4 - Finish Visualizer

Goal: Make finish selection emotional and easy.

Useful for:

- Homeowners choosing a bathroom mood.
- Designers presenting finishes.
- Trade buyers standardizing a finish across rooms.

### Phase 5 - Trade operations

Goal: Help Steinheim manage leads after the website starts generating serious demand.

Features:

- Lead dashboard.
- Lead priority/scoring.
- Status tracking.
- PDF history.
- Follow-up notes.

## Next feature to build

Build the Smart Room Calculator before the AI consultant.

Reason: The calculator creates the structured product-selection logic that the AI can later use. Without it, AI becomes a chatbot. With it, AI becomes a sales/specification assistant.
