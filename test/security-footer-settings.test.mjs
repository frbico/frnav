import test from 'node:test';
import assert from 'node:assert/strict';

import { buildNotFoundResponse, routeCatchAllRequest } from '../functions/[[path]].js';
import {
  getSettingsKeys,
  normalizeSettingValueForStorage,
  parseSettings,
} from '../functions/lib/settings-parser.js';

test('catch-all delegates the real homepage instead of turning / into a 404', async () => {
  let called = false;
  const response = await routeCatchAllRequest(
    { request: new Request('https://example.com/') },
    async (context) => {
      called = true;
      assert.equal(new URL(context.request.url).pathname, '/');
      return new Response('homepage-ok', { status: 200 });
    }
  );

  assert.equal(called, true);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'homepage-ok');
});

test('unknown page routes return a real 404 instead of the raw homepage template', async () => {
  const response = buildNotFoundResponse(new Request('https://example.com/random-dictionary-path'));
  const body = await response.text();

  assert.equal(response.status, 404);
  assert.match(response.headers.get('Content-Type'), /text\/html/);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.match(body, /404/);
  assert.doesNotMatch(body, /\{\{(?:SITES_GRID|CATALOG_LINKS|FOOTER_TEXT)\}\}/);
});

test('unknown API routes return JSON 404 responses', async () => {
  const response = buildNotFoundResponse(new Request('https://example.com/api/does-not-exist'));
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.match(response.headers.get('Content-Type'), /application\/json/);
  assert.deepEqual(body, { code: 404, message: 'Not Found' });
});

test('footer settings are part of the public settings schema with safe defaults', () => {
  const keys = getSettingsKeys();
  assert.ok(keys.includes('home_footer_show_github'));
  assert.ok(keys.includes('home_footer_github_url'));
  assert.ok(keys.includes('home_footer_copyright_text'));

  const settings = parseSettings([]);
  assert.equal(settings.home_footer_show_github, true);
  assert.equal(settings.home_footer_github_url, 'https://slink.661388.xyz/iori-nav');
  assert.equal(settings.home_footer_copyright_text, '© {year}');
});

test('footer GitHub URL only accepts http/https and copyright text can be customized', () => {
  assert.equal(normalizeSettingValueForStorage('home_footer_github_url', 'javascript:alert(1)').ok, false);

  const safeUrl = normalizeSettingValueForStorage('home_footer_github_url', 'https://github.com/example/project');
  assert.equal(safeUrl.ok, true);
  assert.equal(safeUrl.value, 'https://github.com/example/project');

  const copyright = normalizeSettingValueForStorage('home_footer_copyright_text', 'Copyright {year}');
  assert.deepEqual(copyright, { ok: true, value: 'Copyright {year}' });

  const hidden = normalizeSettingValueForStorage('home_footer_show_github', false);
  assert.deepEqual(hidden, { ok: true, value: 'false' });
});
