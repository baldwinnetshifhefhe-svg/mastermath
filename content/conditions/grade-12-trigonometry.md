# MasterMaths Condition Bank — Grade 12 Trigonometry

**Test batch: 5 conditions extracted from Siyavula Mathematics Grade 12, Chapter 4 (Trigonometry).**

Goal of this file: validate the "Master the Condition" format. If these 5 read as genuinely useful to a matric student, the same approach scales to all ~30 chapters across Gr 10 / 11 / 12 (estimated 150–450 cards total).

*Theory references informed by Siyavula, CC-BY 3.0 — https://www.siyavula.com/read/za/mathematics/grade-12/trigonometry*

---

## Condition 1 — Reverse-match a compound-angle formula

**Where you'll spot it (the trigger):**
Question says *"Evaluate without a calculator"* AND involves a non-special angle that's a sum/difference of special angles (15°, 75°, 105°, 165°…), OR you see an expression shaped like `sin A cos B ± cos A sin B` or `cos A cos B ∓ sin A sin B`.

**The strategy:**
1. If the angle is non-standard, **decompose it into special angles** (75° = 45° + 30°; 15° = 45° − 30°).
2. **Reverse-match** the structure to one of these four:
   - sin(A + B) = sinA cosB + cosA sinB
   - sin(A − B) = sinA cosB − cosA sinB
   - cos(A + B) = cosA cosB − sinA sinB
   - cos(A − B) = cosA cosB + sinA sinB
3. **Substitute** the special-angle values (sin30° = ½, cos45° = 1/√2, etc).
4. **Simplify** — usually involves rationalising the denominator.

**Traps that cost marks:**
- Distributing the trig function across the angle: writing `cos(75°) = cos(45°) + cos(30°)`. **Always wrong.** Trig functions don't distribute.
- Forgetting that `cos²θ − sin²θ` IS already a compound-angle form (it's cos(2θ)). Spot it.

**Worked example you can quote in class:**
> *"Evaluate `cos65° cos35° + sin65° sin35°` without a calculator."*
> Match: this is `cos(A − B)` with A = 65°, B = 35°. So it equals `cos(65° − 35°) = cos30° = √3/2`.

**Linked exam questions:** _[To be wired into question bank — search for "evaluate without calculator" tag]_

---

## Condition 2 — Prove an identity (work the messier side, declare restrictions)

**Where you'll spot it:**
Question says *"Prove that LHS = RHS"* — no value to find, just two expressions to show are equal. Usually mixes single-angle terms with double-angle or compound-angle terms.

**The strategy:**
1. **Pick the more complex side. Work that side only.** Never manipulate both sides simultaneously — markers reject it.
2. **Replace every double-angle term** with its identity:
   - sin2θ → 2 sinθ cosθ
   - cos2θ → cos²θ − sin²θ **or** 1 − 2sin²θ **or** 2cos²θ − 1 — pick the form that matches the other side's structure.
3. **Factor** numerator and denominator. Look for common factors you can cancel.
4. **State restrictions** — values of θ where the identity is undefined (denominators = 0, or terms you cancelled = 0).

**Traps that cost marks:**
- **Skipping the restrictions line.** The mark scheme almost always awards a mark for "identity not valid when θ = …". Most students skip it. Easy mark, easy lose.
- **Cancelling without checking.** If you cancel `(2sinθ − 1)`, you must note `2sinθ − 1 ≠ 0`, i.e. θ ≠ 30° + k·360° and θ ≠ 150° + k·360°.
- **Working both sides at once.** Even if it's algebraically valid, markers treat it as a logical error and dock the whole question.

**Worked example shape (Siyavula's Example 8 reframed):**
> *"Prove (sinθ + sin2θ) / (1 + cosθ + cos2θ) = tanθ."*
> Strategy: substitute sin2θ = 2sinθ cosθ and cos2θ = 2cos²θ − 1 into the LHS. Numerator factors as sinθ(1 + 2cosθ). Denominator factors as cosθ(1 + 2cosθ). The (1 + 2cosθ) cancels. Left with sinθ/cosθ = tanθ. ✓
> Restrictions: cosθ ≠ 0 → θ ≠ 90° + k·180°. And 1 + 2cosθ ≠ 0 → θ ≠ 120° + k·360° and θ ≠ 240° + k·360°.

**Linked exam questions:** _[To be wired — search for "prove that" + trig]_

---

## Condition 3 — General solution (don't divide — factor)

**Where you'll spot it:**
Question says *"Determine the general solution"* OR *"Solve for θ"* with no domain restriction. Equation usually has more than one trig term — e.g. `sinθ cos²θ = sin³θ`, or quadratic shapes like `2sin²θ − sinθ − 1 = 0`.

**The strategy:**
1. **Move everything to one side.** Make the equation equal to zero.
2. **Factor.** Never divide by a trig term — dividing loses solutions.
3. **Apply zero-product law:** each factor = 0 gives a separate equation.
4. **Solve each one** using reference angle + CAST:
   - sin: θ = ref + k·360° OR θ = (180° − ref) + k·360°
   - cos: θ = ±ref + k·360°
   - tan: θ = ref + k·180°

**Traps that cost marks:**
- **Dividing by sinθ to "simplify".** Every time you do this you lose the entire family where sinθ = 0. The marker WILL notice. Factor instead.
- **Stopping after one family.** Sine and cosine equations almost always have two families of solutions. Write both.
- **Mixing units** (radians vs degrees). DBE always uses degrees — if your calculator is in radians, the reference angle is wrong.

**Worked example shape (Siyavula's Example 4):**
> *"Solve sinθ cos²θ = sin³θ for the general solution."*
> Move to one side: sinθ cos²θ − sin³θ = 0.
> Factor: sinθ (cos²θ − sin²θ) = 0 → sinθ (cosθ − sinθ)(cosθ + sinθ) = 0.
> Three separate equations:
> - sinθ = 0 → θ = 0° + k·180° (covers 0° and 180°)
> - cosθ = sinθ → tanθ = 1 → θ = 45° + k·180°
> - cosθ = −sinθ → tanθ = −1 → θ = 135° + k·180°

**Linked exam questions:** _[To be wired — search for "general solution" + trig]_

---

## Condition 4 — Multiple-angle equation (scale the period, not just the angle)

**Where you'll spot it:**
The trig term has a coefficient inside the bracket — `cos4x`, `sin2θ`, `tan3α`. You're asked to solve for x (or θ, α), NOT for the multiple-angle.

**The strategy:**
1. **Solve for the multiple-angle first**, treating it as if it were θ. So for `cos4x = 0.8`, find what `4x` could be:
   - 4x = 36.9° + k·360°  (Q1)
   - 4x = 323.1° + k·360°  (Q4)
2. **Divide EVERYTHING by the coefficient** — the reference angle AND the period `k·360°`:
   - x = 9.2° + k·**90°**  ✓
   - x = 80.8° + k·**90°**  ✓
   - **NOT** x = 9.2° + k·360°  ✗ — this misses ¾ of the solutions
3. **List enough k-values** to capture every solution in any domain you're asked about (because the period just shrank to 90°).

**Traps that cost marks:**
- **Forgetting to divide `k·360°` by the coefficient.** This is the single most common Paper 2 error in this topic. Costs 2–3 marks every single time.
- **Mixing up which side gets divided.** Both the reference angle AND the period get divided. Not just one.
- **Negative coefficient.** For `cos(−2x) = 0.5`, remember cos is even — flip the negative inside.

**Worked example shape (Siyavula's Example 3):**
> *"Solve 8cos⁴x − 8cos²x + 1 = 0.8 to one decimal place."*
> Recognise: 8cos⁴x − 8cos²x + 1 = cos(4x). (This is a memorised identity for matric.)
> So cos(4x) = 0.8 → ref = 36.9°.
> 4x = 36.9° + k·360° **or** 4x = −36.9° + k·360°.
> Divide all by 4: x = 9.2° + k·**90°** OR x = −9.2° + k·**90°**.

**Linked exam questions:** _[To be wired — search for "cos 2x", "sin 2θ", multiple-angle]_

---

## Condition 5 — Triangle problem (pick the rule BEFORE writing)

**Where you'll spot it:**
Question gives you a triangle (2D scene or a 3D pole/building) and asks for an unknown side, angle, height, or area. You see a mix of given sides and given angles.

**The strategy — pick the rule before you write anything:**

| What you're given | What to use |
|---|---|
| 2 sides + the angle BETWEEN them, asked: third side | **Cosine rule** |
| 3 sides, asked: any angle | **Cosine rule** rearranged for cosA |
| 2 sides + a non-included angle, asked: opposite angle | **Sine rule** |
| 2 angles + any side, asked: another side | **Sine rule** (after finding the 3rd angle) |
| 2 sides + included angle, asked: area | **Area rule** (½ ab sinC) |

**For 3D problems specifically:**
1. **Find the linking side** — the one edge that appears in BOTH triangles. That's your bridge.
2. **Solve the triangle you have the most info about first** to get the length of the linking side.
3. **Carry that linking side** into the second triangle to find the target unknown.
4. **Mark every right angle in your diagram** — even ones that look slanted in a 3D sketch.

**Traps that cost marks:**
- **Rounding too early.** If you round `FB ≈ 82.1` and then use it in the next step, your final answer drifts. Carry full calculator precision until the final answer.
- **Sine-rule ambiguity.** When `sinC = 0.94` you get C = 70° OR C = 110°. The diagram tells you which — never assume.
- **Mistaking which angle is "included".** The included angle for the cosine rule is the one between the two named sides — not opposite them.

**Worked example shape (Siyavula's Example 15 — tower height):**
> *"T is the top of a pole, F is its base on the horizontal plane. From B, angle of elevation to T is 25°. AB = 120m, ∠FAB = 40°, ∠FBA = 30°. Find the height of the pole."*
> Linking side: **FB** (appears in △FAB on the ground AND △TFB vertical).
> Step 1 — △FAB: third angle = 180° − 40° − 30° = 110°. Sine rule: FB/sin40° = 120/sin110° → FB ≈ 82.08 m.
> Step 2 — △TFB (right angle at F): tan25° = FT/FB → FT = 82.08 × tan25° ≈ **38 m**.

**Linked exam questions:** _[To be wired — search for "sine rule", "cosine rule", "3D" in question bank]_

---

## How to evaluate these 5 cards

Read each one as if you're a Grade 12 student looking at a Paper 2 trig question and wondering "what do I even do?" Ask yourself:

1. **Does the "Where you'll spot it" actually match what's in DBE papers?** (You know — you've marked them.)
2. **Is the strategy section concrete enough to follow?** Or is it still too vague?
3. **Are the traps the REAL traps your students fall into?** Or am I missing the ones that matter most?
4. **Does it sound like *you* teaching, or like a textbook?** The voice should be tutor-to-student, not professor-to-student.
5. **Would a matric student actually USE this on the night before Paper 2?** That's the bar.

If most of them pass — I write the script that does this same job on the other ~29 chapters automatically (Anthropic API + Siyavula content + your prompt template). One run per chapter, ~R5 per chapter in API costs, ~few minutes per chapter to generate.

If they don't pass — tell me what's off (voice, depth, structure, ordering) and I rewrite the format before we scale.
