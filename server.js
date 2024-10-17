import axios from 'axios';
import * as dateFns from 'date-fns';
import express from 'express';
import path from 'node:path';
import { createClient } from 'redis';

const client = await createClient()
  .on('error', (error) => console.error('Redis Client Error', error))
  .on('ready', () => console.info('Redis client started'))
  .connect();

await client.ping();

const app = express();

app.use(express.static(path.join(import.meta.dirname, 'public')));

app.set('view engine', 'pug');

app.locals.dateFns = dateFns;

app.get('/', (_req, res) => {
  res.render('home', {
    title: 'Search Hacker News',
  });
});

async function searchHN(query) {
  const response = await axios.get(
    `https://hn.algolia.com/api/v1/search?query=${query}&tags=story&hitsPerPage=90`,
  );

  return response.data;
}

app.get('/search', async (req, res, next) => {
  try {
    const searchQuery = req.query.q;

    if (!searchQuery) {
      res.redirect(302, '/');
      return;
    }

    const results = await searchHN(searchQuery);

    res.render('search', {
      title: `Search results for: ${searchQuery}`,
      searchResults: results,
      searchQuery,
    });
  } catch (err) {
    next(err);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);

  res.set('Content-Type', 'text/html');
  res.status(500).send('<h1>Internal Server Error</h1>');
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.info(`Hacker news server started on port: ${server.address().port}`);
});
