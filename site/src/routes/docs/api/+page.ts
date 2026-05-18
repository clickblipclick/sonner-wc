import { highlight } from '$lib/shiki';

const toastFn = `import { toast } from 'sonner-wc';

toast('Default message');
toast.success('Saved');
toast.error('Oops');
toast.info('FYI');
toast.warning('Heads up');
toast.loading('Working…', { duration: Infinity });
toast.message('Same as toast(), explicit form');`;

const promiseSnippet = `toast.promise(savePost(), {
  loading: 'Saving…',
  success: (data) => \`Saved "\${data.title}"\`,
  error: (err) => \`Failed: \${err.message}\`,
});`;

const customSnippet = `toast.custom((id) => {
  const el = document.createElement('div');
  el.textContent = \`Custom toast #\${id}\`;
  return el;
});`;

const dismissSnippet = `const id = toast.loading('Working…');
// later…
toast.dismiss(id);

// or dismiss everything
toast.dismiss();

// update a toast in place by reusing its id
toast.loading('Working…', { id: 'job-1' });
toast.success('Done', { id: 'job-1' });`;

export async function load() {
  const [toastFnHtml, promiseHtml, customHtml, dismissHtml] = await Promise.all([
    highlight(toastFn, 'ts'),
    highlight(promiseSnippet, 'ts'),
    highlight(customSnippet, 'ts'),
    highlight(dismissSnippet, 'ts'),
  ]);
  return {
    toastFn,
    promiseSnippet,
    customSnippet,
    dismissSnippet,
    toastFnHtml,
    promiseHtml,
    customHtml,
    dismissHtml,
  };
}
