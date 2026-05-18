<script lang="ts">
  import { onMount } from 'svelte';

  type Pref = 'light' | 'dark' | 'system';

  function readPref(): Pref {
    if (typeof localStorage === 'undefined') return 'system';
    const v = localStorage.getItem('theme');
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  }

  let pref = $state<Pref>('system');
  let mounted = $state(false);

  function resolve(p: Pref): 'sonner-light' | 'sonner-dark' {
    if (p === 'light') return 'sonner-light';
    if (p === 'dark') return 'sonner-dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'sonner-dark'
      : 'sonner-light';
  }

  function apply(p: Pref) {
    document.documentElement.setAttribute('data-theme', resolve(p));
  }

  function choose(p: Pref) {
    pref = p;
    try {
      localStorage.setItem('theme', p);
    } catch (_) {
      /* ignore */
    }
    apply(p);
  }

  onMount(() => {
    pref = readPref();
    mounted = true;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (pref === 'system') apply('system');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  });
</script>

<div
  class="join border border-base-300 rounded-field"
  role="group"
  aria-label="Theme"
>
  <button
    type="button"
    class="join-item btn btn-ghost btn-xs"
    class:btn-active={mounted && pref === 'light'}
    aria-pressed={mounted && pref === 'light'}
    aria-label="Light theme"
    title="Light"
    onclick={() => choose('light')}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </svg>
  </button>
  <button
    type="button"
    class="join-item btn btn-ghost btn-xs"
    class:btn-active={mounted && pref === 'system'}
    aria-pressed={mounted && pref === 'system'}
    aria-label="System theme"
    title="System"
    onclick={() => choose('system')}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 18v3" />
    </svg>
  </button>
  <button
    type="button"
    class="join-item btn btn-ghost btn-xs"
    class:btn-active={mounted && pref === 'dark'}
    aria-pressed={mounted && pref === 'dark'}
    aria-label="Dark theme"
    title="Dark"
    onclick={() => choose('dark')}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
    </svg>
  </button>
</div>
