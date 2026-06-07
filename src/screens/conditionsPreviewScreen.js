// ConditionsPreviewScreen — hardcoded preview of the 5 trig condition cards
// generated from Siyavula (Grade 12 Ch.4). Standalone, no Supabase reads — its
// only job is to let the product owner judge the FORMAT in the real UI before
// we invest in a DB-backed condition bank.
//
// Each card body is markdown + KaTeX, rendered through the existing mathView
// iframe so the maths sits alongside the same styling as the Strategy tab.
import { mathView } from '../components/mathView.js';
import { getTheme } from '../theme/theme.js';

const CARDS = [
  {
    n: 1,
    title: 'Reverse-match a compound-angle formula',
    body: `
#### 🎯 Where you'll spot it
Question says **"Evaluate without a calculator"** AND involves a non-special angle that is a sum or difference of special angles (15°, 75°, 105°, 165°…), OR you see an expression shaped like $\\sin A \\cos B \\pm \\cos A \\sin B$ or $\\cos A \\cos B \\mp \\sin A \\sin B$.

#### ⚙️ The strategy
1. If the angle is non-standard, **decompose it into special angles** (75° = 45° + 30°; 15° = 45° − 30°).
2. **Reverse-match** the structure to one of these four:
   - $\\sin(A+B) = \\sin A \\cos B + \\cos A \\sin B$
   - $\\sin(A-B) = \\sin A \\cos B - \\cos A \\sin B$
   - $\\cos(A+B) = \\cos A \\cos B - \\sin A \\sin B$
   - $\\cos(A-B) = \\cos A \\cos B + \\sin A \\sin B$
3. **Substitute** the special-angle values ($\\sin 30° = \\tfrac{1}{2}$, $\\cos 45° = \\tfrac{1}{\\sqrt{2}}$, etc.).
4. **Simplify** — usually involves rationalising the denominator.

#### ⚠️ Traps that cost marks
- **Distributing the trig function across the angle:** writing $\\cos(75°) = \\cos(45°) + \\cos(30°)$. **Always wrong.** Trig functions do not distribute.
- Forgetting that $\\cos^2\\theta - \\sin^2\\theta$ is already a compound-angle form (it is $\\cos 2\\theta$). Spot it.

#### ✏️ Example
> **Evaluate $\\cos 65° \\cos 35° + \\sin 65° \\sin 35°$ without a calculator.**
>
> This matches $\\cos(A-B)$ with $A = 65°,\\ B = 35°$. So it equals $\\cos(65° - 35°) = \\cos 30° = \\tfrac{\\sqrt{3}}{2}$.
`.trim(),
  },

  {
    n: 2,
    title: 'Prove an identity (work the messier side, declare restrictions)',
    body: `
#### 🎯 Where you'll spot it
Question says **"Prove that LHS = RHS"** — no value to find, just two expressions to show are equal. Usually mixes single-angle terms with double-angle or compound-angle terms.

#### ⚙️ The strategy
1. **Pick the more complex side. Work that side only.** Never manipulate both sides at the same time — markers reject it.
2. **Replace every double-angle term** with its identity:
   - $\\sin 2\\theta \\to 2\\sin\\theta\\cos\\theta$
   - $\\cos 2\\theta \\to \\cos^2\\theta - \\sin^2\\theta$ **or** $1 - 2\\sin^2\\theta$ **or** $2\\cos^2\\theta - 1$ — pick the form that matches the other side's structure.
3. **Factor** numerator and denominator. Look for common factors you can cancel.
4. **State restrictions** — values of $\\theta$ where the identity is undefined (denominators $= 0$, or terms you cancelled $= 0$).

#### ⚠️ Traps that cost marks
- **Skipping the restrictions line.** The mark scheme almost always awards a mark for *"identity not valid when $\\theta = \\dots$"*. Most students skip it. Easy mark, easy lose.
- **Cancelling without checking.** If you cancel $(2\\sin\\theta - 1)$, you must note $2\\sin\\theta - 1 \\neq 0$, i.e. $\\theta \\neq 30° + k\\cdot 360°$ and $\\theta \\neq 150° + k\\cdot 360°$.
- **Working both sides at once.** Even if it is algebraically valid, markers treat it as a logical error and dock the whole question.

#### ✏️ Example
> **Prove $\\dfrac{\\sin\\theta + \\sin 2\\theta}{1 + \\cos\\theta + \\cos 2\\theta} = \\tan\\theta$.**
>
> Substitute $\\sin 2\\theta = 2\\sin\\theta\\cos\\theta$ and $\\cos 2\\theta = 2\\cos^2\\theta - 1$ into the LHS.
> Numerator factors as $\\sin\\theta(1 + 2\\cos\\theta)$. Denominator factors as $\\cos\\theta(1 + 2\\cos\\theta)$.
> The $(1 + 2\\cos\\theta)$ cancels. Left with $\\dfrac{\\sin\\theta}{\\cos\\theta} = \\tan\\theta$. ✓
>
> **Restrictions:** $\\cos\\theta \\neq 0 \\Rightarrow \\theta \\neq 90° + k\\cdot 180°$. And $1 + 2\\cos\\theta \\neq 0 \\Rightarrow \\theta \\neq 120° + k\\cdot 360°$ and $\\theta \\neq 240° + k\\cdot 360°$.
`.trim(),
  },

  {
    n: 3,
    title: 'General solution (don\'t divide — factor)',
    body: `
#### 🎯 Where you'll spot it
Question says **"Determine the general solution"** OR **"Solve for $\\theta$"** with no domain restriction. Equation usually has more than one trig term — e.g. $\\sin\\theta \\cos^2\\theta = \\sin^3\\theta$, or quadratic shapes like $2\\sin^2\\theta - \\sin\\theta - 1 = 0$.

#### ⚙️ The strategy
1. **Move everything to one side.** Make the equation equal to zero.
2. **Factor.** Never divide by a trig term — dividing loses solutions.
3. **Apply the zero-product law:** each factor $= 0$ gives a separate equation.
4. **Solve each one** using reference angle + CAST:
   - sin: $\\theta = \\text{ref} + k\\cdot 360°$ OR $\\theta = (180° - \\text{ref}) + k\\cdot 360°$
   - cos: $\\theta = \\pm\\text{ref} + k\\cdot 360°$
   - tan: $\\theta = \\text{ref} + k\\cdot 180°$

#### ⚠️ Traps that cost marks
- **Dividing by $\\sin\\theta$ to "simplify".** Every time you do this you lose the entire family where $\\sin\\theta = 0$. The marker WILL notice. Factor instead.
- **Stopping after one family.** Sine and cosine equations almost always have *two* families of solutions. Write both.
- **Mixing units** (radians vs degrees). DBE always uses degrees — if your calculator is in radians, the reference angle is wrong.

#### ✏️ Example
> **Solve $\\sin\\theta \\cos^2\\theta = \\sin^3\\theta$ for the general solution.**
>
> Move to one side: $\\sin\\theta \\cos^2\\theta - \\sin^3\\theta = 0$.
> Factor: $\\sin\\theta(\\cos^2\\theta - \\sin^2\\theta) = 0$, then $\\sin\\theta(\\cos\\theta - \\sin\\theta)(\\cos\\theta + \\sin\\theta) = 0$.
>
> Three separate equations:
> - $\\sin\\theta = 0 \\Rightarrow \\theta = 0° + k\\cdot 180°$ (covers 0° and 180°)
> - $\\cos\\theta = \\sin\\theta \\Rightarrow \\tan\\theta = 1 \\Rightarrow \\theta = 45° + k\\cdot 180°$
> - $\\cos\\theta = -\\sin\\theta \\Rightarrow \\tan\\theta = -1 \\Rightarrow \\theta = 135° + k\\cdot 180°$
`.trim(),
  },

  {
    n: 4,
    title: 'Multiple-angle equation (scale the period, not just the angle)',
    body: `
#### 🎯 Where you'll spot it
The trig term has a coefficient inside the bracket — $\\cos 4x$, $\\sin 2\\theta$, $\\tan 3\\alpha$. You are asked to solve for $x$ (or $\\theta$, $\\alpha$), NOT for the multiple-angle.

#### ⚙️ The strategy
1. **Solve for the multiple-angle first**, treating it as if it were $\\theta$. So for $\\cos 4x = 0.8$, first find what $4x$ could be:
   - $4x = 36.9° + k\\cdot 360°$  (Q1)
   - $4x = 323.1° + k\\cdot 360°$  (Q4)
2. **Divide EVERYTHING by the coefficient** — the reference angle AND the period $k\\cdot 360°$:
   - $x = 9.2° + k\\cdot 90°$  ✓
   - $x = 80.8° + k\\cdot 90°$  ✓
   - **NOT** $x = 9.2° + k\\cdot 360°$  ✗ — this misses ¾ of the solutions.
3. **List enough $k$-values** to capture every solution in any domain you are asked about (because the period just shrank to 90°).

#### ⚠️ Traps that cost marks
- **Forgetting to divide $k\\cdot 360°$ by the coefficient.** This is the single most common Paper 2 error in this topic. Costs 2–3 marks every single time.
- **Mixing up which side gets divided.** Both the reference angle AND the period get divided. Not just one.
- **Negative coefficient.** For $\\cos(-2x) = 0.5$, remember cosine is even — flip the negative inside.

#### ✏️ Example
> **Solve $8\\cos^4 x - 8\\cos^2 x + 1 = 0.8$ to one decimal place.**
>
> Recognise: $8\\cos^4 x - 8\\cos^2 x + 1 = \\cos 4x$. (This is a memorised identity for matric.)
> So $\\cos 4x = 0.8 \\Rightarrow \\text{ref} = 36.9°$.
> $4x = 36.9° + k\\cdot 360°$ **or** $4x = -36.9° + k\\cdot 360°$.
>
> Divide all by 4: $x = 9.2° + k\\cdot 90°$ OR $x = -9.2° + k\\cdot 90°$.
`.trim(),
  },

  {
    n: 5,
    title: 'Triangle problem (pick the rule BEFORE writing)',
    body: `
#### 🎯 Where you'll spot it
Question gives you a triangle (2D scene or a 3D pole/building) and asks for an unknown side, angle, height, or area. You see a mix of given sides and given angles.

#### ⚙️ The strategy — pick the rule before you write anything

| What you're given | What to use |
|---|---|
| 2 sides + the angle BETWEEN them, asked: third side | **Cosine rule** |
| 3 sides, asked: any angle | **Cosine rule** rearranged for $\\cos A$ |
| 2 sides + a non-included angle, asked: opposite angle | **Sine rule** |
| 2 angles + any side, asked: another side | **Sine rule** (after finding the 3rd angle) |
| 2 sides + included angle, asked: area | **Area rule** ($\\tfrac{1}{2}ab\\sin C$) |

**For 3D problems specifically:**

1. **Find the linking side** — the one edge that appears in BOTH triangles. That is your bridge.
2. **Solve the triangle you have the most info about first** to get the length of the linking side.
3. **Carry that linking side** into the second triangle to find the target unknown.
4. **Mark every right angle in your diagram** — even ones that look slanted in a 3D sketch.

#### ⚠️ Traps that cost marks
- **Rounding too early.** If you round $FB \\approx 82.1$ and then use it in the next step, your final answer drifts. Carry full calculator precision until the final answer.
- **Sine-rule ambiguity.** When $\\sin C = 0.94$ you get $C = 70°$ OR $C = 110°$. The diagram tells you which — never assume.
- **Mistaking which angle is "included".** The included angle for the cosine rule is the one *between* the two named sides — not opposite them.

#### ✏️ Example — Tower height
> **T is the top of a pole, F is its base on the horizontal plane. From B, the angle of elevation to T is 25°. $AB = 120$ m, $\\angle FAB = 40°$, $\\angle FBA = 30°$. Find the height of the pole.**
>
> **Linking side: $FB$** (appears in $\\triangle FAB$ on the ground AND $\\triangle TFB$ vertical).
>
> Step 1 — $\\triangle FAB$: third angle $= 180° - 40° - 30° = 110°$. Sine rule: $\\dfrac{FB}{\\sin 40°} = \\dfrac{120}{\\sin 110°} \\Rightarrow FB \\approx 82.08$ m.
>
> Step 2 — $\\triangle TFB$ (right angle at F): $\\tan 25° = \\dfrac{FT}{FB} \\Rightarrow FT = 82.08 \\times \\tan 25° \\approx \\textbf{38 m}$.
`.trim(),
  },
];

export function conditionsPreviewScreen() {
  const root = document.createElement('div');
  const dark = getTheme().mode === 'dark';

  // Intro banner — frames what this page is and what to judge.
  const banner = document.createElement('div');
  banner.className = 'mm-banner';
  banner.innerHTML = `
    <div class="mm-banner-title">Conditions — Preview</div>
    <div class="mm-banner-sub">Grade 12 · Trigonometry · 5-card test batch</div>
    <div class="mm-banner-note">
      First slice of the Condition Bank. If these 5 cards read as genuinely useful to a matric student,
      the same approach scales to all ~30 chapters across Gr 10 / 11 / 12 (≈ 150–450 cards total).
      Theory references informed by Siyavula, CC-BY 3.0.
    </div>
  `;
  root.appendChild(banner);

  // Quick eval rubric so the owner reads the cards with the right lens.
  const rubric = document.createElement('div');
  rubric.className = 'mm-stat-card';
  rubric.style.borderLeftColor = 'var(--accent)';
  rubric.style.marginBottom = '18px';
  rubric.innerHTML = `
    <div class="mm-stat-label" style="margin-bottom:8px">JUDGE EACH CARD ON:</div>
    <ol style="margin:0 0 0 18px;padding:0;color:var(--text);line-height:1.6;font-size:13px">
      <li>Does <em>"Where you'll spot it"</em> match what's actually in DBE papers?</li>
      <li>Is the strategy concrete enough to follow under exam pressure?</li>
      <li>Are these the <em>real</em> traps your students fall into?</li>
      <li>Does it sound like <em>you</em> teaching — or like a textbook?</li>
      <li>Would a Grade 12 reach for this on the night before Paper 2?</li>
    </ol>
  `;
  root.appendChild(rubric);

  // The 5 cards.
  for (const card of CARDS) {
    const wrap = document.createElement('div');
    wrap.className = 'mm-stat-card';
    wrap.style.borderLeftColor = 'var(--accent)';
    wrap.style.marginBottom = '20px';

    const heading = document.createElement('div');
    heading.style.cssText = 'font-weight:800;font-size:14px;color:var(--accent-dark);letter-spacing:0.5px;margin-bottom:4px;';
    heading.textContent = `CONDITION ${card.n}`;
    wrap.appendChild(heading);

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:800;font-size:18px;color:var(--text);margin-bottom:6px;line-height:1.3;';
    title.textContent = card.title;
    wrap.appendChild(title);

    wrap.appendChild(mathView({ body: card.body, fontSize: 14, dark }));
    root.appendChild(wrap);
  }

  // Attribution footer.
  const credit = document.createElement('div');
  credit.className = 'mm-stat-card';
  credit.style.marginTop = '12px';
  credit.innerHTML = `
    <p style="margin:0;line-height:1.55;font-size:12px;color:var(--text-soft)">
      Strategy framing and worked-example phrasing © MasterMaths.
      Underlying theory informed by Siyavula <em>Everything Maths Grade 12, Chapter 4 (Trigonometry)</em>,
      used under a Creative Commons Attribution 3.0 licence —
      <a href="https://www.siyavula.com/read/za/mathematics/grade-12/trigonometry" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:none">read the original on siyavula.com</a>.
    </p>
  `;
  root.appendChild(credit);

  return root;
}
