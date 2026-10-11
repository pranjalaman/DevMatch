// ===== Skill picker =====
// A text box where you type a skill and press Enter (or click Add) to add it as a chip.
// Suggestions come from the browser's built-in <datalist id="skill-options">,
// which script.js fills with every skill when the app starts.
//
// Usage:
//   const picker = createSkillPicker(boxElement, 'skills', ['python'], 15, 'Add a skill...');
//   picker.skills   -> the chosen skill slugs, e.g. ['python', 'react']

function createSkillPicker(box, inputId, startingSkills, maxSkills, placeholder) {
  const picker = {
    skills: startingSkills.slice(), // .slice() makes a copy so we don't change the original list
  };

  box.innerHTML = `
    <div class="picker">
      <div class="picker-box">
        <ul class="picker-chips"></ul>
        <input id="${inputId}" class="picker-input" type="text" list="skill-options"
          placeholder="${placeholder}" autocomplete="off" aria-describedby="${inputId}-error">
        <button type="button" class="btn btn-sm picker-add">Add</button>
      </div>
      <p class="picker-status" aria-live="polite"></p>
    </div>`;

  const chipList = box.querySelector('.picker-chips');
  const input = box.querySelector('.picker-input');
  const status = box.querySelector('.picker-status');
  picker.input = input;

  // Draw one chip (with an x button) for every chosen skill
  function drawChips() {
    let html = '';
    picker.skills.forEach(function (slug, index) {
      const name = escapeHtml(skillLabel(slug));
      html += `
        <li class="chip picker-chip">
          ${name}
          <button type="button" data-index="${index}" aria-label="Remove ${name}">${icon('x', 12)}</button>
        </li>`;
    });
    chipList.innerHTML = html;

    // Clicking x removes that skill
    chipList.querySelectorAll('button').forEach(function (button) {
      button.onclick = function () {
        picker.skills.splice(Number(button.dataset.index), 1);
        drawChips();
        input.focus();
      };
    });
  }

  function addTypedSkill() {
    const typed = input.value.trim();
    if (typed === '') {
      return;
    }

    const slug = findSkill(typed);
    if (slug === null) {
      status.textContent = `"${typed}" is not in the skill list. Pick one from the suggestions.`;
      return;
    }
    if (picker.skills.includes(slug)) {
      input.value = ''; // already added, nothing to do
      return;
    }
    if (picker.skills.length >= maxSkills) {
      status.textContent = `You can add up to ${maxSkills} skills.`;
      return;
    }

    picker.skills.push(slug);
    input.value = '';
    status.textContent = '';
    drawChips();
  }

  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault(); // don't submit the whole form
      addTypedSkill();
    }
    // Backspace in an empty box removes the last chip
    if (event.key === 'Backspace' && input.value === '' && picker.skills.length > 0) {
      picker.skills.pop();
      drawChips();
    }
  });

  // Fires when the user picks a suggestion and leaves the box
  input.addEventListener('change', addTypedSkill);

  box.querySelector('.picker-add').onclick = function () {
    addTypedSkill();
    input.focus();
  };

  picker.setSkills = function (newSkills) {
    picker.skills = newSkills.slice();
    drawChips();
  };

  picker.clear = function () {
    picker.skills = [];
    input.value = '';
    status.textContent = '';
    drawChips();
  };

  drawChips();
  return picker;
}
