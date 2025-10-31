// Minimal editor behavior for Retro Notepad with custom cursor and preferences
(() => {
	const editor = document.getElementById('editor');
	const tools = document.querySelectorAll('.tool[data-cmd]');
	const colorPicker = document.getElementById('colorPicker');
	const fontSize = document.getElementById('fontSize');
	const fontFamily = document.getElementById('fontFamily');
	const saveBtn = document.getElementById('saveBtn');
	const clearBtn = document.getElementById('clearBtn');
	const status = document.getElementById('status');
	const STORAGE_KEY = 'retro-notes-content-v1';
	const PREFS_KEY = 'retro-notes-prefs-v1';

	// Cursor elements
	const cursor = document.getElementById('custom-cursor');
	const cursorLabel = document.getElementById('cursor-label');

	// Ensure styleWithCSS so font color/sizing uses inline styles
	document.execCommand('styleWithCSS', false, true);

	function updateStatus(txt){
		status.textContent = txt;
		if(txt==='saved'){
			setTimeout(()=>{ if(status.textContent==='saved') status.textContent='idle' },900);
		}
	}

	// Preferences handling
	function loadPrefs(){
		try{
			const raw = localStorage.getItem(PREFS_KEY);
			if(!raw) return;
			const p = JSON.parse(raw);
			if(p.fontFamily) editor.style.fontFamily = p.fontFamily;
			if(p.fontSize){
				fontSize.value = p.fontSize;
				applyFontSizeValue(p.fontSize);
			}
			if(p.color) colorPicker.value = p.color;
			if(p.fontFamily) fontFamily.value = p.fontFamily;
		}catch(e){console.warn('prefs load', e)}
	}

	function savePrefs(){
		const p = { fontFamily: fontFamily.value, fontSize: fontSize.value, color: colorPicker.value };
		localStorage.setItem(PREFS_KEY, JSON.stringify(p));
	}

	// Toolbar actions
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

	// Font size: we use execCommand with fontSize then normalize <font> to inline style
	const sizeMap = { '10':'12px','12':'13px','14':'14px','16':'16px','18':'18px','22':'22px' };
	function normalizeFontTags(){
		const fonts = editor.querySelectorAll('font');
		fonts.forEach(f => {
			const sz = f.getAttribute('size');
			const px = sizeMap[sz] || null;
			const span = document.createElement('span');
			if(px) span.style.fontSize = px;
			span.innerHTML = f.innerHTML;
			f.parentNode.replaceChild(span, f);
		});
	}

	function applyFontSizeValue(value){
		// set editor base font-size for content (affects plain text not styled segments)
		editor.style.fontSize = value + 'px';
	}

	fontSize.addEventListener('change', (e) => {
		const px = e.target.value;
		// try to change selection size if something selected
		document.execCommand('fontSize', false, 7);
		const fonts = editor.querySelectorAll('font');
		fonts.forEach(f => {
			f.removeAttribute('size');
			f.style.fontSize = px + 'px';
		});
		normalizeFontTags();
		applyFontSizeValue(px);
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

	// Load content and prefs
	window.addEventListener('DOMContentLoaded', () => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if(saved) editor.innerHTML = saved;
		loadPrefs();
		updateToolbarState();
	});

	// Keyboard shortcuts (Ctrl+B/I/U)
	document.addEventListener('keydown', (e) => {
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

	document.addEventListener('selectionchange', () => {
		updateToolbarState();
		updateSelectionInfo();
	});

	document.addEventListener('keyup', updateToolbarState);
	document.addEventListener('click', updateToolbarState);

	// Selection info shown in cursor label
	function updateSelectionInfo(){
		const sel = window.getSelection();
		if(!sel) return;
		const text = sel.toString();
		if(text.length > 0){
			cursor.classList.add('cursor--select');
			cursorLabel.textContent = `${text.length} selected`;
		} else {
			cursor.classList.remove('cursor--select');
			cursorLabel.textContent = '';
		}
	}

	// Custom cursor behavior
	let mouseX = -9999, mouseY = -9999;
	let rafId = null;
	function onPointerMove(e){
		mouseX = e.clientX;
		mouseY = e.clientY;
	}

	function animateCursor(){
		if(cursor){
			cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
		}
		rafId = requestAnimationFrame(animateCursor);
	}

	// Hover detection for interactive elements
	document.addEventListener('mouseover', (e) => {
		const interactive = e.target.closest('button, a, select, input, .tool');
		if(interactive) cursor.classList.add('cursor--hover');
	});
	document.addEventListener('mouseout', (e) => {
		const related = e.relatedTarget;
		// if leaving to another interactive element, keep hover
		if(related && related.closest && related.closest('button, a, select, input, .tool')) return;
		cursor.classList.remove('cursor--hover');
	});

	document.addEventListener('mousedown', (e) => { cursor.classList.add('cursor--active'); });
	document.addEventListener('mouseup', (e) => { cursor.classList.remove('cursor--active'); });

	document.addEventListener('pointermove', onPointerMove);
	document.addEventListener('pointerleave', () => { cursor.style.opacity = 0; });
	document.addEventListener('pointerenter', () => { cursor.style.opacity = 1; });

	// Start cursor animation loop
	animateCursor();

})();
