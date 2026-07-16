import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { slugify } from '@app/common';
import { AppModule } from '../app.module';
import { Genre } from '../entities/genre.entity';

/**
 * One-off CLI script — not a REST endpoint. Seeds the fixed genre list used by
 * the category filter pills and the admin "required genre" dropdown. Safe to
 * re-run: existing genres (matched by slug) are left untouched.
 * Usage: npm run seed:genres
 */
const GENRE_NAMES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Horror',
  'Sci-Fi',
  'Romance',
  'Animation',
  'Documentary',
];

async function run() {
  // abortOnError: false — without it, Nest calls process.exit(1) directly on a
  // bootstrap failure (e.g. bad DB credentials) before this function's own
  // catch ever runs, hiding the real error.
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
    abortOnError: false,
  });

  try {
    const genres = app.get<Repository<Genre>>(getRepositoryToken(Genre));

    for (const name of GENRE_NAMES) {
      const slug = slugify(name);
      const existing = await genres.findOne({ where: { slug } });
      if (existing) {
        console.log(`Skipped "${name}" (already exists).`);
        continue;
      }
      await genres.save(genres.create({ name, slug }));
      console.log(`Created "${name}".`);
    }
  } finally {
    await app.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
