// ===== Searchable Dropdown Skill Picker =====
// Allows users to pick skills from an interactive dropdown with live search and filter.
// Users can browse all available skills, filter by typing in the search box, and select/deselect.
//
// Usage:
//   const picker = createSkillPicker(boxElement, 'skills', ['python'], 15, 'Select skills…');
//   picker.skills   -> array of chosen skill slugs, e.g. ['python', 'react']
//   picker.input    -> search input element (for focus management)
//   picker.setSkills(['fastapi']) -> update skills
//   picker.clear()  -> clear all skills

function createSkillPicker(box, inputId, startingSkills, maxSkills, placeholder) {
  const picker = {
    skills: Array.isArray(startingSkills) ? startingSkills.slice() : [],
  };

  const defaultPlaceholder = placeholder || 'Select skills…';

  box.innerHTML = `
    <div class="picker">
      <div class="picker-box" id="${inputId}-box" role="combobox" aria-expanded="false" aria-haspopup="listbox">
        <ul class="picker-chips" aria-label="Selected skills"></ul>
        <div class="picker-trigger-wrap">
          <span class="picker-trigger-placeholder">${escapeHtml(defaultPlaceholder)}</span>
        </div>
        <div class="picker-box-actions">
          <span class="picker-count-badge" aria-label="Selected count">0/${maxSkills}</span>
          <button type="button" class="picker-toggle-btn" aria-label="Toggle skills dropdown" tabindex="-1">
            ${icon('chevronDown', 14)}
          </button>
        </div>
      </div>

      <div class="picker-dropdown" id="${inputId}-dropdown" hidden role="listbox" aria-multiselectable="true">
        <div class="picker-dropdown-header">
          <div class="picker-search-wrap">
            <span class="picker-search-icon">${icon('search', 14)}</span>
            <input type="text" id="${inputId}" class="picker-search-input"
              placeholder="Search skills… (e.g. Python, React)" autocomplete="off" aria-label="Search skills">
            <button type="button" class="picker-search-clear" aria-label="Clear search" title="Clear search" hidden>
              ${icon('x', 12)}
            </button>
          </div>
          <div class="picker-dropdown-meta">
            <span class="picker-dropdown-count">Loading skills…</span>
            <button type="button" class="picker-dropdown-close" aria-label="Close dropdown">Done</button>
          </div>
        </div>
        <ul class="picker-options" tabindex="-1"></ul>
      </div>

      <p class="picker-status" aria-live="polite"></p>
    </div>`;

  const pickerBox = box.querySelector('.picker-box');
  const chipList = box.querySelector('.picker-chips');
  const placeholderEl = box.querySelector('.picker-trigger-placeholder');
  const countBadge = box.querySelector('.picker-count-badge');
  const toggleBtn = box.querySelector('.picker-toggle-btn');
  const dropdown = box.querySelector('.picker-dropdown');
  const searchInput = box.querySelector('.picker-search-input');
  const clearBtn = box.querySelector('.picker-search-clear');
  const dropdownCount = box.querySelector('.picker-dropdown-count');
  const doneBtn = box.querySelector('.picker-dropdown-close');
  const optionsList = box.querySelector('.picker-options');
  const status = box.querySelector('.picker-status');

  picker.input = searchInput;
  picker.box = pickerBox;

  let focusedIndex = -1;

  function getCatalog() {
    if (Array.isArray(allSkills) && allSkills.length > 0) {
      return allSkills;
    }
    return [
      { slug: 'python', label: 'Python' }, { slug: 'javascript', label: 'JavaScript' },
      { slug: 'react', label: 'React' }, { slug: 'fastapi', label: 'FastAPI' },
      { slug: 'nodejs', label: 'Node.js' }, { slug: 'postgresql', label: 'PostgreSQL' },
      { slug: 'machine-learning', label: 'Machine Learning' }, { slug: 'docker', label: 'Docker' },
      { slug: 'figma', label: 'Figma' }, { slug: 'flutter', label: 'Flutter' },
      { slug: 'c', label: 'C' }, { slug: 'c++', label: 'C++' },
      { slug: 'java', label: 'Java' }, { slug: 'embedded', label: 'Embedded' },
      { slug: 'data-analysis', label: 'Data Analysis' },
    ];
  }

  function updateCountBadge() {
    countBadge.textContent = `${picker.skills.length}/${maxSkills}`;
    if (picker.skills.length > 0) {
      placeholderEl.style.display = 'none';
    } else {
      placeholderEl.style.display = '';
    }
  }

  function drawChips() {
    let html = '';
    picker.skills.forEach(function (slug, index) {
      const name = escapeHtml(skillLabel(slug));
      html += `
        <li class="chip picker-chip">
          <span>${name}</span>
          <button type="button" data-index="${index}" aria-label="Remove ${name}" tabindex="-1">${icon('x', 12)}</button>
        </li>`;
    });
    chipList.innerHTML = html;

    chipList.querySelectorAll('button').forEach(function (btn) {
      btn.onclick = function (event) {
        event.stopPropagation();
        const idx = Number(btn.dataset.index);
        picker.skills.splice(idx, 1);
        status.textContent = '';
        drawChips();
        updateCountBadge();
        if (!dropdown.hidden) {
          renderOptions();
        }
      };
    });

    updateCountBadge();
  }

  function filterCatalog(catalog, query) {
    const q = query.trim().toLowerCase();
    // Only search/filter if query is at least 3 characters
    if (!q || q.length < 3) {
      return catalog;
    }
    const shortcut = typeof SKILL_SHORTCUTS !== 'undefined' && SKILL_SHORTCUTS[q] ? SKILL_SHORTCUTS[q] : null;
    return catalog.filter(function (skill) {
      const label = skill.label.toLowerCase();
      const slug = skill.slug.toLowerCase();
      return label.includes(q) || slug.includes(q) || (shortcut && slug === shortcut);
    });
  }

  function renderOptions() {
    const catalog = getCatalog();
    const query = searchInput.value;
    const trimmed = query.trim();

    // Validator: if user entered 1 or 2 characters, display validator prompt
    if (trimmed.length > 0 && trimmed.length < 3) {
      clearBtn.hidden = false;
      dropdownCount.innerHTML = `<span class="picker-validator-hint">Type at least 3 characters to filter (${trimmed.length}/3)</span>`;
      optionsList.innerHTML = `<li class="picker-empty picker-validator-hint">Please enter at least 3 characters to search skills.</li>`;
      return;
    }

    const filtered = filterCatalog(catalog, query);

    if (trimmed.length >= 3) {
      clearBtn.hidden = false;
      dropdownCount.textContent = `${filtered.length} match${filtered.length === 1 ? '' : 'es'} found for "${trimmed}"`;
    } else {
      clearBtn.hidden = true;
      dropdownCount.textContent = `${catalog.length} skills available (click to toggle)`;
    }

    if (filtered.length === 0) {
      optionsList.innerHTML = `<li class="picker-empty">No skills match "<strong>${escapeHtml(trimmed)}</strong>"</li>`;
      return;
    }

    let html = '';
    filtered.forEach(function (skill, index) {
      const isSelected = picker.skills.includes(skill.slug);
      const isFocused = index === focusedIndex;
      html += `
        <li class="picker-option ${isSelected ? 'is-selected' : ''} ${isFocused ? 'is-focused' : ''}"
            role="option"
            aria-selected="${isSelected}"
            data-slug="${escapeHtml(skill.slug)}"
            data-index="${index}">
          <span class="picker-option-left">
            <span class="picker-option-checkbox">${isSelected ? icon('check', 12) : ''}</span>
            <span class="picker-option-label">${escapeHtml(skill.label)}</span>
          </span>
          <span class="picker-option-badge">${isSelected ? 'Added' : '+ Add'}</span>
        </li>`;
    });
    optionsList.innerHTML = html;

    optionsList.querySelectorAll('.picker-option').forEach(function (item) {
      item.onclick = function (event) {
        event.stopPropagation();
        toggleSkill(item.dataset.slug);
      };
    });
  }

  function toggleSkill(slug) {
    const idx = picker.skills.indexOf(slug);
    if (idx >= 0) {
      picker.skills.splice(idx, 1);
      status.textContent = '';
    } else {
      if (picker.skills.length >= maxSkills) {
        status.textContent = `You can select up to ${maxSkills} skills.`;
        return;
      }
      picker.skills.push(slug);
      status.textContent = '';
      if (searchInput.value.trim() !== '') {
        searchInput.value = '';
        clearBtn.hidden = true;
      }
    }
    drawChips();
    renderOptions();
    searchInput.focus();
  }

  function openDropdown() {
    dropdown.hidden = false;
    pickerBox.classList.add('is-open');
    pickerBox.setAttribute('aria-expanded', 'true');
    renderOptions();
    searchInput.focus();
  }

  function closeDropdown() {
    dropdown.hidden = true;
    pickerBox.classList.remove('is-open');
    pickerBox.setAttribute('aria-expanded', 'false');
    focusedIndex = -1;
  }

  function toggleDropdown() {
    if (dropdown.hidden) {
      openDropdown();
    } else {
      closeDropdown();
    }
  }

  // Event Listeners
  pickerBox.addEventListener('click', function (event) {
    if (event.target.closest('.picker-chip button')) {
      return;
    }
    if (dropdown.hidden) {
      openDropdown();
    } else if (event.target.closest('.picker-toggle-btn')) {
      closeDropdown();
    } else {
      searchInput.focus();
    }
  });

  searchInput.addEventListener('input', function () {
    focusedIndex = -1;
    renderOptions();
  });

  searchInput.addEventListener('keydown', function (event) {
    const catalog = getCatalog();
    const filtered = filterCatalog(catalog, searchInput.value);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (filtered.length > 0) {
        focusedIndex = (focusedIndex + 1) % filtered.length;
        renderOptions();
        const activeItem = optionsList.querySelector(`.picker-option[data-index="${focusedIndex}"]`);
        if (activeItem) activeItem.scrollIntoView({ block: 'nearest' });
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (filtered.length > 0) {
        focusedIndex = (focusedIndex - 1 + filtered.length) % filtered.length;
        renderOptions();
        const activeItem = optionsList.querySelector(`.picker-option[data-index="${focusedIndex}"]`);
        if (activeItem) activeItem.scrollIntoView({ block: 'nearest' });
      }
    } else if (event.key === 'Enter') {
      event.preventDefault(); // Don't submit the form
      const trimmed = searchInput.value.trim();
      if (trimmed.length > 0 && trimmed.length < 3) {
        status.textContent = 'Please enter at least 3 characters to search skills.';
        return;
      }
      if (focusedIndex >= 0 && filtered[focusedIndex]) {
        toggleSkill(filtered[focusedIndex].slug);
      } else if (filtered.length === 1 && trimmed.length >= 3) {
        toggleSkill(filtered[0].slug);
      } else if (trimmed.length >= 3) {
        // Try finding exact match
        const exact = filtered.find(function (s) {
          return s.label.toLowerCase() === trimmed.toLowerCase() ||
                 s.slug.toLowerCase() === trimmed.toLowerCase();
        });
        if (exact) {
          toggleSkill(exact.slug);
        } else if (filtered.length > 0) {
          toggleSkill(filtered[0].slug);
        }
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeDropdown();
      pickerBox.focus();
    } else if (event.key === 'Backspace' && searchInput.value === '' && picker.skills.length > 0) {
      picker.skills.pop();
      status.textContent = '';
      drawChips();
      renderOptions();
    }
  });

  clearBtn.addEventListener('click', function (event) {
    event.stopPropagation();
    searchInput.value = '';
    clearBtn.hidden = true;
    renderOptions();
    searchInput.focus();
  });

  doneBtn.addEventListener('click', function (event) {
    event.stopPropagation();
    closeDropdown();
  });

  // Close when clicking outside
  document.addEventListener('click', function (event) {
    if (!box.contains(event.target)) {
      if (!dropdown.hidden) {
        closeDropdown();
      }
    }
  });

  // Public methods
  picker.setSkills = function (newSkills) {
    picker.skills = Array.isArray(newSkills) ? newSkills.slice() : [];
    drawChips();
    if (!dropdown.hidden) {
      renderOptions();
    }
  };

  picker.clear = function () {
    picker.skills = [];
    searchInput.value = '';
    status.textContent = '';
    drawChips();
    if (!dropdown.hidden) {
      renderOptions();
    }
  };

  picker.open = openDropdown;
  picker.close = closeDropdown;

  drawChips();
  return picker;
}
