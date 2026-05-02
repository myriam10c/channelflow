# Automatisation contenu carousel — Havn Stays

Ce dossier contient les sorties générées automatiquement pour des carrousels éducatifs quotidiens.

## Générer 30 jours de contenus

```bash
npm run content:generate
```

## Générer une période personnalisée

```bash
npm run content:generate -- 2026-05-03 14
```

- 1er argument: date de départ (`YYYY-MM-DD`)
- 2e argument: nombre de jours

## Format de sortie

Un fichier JSON est créé dans `content/` avec:
- `date`
- `topic`
- `hook`
- `caption`
- `hashtags`
- `slides` (5 slides prêtes pour un carousel)

Vous pouvez brancher ce JSON vers Canva API / Make / Zapier / Buffer pour publication automatique.
