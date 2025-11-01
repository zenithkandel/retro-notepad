// Enhanced editor behavior for Retro Notepad with themes
(() => {
  const editor = document.getElementById('editor');
  const tools = document.querySelectorAll('.tool[data-cmd]');
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');
  const themeBtn = document.getElementById('themeBtn');
  const themeModal = document.getElementById('themeModal');
	const themeOptions = document.querySelectorAll('.theme-option');
	const status = document.getElementById('status');
	const focusBtn = document.getElementById('focusBtn');
	const focusToast = document.getElementById('focusToast');
	// Specific refs for core style toggles
	const boldBtn = document.querySelector('.tool[data-cmd="bold"]');
	const italicBtn = document.querySelector('.tool[data-cmd="italic"]');
	const underlineBtn = document.querySelector('.tool[data-cmd="underline"]');
	// Font controls (center toolbar) — may be absent on some versions
	const fontFamily = document.getElementById('fontFamily');
	const fontSize = document.getElementById('fontSize');
	const colorPicker = document.getElementById('colorPicker');
  const STORAGE_KEY = 'retro-notes-content-v1';
	const THEME_KEY = 'retro-notes-theme-v1';
	const FOCUS_KEY = 'retro-notes-focus-v1';	// Ensure styleWithCSS so font color/sizing uses inline styles
	document.execCommand('styleWithCSS', false, true);

	// Pending formatting for Word-like behavior when caret is collapsed
		const pending = { fontFamily: null, fontSize: null, color: null, bold: false, italic: false, underline: false };
	let typingSpan = null; // span used for continuous typing with same style

		function applyStyles(el, styles){
		if(styles.fontFamily) el.style.fontFamily = styles.fontFamily;
		if(styles.fontSize) el.style.fontSize = styles.fontSize + 'px';
		if(styles.color) el.style.color = styles.color;
			if(styles.bold) el.style.fontWeight = 'bold';
			if(styles.italic) el.style.fontStyle = 'italic';
			if(styles.underline) el.style.textDecoration = 'underline';
	}

	function hasSelection(){
		const sel = window.getSelection();
		return !!(sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed);
	}

	function wrapSelectionWithSpan(styles){
		const sel = window.getSelection();
		if(!sel || sel.rangeCount === 0) return;
		const range = sel.getRangeAt(0);
		if(range.collapsed) return;
		const span = document.createElement('span');
		applyStyles(span, styles);
		const contents = range.extractContents();
		span.appendChild(contents);
		range.insertNode(span);
		// place caret at end of inserted span
		sel.removeAllRanges();
		const nr = document.createRange();
		nr.selectNodeContents(span);
		nr.collapse(false);
		sel.addRange(nr);
	}

		function stylesMatch(a, b){
		const famOk = (!a.fontFamily && !b.fontFamily) || (a.fontFamily && b.fontFamily && a.fontFamily === b.fontFamily);
		const sizeOk = (!a.fontSize && !b.fontSize) || (a.fontSize && b.fontSize && a.fontSize === b.fontSize);
		const colOk = (!a.color && !b.color) || (a.color && b.color && a.color === b.color);
			const boldOk = (!!a.bold) === (!!b.bold);
			const italicOk = (!!a.italic) === (!!b.italic);
			const underOk = (!!a.underline) === (!!b.underline);
			return famOk && sizeOk && colOk && boldOk && italicOk && underOk;
	}

	// Intercept typing to apply pending styles when caret is collapsed
	editor.addEventListener('beforeinput', (e) => {
		if(!(e.inputType === 'insertText' || e.inputType === 'insertCompositionText')) return;
		if(!(pending.fontFamily || pending.fontSize || pending.color)) return; // no pending formatting
		const sel = window.getSelection();
		if(!sel || sel.rangeCount === 0) return;
		const range = sel.getRangeAt(0);
		if(!range.collapsed) return; // let browser handle replacing selections

		e.preventDefault();
		const text = document.createTextNode(e.data || '');

			// Try to reuse current typing span if caret is at its end and styles match
		if(typingSpan && typingSpan.isConnected){
			const last = typingSpan.lastChild;
			if(last && last.nodeType === Node.TEXT_NODE && range.startContainer === last && range.startOffset === last.length){
				const currentStyles = {
					fontFamily: typingSpan.style.fontFamily || null,
					fontSize: typingSpan.style.fontSize ? parseInt(typingSpan.style.fontSize,10) : null,
						color: typingSpan.style.color || null,
						bold: typingSpan.style.fontWeight && typingSpan.style.fontWeight.toString().toLowerCase() !== 'normal' && typingSpan.style.fontWeight !== '' ? true : false,
						italic: typingSpan.style.fontStyle === 'italic',
						underline: (typingSpan.style.textDecoration || '').toLowerCase().includes('underline'),
				};
				if(stylesMatch(currentStyles, pending)){
					last.parentNode.insertBefore(text, last.nextSibling);
					const nr = document.createRange();
					nr.setStart(text, text.length);
					nr.collapse(true);
					sel.removeAllRanges();
					sel.addRange(nr);
					return;
				}
			}
		}

		// Otherwise create a new span with pending styles
		const span = document.createElement('span');
		applyStyles(span, pending);
		span.appendChild(text);
		range.insertNode(span);
		typingSpan = span;
		const nr = document.createRange();
		nr.setStart(text, text.length);
		nr.collapse(true);
		sel.removeAllRanges();
		sel.addRange(nr);
		});

		// Clear typing span if caret moves away or selection changes significantly
	function resetTypingSpan(){ typingSpan = null; }
	editor.addEventListener('mouseup', resetTypingSpan);
	editor.addEventListener('keyup', (e)=>{ if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)) resetTypingSpan(); });

		// Intercept toolbar for bold/italic/underline to support pending behavior
		function isStyleToggle(cmd){ return cmd === 'bold' || cmd === 'italic' || cmd === 'underline'; }

		// Override toolbar handler to add pending toggles
		// Remove previous listeners by delegating new logic on container
		document.querySelectorAll('.tool[data-cmd]').forEach(btn => {
			btn.replaceWith(btn.cloneNode(true));
		});
		// Re-select after cloning
		const toolButtons = document.querySelectorAll('.tool[data-cmd]');
		toolButtons.forEach(btn => btn.addEventListener('click', () => {
			const cmd = btn.dataset.cmd;
			if(cmd === 'insertHorizontalRule'){
				document.execCommand('insertHorizontalRule');
			} else if(isStyleToggle(cmd)){
				if(hasSelection()){
					// Use native toggle for selection for speed and correctness
					document.execCommand(cmd, false, null);
				} else {
					// Toggle pending state
					if(cmd === 'bold') pending.bold = !pending.bold;
					if(cmd === 'italic') pending.italic = !pending.italic;
					if(cmd === 'underline') pending.underline = !pending.underline;
					// Reflect active state
					if(cmd === 'bold' && boldBtn) boldBtn.classList.toggle('active', pending.bold);
					if(cmd === 'italic' && italicBtn) italicBtn.classList.toggle('active', pending.italic);
					if(cmd === 'underline' && underlineBtn) underlineBtn.classList.toggle('active', pending.underline);
					resetTypingSpan();
				}
			} else {
				document.execCommand(cmd, false, null);
			}
			editor.focus();
			updateToolbarState();
		}));

	// Font controls wiring
	if(fontFamily){
		fontFamily.addEventListener('change', () => {
			const val = fontFamily.value;
			if(hasSelection()){
				wrapSelectionWithSpan({ fontFamily: val });
			} else {
				pending.fontFamily = val;
			}
			editor.focus();
		});
	}

	if(fontSize){
		fontSize.addEventListener('change', () => {
			const val = parseInt(fontSize.value, 10) || null;
			if(hasSelection()){
				wrapSelectionWithSpan({ fontSize: val });
			} else {
				pending.fontSize = val;
			}
			editor.focus();
		});
	}

	if(colorPicker){
		const applyColor = () => {
			const val = colorPicker.value;
			if(hasSelection()){
				wrapSelectionWithSpan({ color: val });
			} else {
				pending.color = val;
			}
			// pulse the color picker wrapper
			const wrap = colorPicker.parentElement;
			if(wrap){
				wrap.classList.remove('pulse');
				// force reflow to restart animation
				void wrap.offsetWidth;
				wrap.classList.add('pulse');
			}
			editor.focus();
		};
		colorPicker.addEventListener('input', applyColor);
		colorPicker.addEventListener('change', applyColor);
	}

	// Focus mode toggle
	if(focusBtn){
		focusBtn.addEventListener('click', toggleFocusMode);
	}

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

	function closeThemeModalAnimated(){
		themeModal.classList.remove('open');
		themeModal.addEventListener('transitionend', () => { themeModal.style.display = 'none'; }, { once:true });
	}

	// Focus Mode helpers
	function setFocusMode(enabled){
		document.body.classList.toggle('focus-mode', enabled);
		localStorage.setItem(FOCUS_KEY, enabled ? '1' : '0');
		if(focusBtn){
			const icon = focusBtn.querySelector('i');
			if(icon){
				icon.classList.toggle('fa-eye', enabled);
				icon.classList.toggle('fa-eye-slash', !enabled);
			}
		}
		if(enabled){
			if(focusToast){
				focusToast.style.display = 'block';
				focusToast.classList.add('show');
				setTimeout(()=>{ focusToast.classList.remove('show'); }, 1200);
				setTimeout(()=>{ if(!focusToast.classList.contains('show')) focusToast.style.display = 'none'; }, 1500);
			}
			ensureCaretCentered();
		}
	}

	function toggleFocusMode(){
		setFocusMode(!document.body.classList.contains('focus-mode'));
	}

	function loadFocus(){
		const saved = localStorage.getItem(FOCUS_KEY) === '1';
		setFocusMode(saved);
	}

	function ensureCaretCentered(){
		if(!document.body.classList.contains('focus-mode')) return;
		const sel = window.getSelection();
		if(!sel || sel.rangeCount === 0) return;
		const range = sel.getRangeAt(0).cloneRange();
		range.collapse(true);
		const rects = range.getClientRects();
		if(!rects || rects.length === 0) return;
		const caretRect = rects[rects.length - 1];
		const edRect = editor.getBoundingClientRect();
		const caretYInEditor = (caretRect.top - edRect.top) + editor.scrollTop;
		const target = editor.scrollTop + (editor.clientHeight / 2);
		const delta = caretYInEditor - target;
		if(Math.abs(delta) > 10){
			editor.scrollTop += delta;
		}
	}



	// Theme button click (animated open)
	themeBtn.addEventListener('click', () => {
		themeModal.style.display = 'flex';
		requestAnimationFrame(() => themeModal.classList.add('open'));
	});

	// Close modal on background click (animated close)
	themeModal.addEventListener('click', (e) => {
		if(e.target === themeModal){
			themeModal.classList.remove('open');
			themeModal.addEventListener('transitionend', () => { themeModal.style.display = 'none'; }, { once:true });
		}
	});

  // Theme selection
  themeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      const theme = opt.dataset.theme;
	applyTheme(theme);
	closeThemeModalAnimated();
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

  // Load content and theme
  window.addEventListener('DOMContentLoaded', () => {
    loadTheme();
		loadFocus();
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved) editor.innerHTML = saved;
    updateToolbarState();
  });

	// Keyboard shortcuts (Ctrl+B/I/U, Escape to close modal)
	document.addEventListener('keydown', (e) => {
		// Close modal with Escape
		if(e.key === 'Escape'){
			if(themeModal.style.display === 'flex'){
				closeThemeModalAnimated();
				return;
			}
			if(document.body.classList.contains('focus-mode')){
				setFocusMode(false);
				return;
			}
		}
		
		if((e.ctrlKey || e.metaKey) && !e.shiftKey){
			const k = e.key.toLowerCase();
			const sel = window.getSelection();
			const collapsed = !!(sel && sel.rangeCount && sel.getRangeAt(0).collapsed);
			if(k === 'b'){
				e.preventDefault();
				if(collapsed){ pending.bold = !pending.bold; if(boldBtn) boldBtn.classList.toggle('active', pending.bold); resetTypingSpan(); }
				else { document.execCommand('bold'); }
			}
			if(k === 'i'){
				e.preventDefault();
				if(collapsed){ pending.italic = !pending.italic; if(italicBtn) italicBtn.classList.toggle('active', pending.italic); resetTypingSpan(); }
				else { document.execCommand('italic'); }
			}
			if(k === 'u'){
				e.preventDefault();
				if(collapsed){ pending.underline = !pending.underline; if(underlineBtn) underlineBtn.classList.toggle('active', pending.underline); resetTypingSpan(); }
				else { document.execCommand('underline'); }
			}
		}

		// F9 toggles focus mode
		if(e.key === 'F9'){
			e.preventDefault();
			toggleFocusMode();
		}
	});

	// Keep focus inside editor when clicking tools
	document.querySelectorAll('.tool').forEach(t=>t.addEventListener('mousedown', e=>e.preventDefault()));

	// Center caret while typing in focus mode
	editor.addEventListener('input', ensureCaretCentered);
	document.addEventListener('selectionchange', () => {
		if(document.activeElement === editor) setTimeout(ensureCaretCentered, 0);
	});

	// Flash status on save
	const statusSpan = status; // span element already selected as #status
	const _origUpdateStatus = updateStatus;
	function updateStatus(txt){
		statusSpan.textContent = txt;
		if(txt === 'saved'){
			statusSpan.classList.add('flash');
			setTimeout(()=> statusSpan.classList.remove('flash'), 500);
			setTimeout(()=>{ if(statusSpan.textContent==='saved') statusSpan.textContent='idle' },900);
		}
	}

		// Toolbar active state update
		function updateToolbarState(){
			const sel = window.getSelection();
			const collapsed = !!(sel && sel.rangeCount && sel.getRangeAt(0).collapsed);
			const btns = document.querySelectorAll('.tool[data-cmd]');
			btns.forEach(btn => {
				const cmd = btn.dataset.cmd;
				try{
					const active = document.queryCommandState(cmd);
					if(active) btn.classList.add('active'); else btn.classList.remove('active');
				}catch(e){ /* some commands not queryable */ }
			});
			// If caret is collapsed, reflect pending toggles for B/I/U
			if(collapsed){
				if(boldBtn) boldBtn.classList.toggle('active', pending.bold || document.queryCommandState('bold'));
				if(italicBtn) italicBtn.classList.toggle('active', pending.italic || document.queryCommandState('italic'));
				if(underlineBtn) underlineBtn.classList.toggle('active', pending.underline || document.queryCommandState('underline'));
			}
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