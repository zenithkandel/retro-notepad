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

  // MS Word-style formatting state
  let pendingFormat = {
    fontFamily: null,
    fontSize: null,
    color: null
  };

  // Apply formatting to selection or set pending format
  function applyFormat(type, value){
    const selection = window.getSelection();
    
    if(selection && selection.toString().length > 0){
      // Has selection - apply formatting to selected text
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      
      // Apply the specific formatting
      if(type === 'fontFamily') span.style.fontFamily = value;
      if(type === 'fontSize') span.style.fontSize = value + 'px';
      if(type === 'color') span.style.color = value;
      
      // Wrap selection
      try{
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
        
        // Restore selection
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }catch(err){
        console.warn('Format apply error:', err);
      }
    } else {
      // No selection - set pending format for next typed text
      pendingFormat[type] = value;
    }
    
    editor.focus();
  }

  // Listen for typing to apply pending formats
  let formatApplied = false;
  editor.addEventListener('keypress', (e) => {
    // Check if we have pending formats and haven't applied them yet
    if(!formatApplied && (pendingFormat.fontFamily || pendingFormat.fontSize || pendingFormat.color)){
      const selection = window.getSelection();
      if(selection.rangeCount > 0){
        const range = selection.getRangeAt(0);
        
        // Create span with pending formats
        const span = document.createElement('span');
        if(pendingFormat.fontFamily) span.style.fontFamily = pendingFormat.fontFamily;
        if(pendingFormat.fontSize) span.style.fontSize = pendingFormat.fontSize + 'px';
        if(pendingFormat.color) span.style.color = pendingFormat.color;
        
        // Insert a zero-width space to anchor the span
        span.appendChild(document.createTextNode('\u200B'));
        
        try{
          range.insertNode(span);
          
          // Move cursor inside the span
          range.setStart(span.firstChild, 1);
          range.setEnd(span.firstChild, 1);
          selection.removeAllRanges();
          selection.addRange(range);
          
          formatApplied = true;
          
          // Clear pending after a short delay
          setTimeout(() => {
            formatApplied = false;
          }, 100);
        }catch(err){
          console.warn('Pending format error:', err);
        }
      }
    }
  });

  // Reset pending format when user clicks elsewhere or selects text
  editor.addEventListener('mouseup', () => {
    const selection = window.getSelection();
    if(selection && selection.toString().length > 0){
      // Clear pending when selecting text
      pendingFormat = { fontFamily: null, fontSize: null, color: null };
    }
  });

  // Font Family change
  fontFamily.addEventListener('change', (e) => {
    applyFormat('fontFamily', e.target.value);
    savePrefs();
  });

  // Font Size change
  fontSize.addEventListener('change', (e) => {
    applyFormat('fontSize', e.target.value);
    savePrefs();
  });

  // Color change
  colorPicker.addEventListener('input', (e) => {
    applyFormat('color', e.target.value);
    savePrefs();
  });	// Save / Clear
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