// Enhanced editor behavior for Retro Notepad with preferences and themes
(() => {
  const editor = document.getElementById('editor');
  const tools = document.querySelectorAll('.tool[data-cmd]');
  const colorPicker = document.getElementById('colorPicker');
  const fontSize = document.getElementById('fontSize');
  const fontFamily = document.getElementById('fontFamily');
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');
  const themeBtn = document.getElementById('themeBtn');
  const themeModal = document.getElementById('themeModal');
  const themeOptions = document.querySelectorAll('.theme-option');
  const status = document.getElementById('status');
  const STORAGE_KEY = 'retro-notes-content-v1';
  const PREFS_KEY = 'retro-notes-prefs-v1';
  const THEME_KEY = 'retro-notes-theme-v1';	// Ensure styleWithCSS so font color/sizing uses inline styles
	document.execCommand('styleWithCSS', false, true);

	function updateStatus(txt){
		status.textContent = txt;
		if(txt==='saved'){
			setTimeout(()=>{ if(status.textContent==='saved') status.textContent='idle' },900);
		}
	}

  // Theme handling
  function loadTheme(){
    const savedTheme = localStorage.getItem(THEME_KEY) || 'cyber-purple';
    applyTheme(savedTheme);
  }

  function applyTheme(themeName){
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem(THEME_KEY, themeName);
    // Update active state
    themeOptions.forEach(opt => {
      if(opt.dataset.theme === themeName){
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
  }

  // Preferences handling
  function loadPrefs(){
    try{
      const raw = localStorage.getItem(PREFS_KEY);
      if(!raw) return;
      const p = JSON.parse(raw);
      if(p.fontFamily){
        editor.style.fontFamily = p.fontFamily;
        fontFamily.value = p.fontFamily;
      }
      if(p.fontSize){
        fontSize.value = p.fontSize;
        editor.style.fontSize = p.fontSize + 'px';
      }
      if(p.color) colorPicker.value = p.color;
    }catch(e){console.warn('prefs load', e)}
  }

  function savePrefs(){
    const p = { fontFamily: fontFamily.value, fontSize: fontSize.value, color: colorPicker.value };
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  }

  // Theme button click
  themeBtn.addEventListener('click', () => {
    themeModal.style.display = 'flex';
  });

  // Close modal on background click
  themeModal.addEventListener('click', (e) => {
    if(e.target === themeModal){
      themeModal.style.display = 'none';
    }
  });

  // Theme selection
  themeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      const theme = opt.dataset.theme;
      applyTheme(theme);
      themeModal.style.display = 'none';
    });
  });	// Toolbar actions
	tools.forEach(btn => btn.addEventListener('click', (e) => {
		const cmd = btn.dataset.cmd;
		if(cmd === 'insertHorizontalRule'){
			document.execCommand('insertHorizontalRule');
		} else {
			document.execCommand(cmd, false, null);
		}
		editor.focus();
		updateToolbarState();
	}));

	// Color change
	colorPicker.addEventListener('input', (e) => {
		document.execCommand('foreColor', false, e.target.value);
		savePrefs();
		editor.focus();
	});

	// Font family change
	fontFamily.addEventListener('change', (e) => {
		editor.style.fontFamily = e.target.value;
		savePrefs();
		editor.focus();
	});

	// Font size handler
	fontSize.addEventListener('change', (e) => {
		const size = e.target.value + 'px';
		const selection = window.getSelection();
		
		// Check if there's selected text
		if(selection && selection.toString().length > 0){
			// Apply to selected text only
			const range = selection.getRangeAt(0);
			const span = document.createElement('span');
			span.style.fontSize = size;
			
			try{
				// Wrap selected content in span
				span.appendChild(range.extractContents());
				range.insertNode(span);
				
				// Clean up: merge with parent if parent already has fontSize
				if(span.parentNode && span.parentNode !== editor){
					const parent = span.parentNode;
					if(parent.style && parent.style.fontSize){
						// Parent already has fontSize, replace it
						parent.style.fontSize = size;
						// Move span contents to parent
						while(span.firstChild){
							parent.insertBefore(span.firstChild, span);
						}
						parent.removeChild(span);
					}
				}
				
				// Restore selection
				selection.removeAllRanges();
				const newRange = document.createRange();
				newRange.selectNodeContents(span.parentNode ? span : editor);
				newRange.collapse(false);
				selection.addRange(newRange);
			}catch(err){
				console.warn('fontSize selection error:', err);
			}
		} else {
			// No selection - set default font size for editor (affects new text)
			editor.style.fontSize = size;
		}
		
		savePrefs();
		editor.focus();
	});

	// Save / Clear
	saveBtn.addEventListener('click', () => {
		localStorage.setItem(STORAGE_KEY, editor.innerHTML);
		updateStatus('saved');
	});

	clearBtn.addEventListener('click', () => {
		if(confirm('Clear the note? This cannot be undone.')){
			editor.innerHTML = '';
			localStorage.removeItem(STORAGE_KEY);
			updateStatus('idle');
		}
	});

	// Autosave on input (throttled)
	let saveTimer = null;
	editor.addEventListener('input', () => {
		updateStatus('typing');
		if(saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(()=>{
			localStorage.setItem(STORAGE_KEY, editor.innerHTML);
			updateStatus('saved');
		}, 900);
	});

  // Load content, prefs, and theme
  window.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved) editor.innerHTML = saved;
    loadPrefs();
    updateToolbarState();
  });

	// Keyboard shortcuts (Ctrl+B/I/U, Escape to close modal)
	document.addEventListener('keydown', (e) => {
		// Close modal with Escape
		if(e.key === 'Escape' && themeModal.style.display === 'flex'){
			themeModal.style.display = 'none';
			return;
		}
		
		if((e.ctrlKey || e.metaKey) && !e.shiftKey){
			const k = e.key.toLowerCase();
			if(k === 'b'){ e.preventDefault(); document.execCommand('bold'); }
			if(k === 'i'){ e.preventDefault(); document.execCommand('italic'); }
			if(k === 'u'){ e.preventDefault(); document.execCommand('underline'); }
		}
	});

	// Keep focus inside editor when clicking tools
	document.querySelectorAll('.tool').forEach(t=>t.addEventListener('mousedown', e=>e.preventDefault()));

	// Toolbar active state update
	function updateToolbarState(){
		tools.forEach(btn => {
			const cmd = btn.dataset.cmd;
			try{
				const active = document.queryCommandState(cmd);
				if(active) btn.classList.add('active'); else btn.classList.remove('active');
			}catch(e){ /* some commands not queryable */ }
		});
	}

  document.addEventListener('selectionchange', updateToolbarState);  document.addEventListener('keyup', updateToolbarState);
  document.addEventListener('click', updateToolbarState);

  // Add smooth fade-in on load
  window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.4s ease';
    setTimeout(() => { document.body.style.opacity = '1'; }, 50);
  });

})();