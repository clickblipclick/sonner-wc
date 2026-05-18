import { highlight } from '$lib/shiki';

const installCmd = 'npm install sonner-wc';
const usageSnippet = `<body>
  <!-- your html here -->
  <script type="module" src="https://unpkg.com/sonner-wc/dist/sonner-wc.bundle.js"><\/script>
  <sonner-toaster position="bottom-right" theme="system"></sonner-toaster>
</body>`;

export async function load() {
  const [installHtml, usageHtml] = await Promise.all([
    highlight(installCmd, 'sh'),
    highlight(usageSnippet, 'html'),
  ]);
  return { installCmd, usageSnippet, installHtml, usageHtml };
}
