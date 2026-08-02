# ThinkFlow Design System v1.0

---

# 1. Design Principles

Every UI decision should support learning.

The interface should feel:

- Calm
- Focused
- Intentional
- Professional
- Trustworthy

The interface should never compete with the user's thinking.

Learning is the primary interaction.

Visual design should disappear into the background.

---

# 2. Design Keywords

Use these words when making design decisions.

- Minimal
- Spacious
- Clean
- Structured
- Modern
- Quiet
- Predictable
- Fast
- Consistent

Avoid:

- Playful
- Loud
- Flashy
- Futuristic
- Neon
- Gamified
- Decorative

---

# 3. Design References

Reference products

- Linear
- Vercel
- GitHub
- Stripe Dashboard
- Notion
- Raycast

These are references for quality, not templates to copy.

---

# 4. Color Philosophy

Use color to communicate information.

Never use color purely for decoration.

Accent colors should guide attention, not dominate the interface.

Maintain high contrast for readability.

Avoid rainbow palettes.

---

# 5. Theme

Dark mode is the primary experience.

Light mode may be added later.

Dark surfaces should use layered elevation rather than heavy shadows.

---

# 6. Typography

Use a single modern sans-serif font.

Hierarchy should come from size and weight, not color.

Example hierarchy

Page Title

↓

Section Title

↓

Card Title

↓

Body

↓

Secondary Text

↓

Caption

Never use more than three font weights.

Avoid ALL CAPS except tiny labels.

---

# 7. Spacing System

Use a consistent spacing scale.

Never use arbitrary spacing.

All margins and padding should follow one spacing system.

Whitespace is preferred over crowded layouts.

---

# 8. Layout Grid

Desktop-first.

Use a consistent content width.

Cards should align on a predictable grid.

Avoid uneven layouts.

Keep page rhythm consistent.

---

# 9. Border Radius

Use one radius scale.

Small elements:

subtle radius

Cards:

medium radius

Dialogs:

slightly larger radius

Avoid inconsistent rounding.

---

# 10. Elevation

Use elevation sparingly.

Most separation should come from spacing and contrast.

Avoid heavy shadows.

Hover states should remain subtle.

---

# 11. Icons

Use Lucide icons.

Icons support text.

Icons should rarely appear alone.

Use one consistent icon size per context.

Avoid decorative icon usage.

---

# 12. Buttons

Button hierarchy

Primary

Secondary

Ghost

Destructive

Only one Primary button per screen.

Buttons should communicate importance through hierarchy rather than color saturation.

---

# 13. Inputs

All inputs should have

- label
- helper text (when needed)
- validation
- error message

Never rely on placeholder text as a label.

---

# 14. Forms

Forms should be short.

Group related fields.

Validate early without becoming intrusive.

Show clear success and failure feedback.

---

# 15. Cards

Cards represent logical sections.

Cards should

- breathe
- remain uncluttered
- have consistent padding

Avoid nesting cards inside cards unless necessary.

---

# 16. Navigation

Navigation should always answer

Where am I?

What can I do next?

How do I go back?

Avoid hidden navigation.

---

# 17. Tables

Use tables only when comparison matters.

Support

- sorting (if useful)
- responsive behavior
- readable spacing

Avoid dense enterprise-style tables.

---

# 18. Charts

Charts communicate progress.

Avoid decorative charts.

Every chart must answer a user question.

Recognition Trend

Weak Patterns

Transfer Success

are meaningful.

Pie charts should generally be avoided.

---

# 19. Feedback States

Provide immediate feedback.

Success

Error

Warning

Information

should each be visually distinct.

Feedback should explain what happened and, when appropriate, what the user can do next.

---

# 20. Loading States

Prefer skeleton loaders.

Avoid large spinners.

Loading should preserve page structure.

---

# 21. Empty States

Every empty state should

Explain why it's empty.

Suggest the next action.

Avoid blank screens.

---

# 22. Error States

Every error should

Explain what happened.

Explain how to recover.

Provide Retry where appropriate.

Avoid vague messages.

---

# 23. Motion

Motion should support understanding.

Use

- small fades
- subtle transitions
- layout animations only where meaningful

Respect reduced-motion preferences.

Avoid long animations.

Avoid animation for decoration.

---

# 24. Accessibility

Support

- keyboard navigation
- focus visibility
- semantic HTML
- sufficient contrast
- screen readers

Accessibility is part of the design system.

---

# 25. Responsive Behavior

Desktop

Primary experience.

Tablet

Maintain layout consistency.

Mobile

Stack content naturally.

Do not hide important functionality.

---

# 26. Component Philosophy

Components should be

Reusable

Composable

Typed

Accessible

Independent

A component should solve one problem only.

---

# 27. Visual Consistency Rules

Every screen should feel like it belongs to the same product.

Consistent

spacing

typography

button styles

cards

input fields

navigation

charts

icons

No screen should introduce a new visual language.

---

# 28. Screen Quality Checklist

Before any screen is considered complete:

✓ Matches approved wireframe

✓ Uses reusable components

✓ Uses design system tokens

✓ Responsive

✓ Accessible

✓ Loading state implemented

✓ Empty state implemented

✓ Error state implemented

✓ Success state implemented (where applicable)

✓ No duplicated styling

✓ No inconsistent spacing

✓ Keyboard accessible

✓ Ready for backend integration

---

# 29. Definition of Good Design

Good design is not the one with the most animations.

Good design reduces cognitive effort.

The user should immediately understand:

Where they are.

What they should do.

Why they should do it.

The interface should quietly support learning instead of demanding attention.

---

# 30. Final Instruction to Codex

You are not designing a portfolio website.

You are implementing the frontend of a production-quality SaaS application focused on deliberate learning.

Whenever multiple valid UI solutions exist:

Choose the one that improves clarity, consistency, accessibility, and maintainability.

Never sacrifice usability for visual novelty.

When uncertain, prefer the simpler implementation that aligns with the approved wireframes and the ThinkFlow frontend specification.
