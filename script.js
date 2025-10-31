// Minimal editor behavior for Retro Notepad
(() => {
	const editor = document.getElementById('editor');
	const tools = document.querySelectorAll('.tool[data-cmd]');
	const colorPicker = document.getElementById('colorPicker');
	const fontSize = document.getElementById('fontSize');
	const saveBtn = document.getElementById('saveBtn');
	const clearBtn = document.getElementById('clearBtn');
	const status = document.getElementById('status');
	const STORAGE_KEY = 'retro-notes-content-v1';

	// Ensure styleWithCSS so font color/sizing uses inline styles
	document.execCommand('styleWithCSS', false, true);

	function updateStatus(txt){
		status.textContent = txt;
		if(txt==='saved'){
			setTimeout(()=>{ if(status.textContent==='saved') status.textContent='idle' },900);
		}
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
	}));

	// Color change
	colorPicker.addEventListener('input', (e) => {
		document.execCommand('foreColor', false, e.target.value);
		editor.focus();
	});

	// Font size: we use execCommand with fontSize then normalize <font> to inline style
	const sizeMap = { '10':'12px','12':'13px','14':'14px','16':'16px','18':'18px','22':'22px' };
	function normalizeFontTags(){
		// convert <font size="X"> to span with style
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

	fontSize.addEventListener('change', (e) => {
		const px = e.target.value;
		document.execCommand('fontSize', false, 7); // 1..7 -> we'll replace
		// adjust recently added font[size="7"] elements to chosen px
		// choose mapping by selecting all font tags and setting style
		const fonts = editor.querySelectorAll('font');
		fonts.forEach(f => {
			f.removeAttribute('size');
			f.style.fontSize = px + 'px';
		});
		normalizeFontTags();
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

	// Load content
	window.addEventListener('DOMContentLoaded', () => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if(saved) editor.innerHTML = saved;
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

})();
