import './styles.css';
import { App } from './app.js';
import { settings } from './core/settings.js';

const qs = new URLSearchParams(location.search);
if (qs.get('city')) settings.set('city', qs.get('city'), true);
if (qs.get('quality')) settings.set('quality', qs.get('quality'), true);

const app = new App();
window.__rainfall = app;
window.__settings = settings;
app.init().catch((e) => {
  console.error(e);
});
